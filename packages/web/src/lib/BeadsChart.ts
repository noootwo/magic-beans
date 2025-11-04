import {
  BeadsChartOptions,
  BeadDatum,
  GridDimensions,
  InteractionOptions,
  ChartEvent,
  HoverEvent,
  ClickEvent,
  SelectionChangeEvent,
  EditChangeEvent,
  Predicate,
  ZoomOptions,
  PanOptions,
} from "./types";
import { PixiRenderer } from "./PixiRenderer";
import type { Renderer } from "./types";
import type { ConversionResult, BeadColor } from "@magic-beans/core";

type HandlerMap = {
  [K in ChartEvent]?: ((payload: any) => void)[];
};

export class BeadsChart {
  private renderer: Renderer;
  private data: BeadDatum[] = [];
  private dims: GridDimensions;
  private interaction: Required<InteractionOptions>;
  private editEnabled = false;
  private editTool: "paint" | "flood" | "erase" = "paint";
  private brushBead?: BeadColor;
  private hoverId: number | null = null;
  private selected = new Set<number>();
  private handlers: HandlerMap = {};
  private lastChange?: {
    before: Array<{
      id: number;
      color: { r: number; g: number; b: number };
      name?: string;
    }>;
    after: Array<{
      id: number;
      color: { r: number; g: number; b: number };
      name?: string;
    }>;
  };
  private undoStack: Array<{
    before: Array<{
      id: number;
      color: { r: number; g: number; b: number };
      name?: string;
    }>;
    after: Array<{
      id: number;
      color: { r: number; g: number; b: number };
      name?: string;
    }>;
  }> = [];
  private redoStack: Array<{
    before: Array<{
      id: number;
      color: { r: number; g: number; b: number };
      name?: string;
    }>;
    after: Array<{
      id: number;
      color: { r: number; g: number; b: number };
      name?: string;
    }>;
  }> = [];
  private zoomConf: Required<ZoomOptions> = {
    enabled: false,
    min: 0.25,
    max: 4,
    factor: 1.1,
  };
  private panConf: Required<PanOptions> = { enabled: false };
  private dragging = false;
  private lastDragX = 0;
  private lastDragY = 0;
  private renderScheduled = false;

  constructor(options: BeadsChartOptions) {
    this.dims = options.dimensions;
    // 统一使用 PixiRenderer（需要全局提供 PIXI）
    this.renderer = new PixiRenderer(
      options.container,
      options.dimensions,
      options
    );

    this.interaction = {
      hoverHighlight: options.interaction?.hoverHighlight ?? true,
      hoverStroke: options.interaction?.hoverStroke ?? "#333",
      hoverAlpha: options.interaction?.hoverAlpha ?? 0.7,
      selectStroke: options.interaction?.selectStroke ?? "#1f78b4",
      selectAlpha: options.interaction?.selectAlpha ?? 0.9,
      enableClickSelect: options.interaction?.enableClickSelect ?? true,
    };

    this.editEnabled = options.edit?.enabled ?? false;

    // zoom/pan setup
    if (options.zoom) this.zoomConf = { ...this.zoomConf, ...options.zoom };
    if (options.pan) this.panConf = { ...this.panConf, ...options.pan };
    if (options.segmentation)
      this.renderer.setSegmentation(options.segmentation);

    const canvas = this.renderer.getCanvas();
    canvas.addEventListener("mousemove", this.onMouseMove);
    canvas.addEventListener("mouseleave", this.onMouseLeave);
    canvas.addEventListener("click", this.onClick);
    if (this.zoomConf.enabled) {
      canvas.addEventListener("wheel", this.onWheel, { passive: false });
    }
    if (this.panConf.enabled) {
      canvas.addEventListener("mousedown", this.onMouseDown);
      window.addEventListener("mouseup", this.onMouseUp);
    }
  }

  destroy(): void {
    const canvas = this.renderer.getCanvas();
    canvas.removeEventListener("mousemove", this.onMouseMove);
    canvas.removeEventListener("mouseleave", this.onMouseLeave);
    canvas.removeEventListener("click", this.onClick);
    canvas.removeEventListener("wheel", this.onWheel as any);
    canvas.removeEventListener("mousedown", this.onMouseDown as any);
    window.removeEventListener("mouseup", this.onMouseUp as any);
  }

