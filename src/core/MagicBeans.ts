import {
  BeadColor,
  ConversionConfig,
  ConversionResult,
  PixelInfo,
} from "../types";
import { ColorPalette } from "./ColorPalette";
import {
  loadImageFromSource,
  resizeImage,
  getImagePixelData,
  getAllPixelColors,
  processTransparency,
  createPreviewImage,
  saveImageToFile,
  ProcessedImage,
} from "../utils/image-processor";
import {
  findClosestBeadColor,
  rgbToLab,
  calculateDeltaE,
} from "../utils/color-matcher";

/**
 * MagicBeans 主类 - 拼豆像素图转换器
 */
export class MagicBeans {
  private palette!: ColorPalette;
  private config: Required<ConversionConfig>;

  constructor(config: ConversionConfig = {}) {
    // 设置默认配置
    this.config = {
      width: config.width || 32,
      height: config.height || 32,
      palette: config.palette || "coco",
      maintainAspectRatio: config.maintainAspectRatio !== false,
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
   * 从图片源转换为拼豆像素图
   */
  async convertFromSource(source: string | Buffer): Promise<ConversionResult> {
    try {
      // 加载图片
      const processedImage = await loadImageFromSource(source);

      // 转换图片
      return await this.convertFromProcessedImage(processedImage);
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
      // 调整图片尺寸
      const resizedImage = await resizeImage(
        processedImage,
        this.config.width,
        this.config.height,
        this.config.maintainAspectRatio
      );

      // 获取像素数据
      const imageData = getImagePixelData(resizedImage);

      // 预计算色卡的 LAB 值，避免在每个像素上重复转换
      const paletteColors = this.palette.getColors();
      const paletteLabs = paletteColors.map((c) => ({ color: c, lab: rgbToLab(c.rgb) }));

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
          const processedColor = processTransparency({ r, g, b, a });

          // 目标颜色的 LAB
          const targetLab = rgbToLab(processedColor);

          // 找到最匹配的拼豆颜色（使用预计算的 LAB 避免重复开销）
          let beadColor = paletteLabs[0].color;
          let minDistance = Infinity;
          for (let i = 0; i < paletteLabs.length; i++) {
            const d = calculateDeltaE(targetLab, paletteLabs[i].lab);
            if (d < minDistance) {
              minDistance = d;
              beadColor = paletteLabs[i].color;
            }
          }

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

      return {
        pixels,
        dimensions: {
          width: resizedImage.width,
          height: resizedImage.height,
        },
        palette: paletteColors,
        colorStats,
      };
    } catch (error) {
      throw new Error(
        `转换失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
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

    return await createPreviewImage(
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
    await saveImageToFile(previewBuffer, filePath, format);
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
}
