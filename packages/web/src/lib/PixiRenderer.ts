// 说明：PixiRenderer 最小等价实现，不直接引入 pixi 依赖，
// 通过 globalThis.PIXI 访问（示例页需要先加载 PixiJS 并挂到 window）。
import type { GridDimensions, BeadDatum, RenderOptions } from "./types";

function rgbToHexNumber(r: number, g: number, b: number): number {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

export class PixiRenderer {
  private container: HTMLElement;
  private dims: GridDimensions;
  private opts: Required<RenderOptions>;
  private app: any;
  private canvasEl: HTMLCanvasElement;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  // 分层容器，便于分别清理
  private root: any;
  private pixelsLayer: any;
  private highlightLayer: any;
  private gridLayer: any;
  private segLayer: any;
  private labelsLayer: any;
  private segmentation?: {
    blockWidth: number;
    blockHeight: number;
    lineColor: string;
    lineWidth: number;
    showLabels: boolean;
    labelColor: string;
  };

  constructor(
    container: HTMLElement,
    dims: GridDimensions,
    opts: RenderOptions = {}
  ) {
    this.container = container;
    this.dims = dims;
    const defaultFont =
      opts.codeLabelFont ??
      `${Math.max(10, (opts.beadSize ?? 10) - 2)}px sans-serif`;
    this.opts = {
      beadSize: opts.beadSize ?? 10,
      gap: opts.gap ?? 0,
      background: opts.background ?? "#FFFFFF",
      showGrid: opts.showGrid ?? false,
      showColorCodes: opts.showColorCodes ?? false,
      codeLabelColor: opts.codeLabelColor ?? "#000000",
      codeLabelAutoContrast: opts.codeLabelAutoContrast ?? true,
      codeLabelMinSize: opts.codeLabelMinSize ?? 12,
      codeLabelFont: defaultFont,
    };

    const PIXI: any = (globalThis as any).PIXI;
    if (!PIXI || !PIXI.Application) {
      throw new Error(
        "PixiRenderer 需要在页面先加载 PixiJS（globalThis.PIXI）"
      );
    }

    const width = this.dims.width * this.opts.beadSize;
    const height = this.dims.height * this.opts.beadSize;
    this.app = new PIXI.Application({
      width,
      height,
      antialias: true,
      backgroundAlpha: 1,
    });

    const view: HTMLCanvasElement = this.app.view ?? this.app.canvas;
    this.canvasEl = view;
    // 固定像素尺寸，避免 CSS 缩放造成坐标偏差
    view.style.width = `${width}px`;
    view.style.height = `${height}px`;
    view.style.display = "block";
    this.container.appendChild(view);

    // 设置背景色（renderer.background 在 v7 可用）
    try {
      const bg = this.opts.background;
      const hex = /^#([0-9a-fA-F]{6})$/.test(bg)
        ? parseInt(bg.slice(1), 16)
        : rgbToHexNumber(255, 255, 255);
      if (this.app.renderer?.background) {
        this.app.renderer.background.color = hex;
      } else {
        // 兜底：绘制一个背景矩形
        const g = new PIXI.Graphics();
        g.beginFill(hex);
        g.drawRect(0, 0, width, height);
        g.endFill();
        this.app.stage.addChild(g);
      }
    } catch {}

    // 分层容器
    this.root = new PIXI.Container();
    this.pixelsLayer = new PIXI.Graphics();
    this.highlightLayer = new PIXI.Graphics();
    this.gridLayer = new PIXI.Graphics();
    this.segLayer = new PIXI.Graphics();
    this.labelsLayer = new PIXI.Container();
    this.root.addChild(this.gridLayer);
    this.root.addChild(this.pixelsLayer);
    this.root.addChild(this.labelsLayer);
    this.root.addChild(this.highlightLayer);
    this.root.addChild(this.segLayer);
    this.app.stage.addChild(this.root);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvasEl;
  }

  updateOptions(opts: Partial<RenderOptions>): void {
    this.opts = { ...this.opts, ...opts };
    const beadSize = this.opts.beadSize;
    const width = this.dims.width * beadSize;
    const height = this.dims.height * beadSize;
    this.app.renderer.resize(width, height);
    this.canvasEl.style.width = `${width}px`;
    this.canvasEl.style.height = `${height}px`;
  }

  setDimensions(dims: GridDimensions): void {
    this.dims = dims;
    const beadSize = this.opts.beadSize;
    const width = this.dims.width * beadSize;
    const height = this.dims.height * beadSize;
    this.app.renderer.resize(width, height);
    this.canvasEl.style.width = `${width}px`;
    this.canvasEl.style.height = `${height}px`;
  }

  clear(): void {
    // 清理图层并重绘背景
    this.pixelsLayer.clear();
    this.highlightLayer.clear();
    this.gridLayer.clear();
    for (let i = this.labelsLayer.children.length - 1; i >= 0; i--) {
      this.labelsLayer.children[i].destroy();
    }
    // 分割线层同样可能含文本，需彻底销毁
    for (let i = this.segLayer.children.length - 1; i >= 0; i--) {
      this.segLayer.children[i].destroy();
    }
    this.segLayer.clear(); // 清理分割线本身
    // 背景采用构造时设置的 renderer.background 或单独背景层，不在此处重复创建
  }

  drawBeads(beads: BeadDatum[]): void {
    const PIXI: any = (globalThis as any).PIXI;
    const { beadSize, gap } = this.opts;
    // 清空像素层以准备重绘
    this.pixelsLayer.clear();
    // 应用当前变换
    this.root.scale.set(this.scale);
    this.root.position.set(this.offsetX, this.offsetY);

    for (const p of beads) {
      const x = p.x * beadSize;
      const y = p.y * beadSize;
      const size = beadSize - gap;
      const color = rgbToHexNumber(p.color.r, p.color.g, p.color.b);

      this.pixelsLayer.beginFill(color);
      this.pixelsLayer.drawRect(x, y, size, size);
      this.pixelsLayer.endFill();

      // 色号标签（可选），小尺寸直接跳过以提升性能
      if (this.opts.showColorCodes && p.name) {
        const renderSize = size * this.scale;
        if (renderSize >= this.opts.codeLabelMinSize) {
          const luminance =
            0.2126 * p.color.r + 0.7152 * p.color.g + 0.0722 * p.color.b;
          const autoColor = luminance > 160 ? 0x000000 : 0xffffff;
          const textColor = this.opts.codeLabelAutoContrast
            ? autoColor
            : /^#([0-9a-fA-F]{6})$/.test(this.opts.codeLabelColor || "")
            ? parseInt((this.opts.codeLabelColor as string).slice(1), 16)
            : 0x000000;
          // 自适应字体：根据格子尺寸和字符个数控制字体大小，过小则不显示
          const family =
            this.opts.codeLabelFont?.split(" ").slice(-1)[0] || "sans-serif";
          const charFactor = 0.6; // 估算字符宽度/字号比例（A1B 等窄体）
          const baseSize = Math.max(10, Math.floor(size * 0.6));
          const estWidth = (p.name.length || 1) * charFactor * baseSize;
          // 若估算宽度超出格子，按比例缩放；若缩放过小（<50%），直接隐藏
          const fitScale = Math.min(1, (size - 2) / Math.max(1, estWidth));
          if (fitScale < 0.5) {
            continue;
          }
          const txt = new PIXI.Text(p.name, {
            fontFamily: family,
            fontSize: baseSize,
            fill: textColor,
            align: "center",
          });
          // 文本居中
          txt.x = x + size / 2;
          txt.y = y + size / 2;
          txt.anchor.set(0.5);
          // 按需缩放以适配格子
          if (fitScale !== 1) txt.scale.set(fitScale);
          this.labelsLayer.addChild(txt);
        }
      }
    }

    if (this.opts.showGrid) this.drawGridInternal();
    if (this.segmentation) this.drawSegmentationInternal();
  }

  drawHighlight(beads: BeadDatum[], stroke = "#000", alpha = 0.5): void {
    const { beadSize, gap } = this.opts;
    // 应用当前变换
    this.root.scale.set(this.scale);
    this.root.position.set(this.offsetX, this.offsetY);
    // 线条颜色
    const color = /^#([0-9a-fA-F]{6})$/.test(stroke)
      ? parseInt(stroke.slice(1), 16)
      : 0x000000;
    this.highlightLayer.alpha = alpha;
    this.highlightLayer.lineStyle({ color, width: 1 });
    for (const p of beads) {
      const x = p.x * beadSize;
      const y = p.y * beadSize;
      const size = beadSize - gap;
      this.highlightLayer.drawRect(x + 0.5, y + 0.5, size - 1, size - 1);
    }
  }

  hitTest(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = this.canvasEl.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const tx = (cx - this.offsetX) / this.scale;
    const ty = (cy - this.offsetY) / this.scale;
    const gx = Math.floor(tx / this.opts.beadSize);
    const gy = Math.floor(ty / this.opts.beadSize);
    if (gx < 0 || gy < 0 || gx >= this.dims.width || gy >= this.dims.height)
      return null;
    return { x: gx, y: gy };
  }

  toggleGrid(show: boolean): void {
    this.opts.showGrid = show;
  }

  setTransform(scale: number, offsetX: number, offsetY: number): void {
    this.scale = Math.max(0.1, scale);
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.root.scale.set(this.scale);
    this.root.position.set(this.offsetX, this.offsetY);
  }

  getTransform(): { scale: number; offsetX: number; offsetY: number } {
    return { scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY };
  }

  setSegmentation(opts?: {
    blockWidth?: number;
    blockHeight?: number;
    lineColor?: string;
    lineWidth?: number;
    showLabels?: boolean;
    labelColor?: string;
  }): void {
    if (!opts) {
      this.segmentation = undefined;
      return;
    }
    this.segmentation = {
      blockWidth: Math.max(1, opts.blockWidth ?? 10),
      blockHeight: Math.max(1, opts.blockHeight ?? 10),
      lineColor: opts.lineColor ?? "#ff6",
      lineWidth: opts.lineWidth ?? 2,
      showLabels: opts.showLabels ?? false,
      labelColor: opts.labelColor ?? "#f60",
    };
  }

  private drawGridInternal(): void {
    const { beadSize } = this.opts;
    this.gridLayer.clear();
    this.gridLayer.alpha = 0.15;
    this.gridLayer.lineStyle({ color: 0x000000, width: 1 });
    for (let x = 0; x <= this.dims.width; x++) {
      const px = x * beadSize;
      this.gridLayer.moveTo(px, 0);
      this.gridLayer.lineTo(px, this.dims.height * beadSize);
    }
    for (let y = 0; y <= this.dims.height; y++) {
      const py = y * beadSize;
      this.gridLayer.moveTo(0, py);
      this.gridLayer.lineTo(this.dims.width * beadSize, py);
    }
  }

  private drawSegmentationInternal(): void {
    if (!this.segmentation) return;
    const s = this.segmentation;
    const { beadSize } = this.opts;
    const totalW = this.dims.width * beadSize;
    const totalH = this.dims.height * beadSize;
    const lineColor = /^#([0-9a-fA-F]{6})$/.test(s.lineColor)
      ? parseInt(s.lineColor.slice(1), 16)
      : 0xff6600;
    this.segLayer.clear();
    this.segLayer.lineStyle({ color: lineColor, width: s.lineWidth });
    for (let x = 0; x <= this.dims.width; x += s.blockWidth) {
      const px = x * beadSize;
      this.segLayer.moveTo(px, 0);
      this.segLayer.lineTo(px, totalH);
    }
    for (let y = 0; y <= this.dims.height; y += s.blockHeight) {
      const py = y * beadSize;
      this.segLayer.moveTo(0, py);
      this.segLayer.lineTo(totalW, py);
    }
    if (s.showLabels) {
      const PIXI: any = (globalThis as any).PIXI;
      const labelColor = /^#([0-9a-fA-F]{6})$/.test(s.labelColor)
        ? parseInt(s.labelColor.slice(1), 16)
        : 0xff6600;
      const cols = Math.ceil(this.dims.width / s.blockWidth);
      const rows = Math.ceil(this.dims.height / s.blockHeight);
      for (let by = 0; by < rows; by++) {
        for (let bx = 0; bx < cols; bx++) {
          const label = `${bx + 1},${by + 1}`;
          const lx = bx * s.blockWidth * beadSize + 4;
          const ly = by * s.blockHeight * beadSize + 14;
          const txt = new PIXI.Text(label, {
            fontFamily: "sans-serif",
            fontSize: Math.max(10, beadSize - 2),
            fill: labelColor,
          });
          txt.x = lx;
          txt.y = ly;
          this.segLayer.addChild(txt);
        }
      }
    }
  }

  exportPNG(): string {
    // 将当前 canvas 内容导出为 dataURL
    return this.canvasEl.toDataURL('image/png')
  }
}