  on<T extends ChartEvent>(event: T, handler: (payload: any) => void): void {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event]!.push(handler);
  }

  private emit<T extends ChartEvent>(event: T, payload: any): void {
    const hs = this.handlers[event];
    if (!hs) return;
    for (const h of hs) h(payload);
  }

  dataSource(beads: BeadDatum[], dims?: GridDimensions): void {
    this.data = beads as BeadDatum[];
    if (dims) {
      this.dims = dims;
      this.renderer.setDimensions(dims);
    }
    this.render();
  }

  render(): void {
    this.renderer.clear();
    this.renderer.drawBeads(this.data);

    // selection highlight
    if (this.selected.size > 0) {
      const selectedBeads = this.data.filter((d) => this.selected.has(d.id));
      this.renderer.drawHighlight(
        selectedBeads,
        this.interaction.selectStroke,
        this.interaction.selectAlpha
      );
    }

    // hover highlight
    if (this.interaction.hoverHighlight && this.hoverId != null) {
      const p = this.data.find((d) => d.id === this.hoverId);
      if (p)
        this.renderer.drawHighlight(
          [p],
          this.interaction.hoverStroke,
          this.interaction.hoverAlpha
        );
    }
  }

  private scheduleRender(): void {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    requestAnimationFrame(() => {
      this.renderScheduled = false;
      this.render();
    });
  }

  // Interaction handlers
  private onMouseMove = (ev: MouseEvent): void => {
    const pos = this.renderer.hitTest(ev.clientX, ev.clientY);
    if (!pos) {
      if (this.hoverId != null) {
        this.hoverId = null;
        this.emit("hover", { bead: undefined } as HoverEvent);
        this.scheduleRender();
      }
      return;
    }
    const id = pos.y * this.dims.width + pos.x;
    if (this.hoverId !== id) {
      this.hoverId = id;
      const bead = this.data.find((d) => d.id === id);
      this.emit("hover", { bead } as HoverEvent);
      this.scheduleRender();
    }
  };

  private onMouseLeave = (): void => {
    this.hoverId = null;
    this.emit("leave", {});
    this.scheduleRender();
  };

  private onClick = (ev: MouseEvent): void => {
    const pos = this.renderer.hitTest(ev.clientX, ev.clientY);
    if (!pos) return;
    const id = pos.y * this.dims.width + pos.x;
    const bead = this.data.find((d) => d.id === id);

    if (this.interaction.enableClickSelect) {
      if (this.selected.has(id)) this.selected.delete(id);
      else this.selected.add(id);
      this.emit("selection-change", {
        selectedIds: Array.from(this.selected),
      } as SelectionChangeEvent);
      this.render();
    }

    this.emit("click", { bead } as ClickEvent);

    if (this.editEnabled && bead) {
      if (this.editTool === "paint" && this.brushBead) {
        this.lastChange = {
          before: [{ id: bead.id, color: { ...bead.color }, name: bead.name }],
          after: [
            {
              id: bead.id,
              color: {
                r: this.brushBead.rgb.r,
                g: this.brushBead.rgb.g,
                b: this.brushBead.rgb.b,
              },
              name: this.brushBead.name,
            },
          ],
        };
        this.undoStack.push(this.lastChange);
        this.redoStack = [];
        bead.color = {
          r: this.brushBead.rgb.r,
          g: this.brushBead.rgb.g,
          b: this.brushBead.rgb.b,
        } as any;
        bead.name = this.brushBead.name;
        this.emit("edit-change", { bead } as EditChangeEvent);
        this.render();
      } else if (this.editTool === "flood" && this.brushBead) {
        // 洪泛填充：以名称相同为连通标准
        const targetName = bead.name ?? "";
        const visited = new Set<number>();
        const queue: Array<{ x: number; y: number; id: number }> = [
          { x: bead.x, y: bead.y, id },
        ];
        const idToBead = new Map(this.data.map((d) => [d.id, d] as const));
        const changed: BeadDatum[] = [];
        const before: Array<{
          id: number;
          color: { r: number; g: number; b: number };
          name?: string;
        }> = [];
        while (queue.length) {
          const cur = queue.shift()!;
          if (visited.has(cur.id)) continue;
          visited.add(cur.id);
          const pd = idToBead.get(cur.id);
          if (!pd || (pd.name ?? "") !== targetName) continue;
          before.push({ id: pd.id, color: { ...pd.color }, name: pd.name });
          pd.color = {
            r: this.brushBead.rgb.r,
            g: this.brushBead.rgb.g,
            b: this.brushBead.rgb.b,
          } as any;
          pd.name = this.brushBead.name;
          changed.push(pd);
          // 4 邻域
          const nx = [cur.x - 1, cur.x + 1, cur.x, cur.x];
          const ny = [cur.y, cur.y, cur.y - 1, cur.y + 1];
          for (let k = 0; k < 4; k++) {
            const x = nx[k];
            const y = ny[k];
            if (x < 0 || y < 0 || x >= this.dims.width || y >= this.dims.height)
              continue;
            const nid = y * this.dims.width + x;
            if (!visited.has(nid)) queue.push({ x, y, id: nid });
          }
        }
        this.lastChange = {
          before,
          after: changed.map((pd) => ({
            id: pd.id,
            color: { ...pd.color },
            name: pd.name,
          })),
        };
        this.undoStack.push(this.lastChange);
        this.redoStack = [];
        this.emit("edit-change", { beads: changed } as any);
        this.render();
      } else if (this.editTool === "erase") {
        // 擦除：将该格的色号清空并置为白色
        const before = [
          { id: bead.id, color: { ...bead.color }, name: bead.name },
        ];
        bead.color = { r: 255, g: 255, b: 255 } as any;
        bead.name = undefined;
        this.lastChange = {
          before,
          after: [{ id: bead.id, color: { ...bead.color }, name: bead.name }],
        };
        this.undoStack.push(this.lastChange);
        this.redoStack = [];
        this.emit("edit-change", { bead } as EditChangeEvent);
        this.render();
      }
    }
  };

  private onWheel = (ev: WheelEvent): void => {
    ev.preventDefault();
    if (!this.zoomConf.enabled) return;
    const current = this.renderer.getTransform();
    const dir = ev.deltaY < 0 ? 1 : -1;
    const nextScale = Math.min(
      this.zoomConf.max,
      Math.max(
        this.zoomConf.min,
        current.scale *
          (dir > 0 ? this.zoomConf.factor : 1 / this.zoomConf.factor)
      )
    );
    // zoom relative to cursor
    const rect = this.renderer.getCanvas().getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    const dx = cx - current.offsetX;
    const dy = cy - current.offsetY;
    const k = nextScale / current.scale;
    const newOffsetX = cx - dx * k;
    const newOffsetY = cy - dy * k;
    this.renderer.setTransform(nextScale, newOffsetX, newOffsetY);
    this.scheduleRender();
  };

  private onMouseDown = (ev: MouseEvent): void => {
    if (!this.panConf.enabled) return;
    this.dragging = true;
    this.lastDragX = ev.clientX;
    this.lastDragY = ev.clientY;
    window.addEventListener("mousemove", this.onMouseDrag);
  };

  private onMouseDrag = (ev: MouseEvent): void => {
    if (!this.dragging) return;
    const current = this.renderer.getTransform();
    const dx = ev.clientX - this.lastDragX;
    const dy = ev.clientY - this.lastDragY;
    this.lastDragX = ev.clientX;
    this.lastDragY = ev.clientY;
    this.renderer.setTransform(
      current.scale,
      current.offsetX + dx,
      current.offsetY + dy
    );
    this.scheduleRender();
  };

  private onMouseUp = (): void => {
    if (!this.dragging) return;
    this.dragging = false;
    window.removeEventListener("mousemove", this.onMouseDrag);
  };

  // Public APIs (G2-inspired)
  highlight(predicate: Predicate): void {
    const ids = this.data.filter(predicate).map((d) => d.id);
    this.hoverId = ids.length ? ids[0] : null;
    this.render();
  }

  // Data helpers with core ConversionResult
  fromConversion(result: ConversionResult): void {
    const width = result.dimensions.width;
    const beads: BeadDatum[] = result.pixels.map((p) => ({
      id: p.y * width + p.x,
      x: p.x,
      y: p.y,
      color: {
        r: p.beadColor.rgb.r,
        g: p.beadColor.rgb.g,
        b: p.beadColor.rgb.b,
      },
      name: p.beadColor.name,
    }));
    this.dataSource(beads, {
      width: result.dimensions.width,
      height: result.dimensions.height,
    });
  }

  async convertFromImage(
    source: string | Blob | HTMLImageElement,
    opts: {
      targetWidth: number;
      targetHeight: number;
      palette: BeadColor[];
      maintainAspectRatio?: boolean;
      useLabColorSpace?: boolean;
      backgroundColor?: { r: number; g: number; b: number };
    }
  ): Promise<void> {
    // 直接在浏览器侧仅做图像加载与像素提取，算法委托 core
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      if (source instanceof HTMLImageElement) {
        if (source.complete) resolve(source);
        else {
          source.onload = () => resolve(source);
          source.onerror = (e) => reject(e);
        }
        return;
      }
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = (e) => reject(e);
      if (typeof source === "string") el.src = source;
      else {
        const url = URL.createObjectURL(source);
        el.src = url;
      }
    });

    const canvas = document.createElement("canvas");
    let targetW = opts.targetWidth;
    let targetH = opts.targetHeight;
    if (opts.maintainAspectRatio) {
      const aspect = img.naturalWidth / img.naturalHeight;
      if (targetW / targetH > aspect) targetW = Math.round(targetH * aspect);
      else targetH = Math.round(targetW / aspect);
    }
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法获取 2D 上下文用于图片转换");
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const imageData = ctx.getImageData(0, 0, targetW, targetH);

    const { MagicBeans } = await import("@magic-beans/core");
    const beans = new MagicBeans({
      width: targetW,
      height: targetH,
      palette: opts.palette,
      maintainAspectRatio: opts.maintainAspectRatio,
      backgroundColor: opts.backgroundColor,
    });

    const res = beans.convertFromImageData(
      {
        data: imageData.data,
        width: imageData.width,
        height: imageData.height,
      },
      { backgroundColor: opts.backgroundColor }
    );
    this.fromConversion(res);
  }

  select(predicate: Predicate): void {
    this.selected = new Set(this.data.filter(predicate).map((d) => d.id));
    this.emit("selection-change", {
      selectedIds: Array.from(this.selected),
    } as SelectionChangeEvent);
    this.render();
  }

  clearSelection(): void {
    this.selected.clear();
    this.emit("selection-change", { selectedIds: [] } as SelectionChangeEvent);
    this.render();
  }

  selectByIds(ids: number[]): void {
    this.selected = new Set(ids);
    this.emit("selection-change", {
      selectedIds: Array.from(this.selected),
    } as SelectionChangeEvent);
    this.render();
  }

  selectByColorName(name: string): void {
    this.select((d) => d.name === name);
  }

  enableEdit(enabled: boolean): void {
    this.editEnabled = enabled;
  }

  // Zoom/Pan APIs
  setZoom(scale: number): void {
    const c = this.renderer.getTransform();
    const next = Math.min(
      this.zoomConf.max,
      Math.max(this.zoomConf.min, scale)
    );
    this.renderer.setTransform(next, c.offsetX, c.offsetY);
    this.render();
  }

  zoomBy(factor: number): void {
    const c = this.renderer.getTransform();
    this.setZoom(c.scale * factor);
  }

  panBy(dx: number, dy: number): void {
    const c = this.renderer.getTransform();
    this.renderer.setTransform(c.scale, c.offsetX + dx, c.offsetY + dy);
    this.render();
  }

  setSegmentation(options?: {
    blockWidth?: number;
    blockHeight?: number;
    lineColor?: string;
    lineWidth?: number;
    showLabels?: boolean;
    labelColor?: string;
  }): void {
    this.renderer.setSegmentation(options);
    this.render();
  }

  setPanEnabled(enabled: boolean): void {
    if (enabled === this.panConf.enabled) return;
    this.panConf.enabled = enabled;
    const canvas = this.renderer.getCanvas();
    if (enabled) {
      canvas.addEventListener("mousedown", this.onMouseDown);
      window.addEventListener("mouseup", this.onMouseUp);
    } else {
      canvas.removeEventListener("mousedown", this.onMouseDown as any);
      window.removeEventListener("mouseup", this.onMouseUp as any);
      window.removeEventListener("mousemove", this.onMouseDrag as any);
      this.dragging = false;
    }
  }

  // 渲染尺寸控制（用于响应式）
  setBeadSize(size: number): void {
    const s = Math.max(1, Math.floor(size));
    this.renderer.updateOptions({ beadSize: s });
    this.render();
  }
  // 兼容旧名
  setPixelSize(size: number): void {
    this.setBeadSize(size);
  }

  // 显示色号标签控制
  setShowColorCodes(show: boolean): void {
    this.renderer.updateOptions({ showColorCodes: show });
    this.render();
  }

  setColorCodeLabelOptions(opts: {
    codeLabelColor?: string;
    codeLabelAutoContrast?: boolean;
    codeLabelMinSize?: number;
    codeLabelFont?: string;
  }): void {
    this.renderer.updateOptions(opts);
    this.render();
  }

  setBeadColor(
    id: number,
    color: { r: number; g: number; b: number },
    name?: string
  ): void {
    const bead = this.data.find((d) => d.id === id);
    if (!bead) return;
    bead.color = color as any;
    if (name !== undefined) bead.name = name;
    this.emit("edit-change", { bead } as EditChangeEvent);
    this.render();
  }
  // 兼容旧名
  setPixelColor(
    id: number,
    color: { r: number; g: number; b: number },
    name?: string
  ): void {
    this.setBeadColor(id, color, name);
  }

  // Core-aware editing helpers
  setBeadColorByBead(id: number, bead: BeadColor): void {
    const bd = this.data.find((d) => d.id === id);
    if (!bd) return;
    bd.color = { r: bead.rgb.r, g: bead.rgb.g, b: bead.rgb.b } as any;
    bd.name = bead.name;
    this.emit("edit-change", { bead: bd } as EditChangeEvent);
    this.render();
  }
  // 兼容旧名
  setPixelBeadColor(id: number, bead: BeadColor): void {
    this.setBeadColorByBead(id, bead);
  }

  replaceColorByName(targetName: string, newBead: BeadColor): void {
    this.setBeadsByPredicate(
      (p) => (p.name ?? "") === targetName,
      (p) => ({
        ...p,
        color: { r: newBead.rgb.r, g: newBead.rgb.g, b: newBead.rgb.b } as any,
        name: newBead.name,
      })
    );
  }

  setBeadsByPredicate(
    predicate: Predicate,
    updater: (p: BeadDatum) => BeadDatum
  ): void {
    this.data = this.data.map((p) => (predicate(p) ? updater({ ...p }) : p));
    this.emit("edit-change", { beads: this.data } as any);
    this.render();
  }
  // 兼容旧名
  setPixelsByPredicate(
    predicate: Predicate,
    updater: (p: BeadDatum) => BeadDatum
  ): void {
    this.setBeadsByPredicate(predicate, updater);
  }

  // 编辑工具控制
  setEditTool(tool: "paint" | "flood" | "erase"): void {
    this.editTool = tool;
  }

  setBrushBeadColor(bead: BeadColor): void {
    this.brushBead = bead;
  }

  fillSelectionWithBeadColor(bead: BeadColor): void {
    const ids = Array.from(this.selected);
    const idSet = new Set(ids);
    const before: Array<{
      id: number;
      color: { r: number; g: number; b: number };
      name?: string;
    }> = [];
    this.data = this.data.map((p) =>
      idSet.has(p.id)
        ? (() => {
            before.push({ id: p.id, color: { ...p.color }, name: p.name });
            return {
              ...p,
              color: { r: bead.rgb.r, g: bead.rgb.g, b: bead.rgb.b } as any,
              name: bead.name,
            };
          })()
        : p
    );
    const changed = this.data.filter((p) => idSet.has(p.id));
    this.lastChange = {
      before,
      after: changed.map((pd) => ({
        id: pd.id,
        color: { ...pd.color },
        name: pd.name,
      })),
    };
    this.undoStack.push(this.lastChange);
    this.redoStack = [];
    this.emit("edit-change", { beads: changed } as any);
    this.render();
  }

  eraseSelection(): void {
    const ids = Array.from(this.selected);
    const idSet = new Set(ids);
    const before: Array<{
      id: number;
      color: { r: number; g: number; b: number };
      name?: string;
    }> = [];
    this.data = this.data.map((p) =>
      idSet.has(p.id)
        ? (() => {
            before.push({ id: p.id, color: { ...p.color }, name: p.name });
            return {
              ...p,
              color: { r: 255, g: 255, b: 255 } as any,
              name: undefined,
            };
          })()
        : p
    );
    const changed = this.data.filter((p) => idSet.has(p.id));
    this.lastChange = {
      before,
      after: changed.map((pd) => ({
        id: pd.id,
        color: { ...pd.color },
        name: pd.name,
      })),
    };
    this.undoStack.push(this.lastChange);
    this.redoStack = [];
    this.emit("edit-change", { beads: changed } as any);
    this.render();
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    const change = this.undoStack.pop()!;
    this.redoStack.push(change);
    const byId = new Map(this.data.map((p) => [p.id, p] as const));
    for (const s of change.before) {
      const pd = byId.get(s.id);
      if (!pd) continue;
      pd.color = { ...s.color } as any;
      pd.name = s.name;
    }
    this.emit("edit-change", {
      beads: change.before.map((s) => byId.get(s.id)).filter(Boolean),
    } as any);
    this.render();
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    const change = this.redoStack.pop()!;
    this.undoStack.push(change);
    const byId = new Map(this.data.map((p) => [p.id, p] as const));
    for (const s of change.after) {
      const pd = byId.get(s.id);
      if (!pd) continue;
      pd.color = { ...s.color } as any;
      pd.name = s.name;
    }
    this.emit("edit-change", {
      beads: change.after.map((s) => byId.get(s.id)).filter(Boolean),
    } as any);
    this.render();
  }
}
