import {
  BeadColor,
  ConversionConfig,
  ConversionResult,
  PixelInfo,
} from "../types";
import { ColorPalette } from "./ColorPalette";
import type { ProcessedImage } from "../utils/image-processor";
import { rgbToLab, ColorMatcher } from "../utils/color-matcher";

/**
 * MagicBeans 主类 - 拼豆像素图转换器
 */
export class MagicBeans {
  private palette!: ColorPalette;
  private config: Required<ConversionConfig>;
  private result?: ConversionResult;
  private history: ConversionResult[] = [];
  private redoStack: ConversionResult[] = [];
  private inBatch = false;
  private batchOriginal?: ConversionResult;

  constructor(config: ConversionConfig = {}) {
    // 设置默认配置
    this.config = {
      width: config.width || 32,
      height: config.height || 32,
      palette: config.palette || "coco",
      maintainAspectRatio: config.maintainAspectRatio !== false,
      backgroundColor: config.backgroundColor || { r: 255, g: 255, b: 255 },
    };

    // 初始化色卡
    this.initializePalette();
  }

  /**
   * 初始化色卡
   */
  private initializePalette(): void {
    this.palette = ColorPalette.fromPaletteParam(this.config.palette);
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ConversionConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 如果色卡配置发生变化，重新初始化色卡
    if (newConfig.palette !== undefined) {
      this.initializePalette();
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): Required<ConversionConfig> {
    return { ...this.config };
  }

  /**
   * 获取当前色卡
   */
  getPalette(): ColorPalette {
    return this.palette;
  }

  /**
   * 加载现有转换结果到控制器
   */
  loadResult(result: ConversionResult): void {
    this.result = {
      pixels: [...result.pixels],
      dimensions: { ...result.dimensions },
      palette: [...result.palette],
      colorStats: { ...result.colorStats },
    };
    // 清空历史堆栈（加载新结果后历史无效）
    this.history = [];
    this.redoStack = [];
  }

  /**
   * 获取当前控制器持有的转换结果
   */
  getResult(): ConversionResult | undefined {
    return this.result ? {
      pixels: [...this.result.pixels],
      dimensions: { ...this.result.dimensions },
      palette: [...this.result.palette],
      colorStats: { ...this.result.colorStats },
    } : undefined;
  }

  private snapshot(res?: ConversionResult): ConversionResult {
    const r = res ?? this.result;
    if (!r) throw new Error("当前没有加载的转换结果");
    return {
      pixels: r.pixels.map(p => ({ ...p })),
      dimensions: { ...r.dimensions },
      palette: r.palette.map(c => ({ ...c })),
      colorStats: { ...r.colorStats },
    };
  }

  private recordHistory(): void {
    if (!this.result) return;
    if (this.inBatch) return; // 批量事务中，统一在提交时记录一次
    this.history.push(this.snapshot());
    this.redoStack = [];
  }

  canUndo(): boolean { return this.history.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }

  undo(): ConversionResult {
    if (!this.canUndo()) throw new Error("没有可撤销的操作");
    if (!this.result) throw new Error("当前没有加载的转换结果");
    // 当前入重做栈，恢复历史顶部
    this.redoStack.push(this.snapshot());
    const prev = this.history.pop()!;
    this.result = prev;
    return this.getResult()!;
  }

  redo(): ConversionResult {
    if (!this.canRedo()) throw new Error("没有可重做的操作");
    if (!this.result) throw new Error("当前没有加载的转换结果");
    // 当前入历史栈，应用重做顶部
    this.history.push(this.snapshot());
    const next = this.redoStack.pop()!;
    this.result = next;
    return this.getResult()!;
  }

  startBatch(): void {
    if (this.inBatch) throw new Error("批量编辑已在进行中");
    if (!this.result) throw new Error("当前没有加载的转换结果");
    this.inBatch = true;
    this.batchOriginal = this.snapshot();
  }

  commitBatch(): ConversionResult {
    if (!this.inBatch) throw new Error("没有进行中的批量编辑");
    // 批量一次性记录历史，并清空重做栈
    this.history.push(this.batchOriginal!);
    this.redoStack = [];
    this.inBatch = false;
    this.batchOriginal = undefined;
    return this.getResult()!;
  }

  cancelBatch(): ConversionResult {
    if (!this.inBatch) throw new Error("没有进行中的批量编辑");
    // 回滚到原始快照，不记录历史
    this.result = this.batchOriginal!;
    this.inBatch = false;
    this.batchOriginal = undefined;
    return this.getResult()!;
  }

  runBatch(mutator: (api: this) => void): ConversionResult {
    this.startBatch();
    try {
      mutator(this);
      return this.commitBatch();
    } catch (e) {
      this.cancelBatch();
      throw e;
    }
  }

  /**
   * 重新计算颜色统计与色卡（确保 palette 覆盖所有当前像素颜色）
   */
  private recomputeStatsAndPalette(pixels: PixelInfo[]): {
    colorStats: { [colorName: string]: number };
    palette: BeadColor[];
  } {
    const stats: { [name: string]: number } = {};
    const map = new Map<string, BeadColor>();
    for (const p of pixels) {
      stats[p.beadColor.name] = (stats[p.beadColor.name] || 0) + 1;
      if (!map.has(p.beadColor.name)) map.set(p.beadColor.name, p.beadColor);
    }
    return { colorStats: stats, palette: Array.from(map.values()) };
  }

  /**
   * 从图片源转换为拼豆像素图
   */
  async convertFromSource(source: string | Buffer): Promise<ConversionResult> {
    try {
      // 动态加载 Node-only 图像处理能力
      const img = await import("../utils/image-processor");
      const processedImage = await img.loadImageFromSource(source);

      // 转换图片
      const res = await this.convertFromProcessedImage(processedImage);
      this.result = res;
      return res;
    } catch (error) {
      throw new Error(
        `转换失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 从ProcessedImage转换为拼豆像素图
   */
  async convertFromProcessedImage(
    processedImage: ProcessedImage
  ): Promise<ConversionResult> {
    if (!processedImage) {
      throw new Error("ProcessedImage不能为空");
    }

    try {
      // 动态加载 Node-only 图像处理能力
      const img = await import("../utils/image-processor");
      // 调整图片尺寸
      const resizedImage = await img.resizeImage(
        processedImage,
        this.config.width,
        this.config.height,
        this.config.maintainAspectRatio
      );

      // 获取像素数据
      const imageData = img.getImagePixelData(resizedImage);

      // 使用通用 ColorMatcher（预计算 LAB 提升像素循环匹配效率）
      const paletteColors = this.palette.getColors();
      const matcher = new ColorMatcher(paletteColors, { useLabColorSpace: true });

      // 转换像素颜色（单次遍历原始数据，减少对象创建）
      const pixels: PixelInfo[] = [];
      const colorStats: { [colorName: string]: number } = {};

      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];

          // 处理透明度
          const processedColor = img.processTransparency({ r, g, b, a }, this.config.backgroundColor);

          // 目标颜色的 LAB
          const targetLab = rgbToLab(processedColor);

          // 使用匹配器基于预计算的 LAB 找到最接近颜色
          const beadColor = matcher.closestFromLab(targetLab);

          // 记录像素信息
          const pixelInfo: PixelInfo = {
            x,
            y,
            beadColor,
            originalColor: { r, g, b, a },
          };

          pixels.push(pixelInfo);

          // 统计颜色使用次数
          colorStats[beadColor.name] = (colorStats[beadColor.name] || 0) + 1;
        }
      }

      const result: ConversionResult = {
        pixels,
        dimensions: {
          width: resizedImage.width,
          height: resizedImage.height,
        },
        palette: paletteColors,
        colorStats,
      };
      this.result = result;
      return result;
    } catch (error) {
      throw new Error(
        `转换失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 从浏览器提供的 ImageData 转换为拼豆像素图（纯算法，无 Node 依赖）
   */
  convertFromImageData(
    imageData: { data: Uint8ClampedArray; width: number; height: number },
    options?: { backgroundColor?: { r: number; g: number; b: number } }
  ): ConversionResult {
    if (!imageData || !imageData.data || imageData.width <= 0 || imageData.height <= 0) {
      throw new Error("ImageData 无效，无法进行转换");
    }

    // 使用通用 ColorMatcher（预计算 LAB 提升像素循环匹配效率）
    const paletteColors = this.palette.getColors();
    const matcher = new ColorMatcher(paletteColors, { useLabColorSpace: true });

    const pixels: PixelInfo[] = [];
    const colorStats: { [colorName: string]: number } = {};

    const { width, height, data } = imageData;

    // 本地透明度处理（与 utils/image-processor 中的实现保持一致，可配置背景色）
    const blendAlpha = (
      r: number,
      g: number,
      b: number,
      a: number,
      bg: { r: number; g: number; b: number }
    ): { r: number; g: number; b: number } => {
      const alpha = a / 255;
      return {
        r: Math.round(r * alpha + bg.r * (1 - alpha)),
        g: Math.round(g * alpha + bg.g * (1 - alpha)),
        b: Math.round(b * alpha + bg.b * (1 - alpha)),
      };
    };

    const bg = options?.backgroundColor ?? this.config.backgroundColor;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];

        // 处理透明度
        const processedColor = blendAlpha(r, g, b, a, bg);

        // LAB 转换并匹配最近色
        const targetLab = rgbToLab(processedColor);
        const beadColor = matcher.closestFromLab(targetLab);

        const pixelInfo: PixelInfo = {
          x,
          y,
          beadColor,
          originalColor: { r, g, b, a },
        };
        pixels.push(pixelInfo);
        colorStats[beadColor.name] = (colorStats[beadColor.name] || 0) + 1;
      }
    }

    const result: ConversionResult = {
      pixels,
      dimensions: { width, height },
      palette: paletteColors,
      colorStats,
    };
    this.result = result;
    return result;
  }

  /**
   * 创建预览图像
   */
  async createPreview(
    result: ConversionResult,
    pixelSize = 10
  ): Promise<Buffer> {
    const previewPixels = result.pixels.map((pixel) => ({
      x: pixel.x,
      y: pixel.y,
      color: {
        r: pixel.beadColor.rgb.r,
        g: pixel.beadColor.rgb.g,
        b: pixel.beadColor.rgb.b,
      },
    }));

    const img = await import("../utils/image-processor");
    return await img.createPreviewImage(
      previewPixels,
      result.dimensions.width,
      result.dimensions.height,
      pixelSize
    );
  }

  /**
   * 保存预览图像到文件
   */
  async savePreview(
    result: ConversionResult,
    filePath: string,
    pixelSize = 10,
    format: "png" | "jpg" | "jpeg" | "webp" = "png"
  ): Promise<void> {
    const previewBuffer = await this.createPreview(result, pixelSize);
    const img = await import("../utils/image-processor");
    await img.saveImageToFile(previewBuffer, filePath, format);
  }

  /**
   * 导出为拼豆图案数据
   */
  exportPattern(result: ConversionResult): {
    pattern: string[][];
    legend: { [colorName: string]: BeadColor };
    statistics: {
      totalBeads: number;
      uniqueColors: number;
      colorUsage: { [colorName: string]: number };
    };
  } {
    const { pixels, dimensions, colorStats } = result;

    // 创建图案矩阵
    const pattern: string[][] = Array(dimensions.height)
      .fill(null)
      .map(() => Array(dimensions.width).fill(""));

    // 创建颜色图例
    const legend: { [colorName: string]: BeadColor } = {};

    // 填充图案和图例
    for (const pixel of pixels) {
      pattern[pixel.y][pixel.x] = pixel.beadColor.name;
      legend[pixel.beadColor.name] = pixel.beadColor;
    }

    return {
      pattern,
      legend,
      statistics: {
        totalBeads: pixels.length,
        uniqueColors: Object.keys(colorStats).length,
        colorUsage: colorStats,
      },
    };
  }

  /**
   * 导出为JSON格式
   */
  exportToJSON(result: ConversionResult): string {
    const exportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        config: this.config,
        palette: this.palette.toJSON(),
      },
      result: {
        ...result,
        pattern: this.exportPattern(result),
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导出为CSV格式（颜色统计）
   */
  exportColorStatsToCSV(result: ConversionResult): string {
    const { colorStats } = result;
    const legend = this.exportPattern(result).legend;

    let csv = "Color Name,Hex,RGB,Brand,Count,Percentage\n";

    const totalBeads = Object.values(colorStats).reduce(
      (sum, count) => sum + count,
      0
    );

    for (const [colorName, count] of Object.entries(colorStats)) {
      const color = legend[colorName];
      const percentage = ((count / totalBeads) * 100).toFixed(2);
      const rgb = `"${color.rgb.r},${color.rgb.g},${color.rgb.b}"`;

      csv += `${colorName},${color.hex},${rgb},${color.brand},${count},${percentage}%\n`;
    }

    return csv;
  }

  /**
   * 批量转换多个图片
   */
  async convertBatch(
    sources: (string | Buffer)[]
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];

    for (const source of sources) {
      try {
        const result = await this.convertFromSource(source);
        results.push(result);
      } catch (error) {
        console.warn(
          `跳过转换失败的图片: ${
            error instanceof Error ? error.message : "未知错误"
          }`
        );
      }
    }

    return results;
  }

  /**
   * 估算拼豆用量
   */
  estimateBeadUsage(result: ConversionResult): {
    totalBeads: number;
    colorBreakdown: Array<{
      color: BeadColor;
      count: number;
      percentage: number;
    }>;
    estimatedCost?: number;
  } {
    const { colorStats } = result;
    const legend = this.exportPattern(result).legend;
    const totalBeads = Object.values(colorStats).reduce(
      (sum, count) => sum + count,
      0
    );

    const colorBreakdown = Object.entries(colorStats)
      .map(([colorName, count]) => ({
        color: legend[colorName],
        count,
        percentage: (count / totalBeads) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalBeads,
      colorBreakdown,
    };
  }

  // ===========================
  // 编辑/操作当前结果（控制器能力）
  // ===========================

  /**
   * 替换某个坐标的颜色（按珠色）
   */
  updatePixelColor(x: number, y: number, beadColor: BeadColor): ConversionResult {
    if (!this.result) throw new Error('当前没有加载的转换结果');
    this.recordHistory();
    const pixels = this.result.pixels.map(p => (p.x === x && p.y === y ? { ...p, beadColor } : p));
    const { colorStats, palette } = this.recomputeStatsAndPalette(pixels);
    this.result = { ...this.result, pixels, colorStats, palette };
    return this.getResult()!;
  }

  /**
   * 按条件批量更新像素
   */
  updatePixelsByPredicate(
    predicate: (p: PixelInfo) => boolean,
    updater: (p: PixelInfo) => PixelInfo
  ): ConversionResult {
    if (!this.result) throw new Error('当前没有加载的转换结果');
    this.recordHistory();
    const pixels = this.result.pixels.map(p => (predicate(p) ? updater({ ...p }) : p));
    const { colorStats, palette } = this.recomputeStatsAndPalette(pixels);
    this.result = { ...this.result, pixels, colorStats, palette };
    return this.getResult()!;
  }

  /**
   * 将所有指定颜色名替换为新的珠色
   */
  replaceColorByName(targetName: string, newBead: BeadColor): ConversionResult {
    return this.updatePixelsByPredicate(
      p => p.beadColor.name === targetName,
      p => ({ ...p, beadColor: newBead })
    );
  }

  /**
   * 删除满足条件的像素
   */
  removePixelsByPredicate(predicate: (p: PixelInfo) => boolean): ConversionResult {
    if (!this.result) throw new Error('当前没有加载的转换结果');
    this.recordHistory();
    const pixels = this.result.pixels.filter(p => !predicate(p));
    const { colorStats, palette } = this.recomputeStatsAndPalette(pixels);
    this.result = { ...this.result, pixels, colorStats, palette };
    return this.getResult()!;
  }

  /**
   * 删除单个坐标像素
   */
  deletePixel(x: number, y: number): ConversionResult {
    return this.removePixelsByPredicate(p => p.x === x && p.y === y);
  }

  /**
   * 增加或覆盖单个像素（按坐标覆盖现有）
   */
  addPixel(pixel: PixelInfo): ConversionResult {
    if (!this.result) throw new Error('当前没有加载的转换结果');
    this.recordHistory();
    const key = (p: PixelInfo) => `${p.x},${p.y}`;
    const map = new Map<string, PixelInfo>();
    for (const p of this.result.pixels) map.set(key(p), p);
    map.set(key(pixel), pixel);
    const pixels = Array.from(map.values());
    const { colorStats, palette } = this.recomputeStatsAndPalette(pixels);
    this.result = { ...this.result, pixels, colorStats, palette };
    return this.getResult()!;
  }

  /**
   * 批量增加或覆盖像素
   */
  addPixels(newPixels: PixelInfo[]): ConversionResult {
    if (!this.result) throw new Error('当前没有加载的转换结果');
    this.recordHistory();
    const key = (p: PixelInfo) => `${p.x},${p.y}`;
    const map = new Map<string, PixelInfo>();
    for (const p of this.result.pixels) map.set(key(p), p);
    for (const p of newPixels) map.set(key(p), p);
    const pixels = Array.from(map.values());
    const { colorStats, palette } = this.recomputeStatsAndPalette(pixels);
    this.result = { ...this.result, pixels, colorStats, palette };
    return this.getResult()!;
  }

  // ===========================
  // 静态工具（全局色卡相关 API）
  // ===========================

  static createPalette(palette: 'mard' | 'coco' | BeadColor[]): ColorPalette {
    return ColorPalette.fromPaletteParam(palette);
  }

  static createMardPalette(): ColorPalette {
    return ColorPalette.createMardPalette();
  }

  static createCocoPalette(): ColorPalette {
    return ColorPalette.createCocoPalette();
  }
}
