export async function createPreviewImageBrowser(
  beads: Array<{
    x: number;
    y: number;
    color: { r: number; g: number; b: number };
  }>,
  width: number,
  height: number,
  beadSize = 10,
  canvas?: HTMLCanvasElement | OffscreenCanvas
): Promise<HTMLCanvasElement | OffscreenCanvas> {
  const canvasWidth = width * beadSize;
  const canvasHeight = height * beadSize;

  const target =
    canvas ??
    (typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(canvasWidth, canvasHeight)
      : (() => {
          const c = document.createElement("canvas");
          c.width = canvasWidth;
          c.height = canvasHeight;
          return c;
        })());

  const ctx = (target as any).getContext
    ? (target as HTMLCanvasElement).getContext("2d")
    : (target as OffscreenCanvas).getContext("2d");
  if (!ctx) throw new Error("无法获取 2D 上下文用于预览绘制");

  // 背景填充为白色
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 绘制珠子块
  for (const p of beads) {
    ctx.fillStyle = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
    ctx.fillRect(p.x * beadSize, p.y * beadSize, beadSize, beadSize);
  }

  return target;
}

export function toDataURL(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type: "image/png" | "image/jpeg" = "image/png",
  quality?: number
): string {
  if ("convertToBlob" in canvas) {
    // OffscreenCanvas path cannot synchronously produce DataURL; caller can use Blob
    throw new Error(
      "OffscreenCanvas 不支持同步 DataURL 转换，请使用 convertToBlob"
    );
  }
  return (canvas as HTMLCanvasElement).toDataURL(type, quality);
}
