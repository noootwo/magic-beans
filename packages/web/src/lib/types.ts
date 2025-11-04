export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface BeadDatum {
  id: number;
  x: number;
  y: number;
  color: RGB;
  /** Optional color name (e.g., bead color code) */
  name?: string;
}

// 兼容旧名类型别名（逐步迁移，可在后续版本移除）
export type PixelDatum = BeadDatum;

export interface GridDimensions {
  width: number;
  height: number;
}

export interface RenderOptions {
  beadSize?: number;
  gap?: number;
  background?: string;
  showGrid?: boolean;
  // 显示色号标签相关配置
  showColorCodes?: boolean;
  /** 标签颜色（当 autoContrast=false 时生效） */
  codeLabelColor?: string;
  /** 根据像素明暗自动选择黑/白文字，默认 true */
  codeLabelAutoContrast?: boolean;
  /** 当珠子渲染尺寸（包含缩放后）小于该阈值时不绘制标签，默认 12 */
  codeLabelMinSize?: number;
  /** 自定义标签字体，默认 `${Math.max(10, beadSize - 2)}px sans-serif` */
  codeLabelFont?: string;
}

export interface ZoomOptions {
  enabled?: boolean;
  min?: number;
  max?: number;
  factor?: number; // wheel zoom factor per tick
}

export interface PanOptions {
  enabled?: boolean;
}

export interface SegmentationOptions {
  blockWidth?: number; // in grid cells
  blockHeight?: number; // in grid cells
  lineColor?: string;
  lineWidth?: number;
  showLabels?: boolean;
  labelColor?: string;
}

export interface InteractionOptions {
  hoverHighlight?: boolean;
  hoverStroke?: string;
  hoverAlpha?: number;
  selectStroke?: string;
  selectAlpha?: number;
  enableClickSelect?: boolean;
}

export interface EditOptions {
  enabled?: boolean;
}

export type Predicate = (p: BeadDatum) => boolean;

export interface BeadsChartOptions extends RenderOptions {
  container: HTMLElement;
  dimensions: GridDimensions;
  interaction?: InteractionOptions;
  edit?: EditOptions;
  zoom?: ZoomOptions;
  pan?: PanOptions;
  segmentation?: SegmentationOptions;
  maintainAspectRatio?: boolean; // used for image conversion convenience
}

export type ChartEvent =
  | "hover"
  | "leave"
  | "click"
  | "selection-change"
  | "edit-change";

export interface ZoomEvent {
  scale: number;
}

export interface PanEvent {
  offsetX: number;
  offsetY: number;
}

export interface HoverEvent {
  bead?: BeadDatum;
}

export interface ClickEvent {
  bead?: BeadDatum;
}

export interface SelectionChangeEvent {
  selectedIds: number[];
}

export interface EditChangeEvent {
  bead?: BeadDatum;
  beads?: BeadDatum[];
}

// 渲染器接口：CanvasRenderer 与 PixiRenderer 均实现该接口
export interface Renderer {
  getCanvas(): HTMLCanvasElement;
  updateOptions(opts: Partial<RenderOptions>): void;
  setDimensions(dims: GridDimensions): void;
  clear(): void;
  drawBeads(beads: BeadDatum[]): void;
  drawHighlight(beads: BeadDatum[], stroke?: string, alpha?: number): void;
  hitTest(clientX: number, clientY: number): { x: number; y: number } | null;
  toggleGrid(show: boolean): void;
  setTransform(scale: number, offsetX: number, offsetY: number): void;
  getTransform(): { scale: number; offsetX: number; offsetY: number };
  setSegmentation(opts?: {
    blockWidth?: number;
    blockHeight?: number;
    lineColor?: string;
    lineWidth?: number;
    showLabels?: boolean;
    labelColor?: string;
  }): void;
}
