import sharp from "sharp";

/**
 * 图片数据接口
 */
export interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * 图片处理结果接口
 */
export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  channels: 1 | 2 | 3 | 4;
}

/**
 * 从URL或文件路径加载图片
 */
export async function loadImageFromSource(
  source: string | Buffer
): Promise<ProcessedImage> {
  try {
    const image = sharp(source);
    const metadata = await image.metadata();
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      data,
      width: info.width,
      height: info.height,
      channels: info.channels,
    };
  } catch (error) {
    throw new Error(
      `加载图片失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

/**
 * 调整图片尺寸
 */
export async function resizeImage(
  imageData: ProcessedImage,
  targetWidth: number,
  targetHeight: number,
  maintainAspectRatio = true
): Promise<ProcessedImage> {
  const originalWidth = imageData.width;
  const originalHeight = imageData.height;

  let newWidth = targetWidth;
  let newHeight = targetHeight;

  if (maintainAspectRatio) {
    const aspectRatio = originalWidth / originalHeight;

    if (targetWidth / targetHeight > aspectRatio) {
      newWidth = Math.round(targetHeight * aspectRatio);
    } else {
      newHeight = Math.round(targetWidth / aspectRatio);
    }
  }

  try {
    const resized = sharp(imageData.data, {
      raw: {
        width: imageData.width,
        height: imageData.height,
        channels: imageData.channels,
      },
    });

    const { data, info } = await resized
      .resize(newWidth, newHeight)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      data,
      width: info.width,
      height: info.height,
      channels: info.channels,
    };
  } catch (error) {
    throw new Error(
      `调整图片尺寸失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

/**
 * 从ProcessedImage获取ImageData格式
 */
export function getImagePixelData(processedImage: ProcessedImage): ImageData {
  return {
    data: new Uint8ClampedArray(processedImage.data),
    width: processedImage.width,
    height: processedImage.height,
  };
}

/**
 * 获取指定位置的像素颜色
 */
export function getPixelColor(
  imageData: ImageData,
  x: number,
  y: number
): { r: number; g: number; b: number; a: number } {
  const index = (y * imageData.width + x) * 4;

  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
    a: imageData.data[index + 3],
  };
}

/**
 * 获取所有像素的颜色信息
 */
export function getAllPixelColors(imageData: ImageData): Array<{
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
}> {
  const pixels: Array<{
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    a: number;
  }> = [];

  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      const color = getPixelColor(imageData, x, y);
      pixels.push({ x, y, ...color });
    }
  }

  return pixels;
}

/**
 * 处理透明度，将透明像素与背景色混合
 */
export function processTransparency(
  color: { r: number; g: number; b: number; a: number },
  backgroundColor: { r: number; g: number; b: number } = {
    r: 255,
    g: 255,
    b: 255,
  }
): { r: number; g: number; b: number } {
  const alpha = color.a / 255;

  return {
    r: Math.round(color.r * alpha + backgroundColor.r * (1 - alpha)),
    g: Math.round(color.g * alpha + backgroundColor.g * (1 - alpha)),
    b: Math.round(color.b * alpha + backgroundColor.b * (1 - alpha)),
  };
}

/**
 * 应用图片滤镜
 */
export async function applyImageFilter(
  processedImage: ProcessedImage,
  filter: "grayscale" | "sepia" | "invert" | "brightness" | "contrast",
  intensity = 1
): Promise<ProcessedImage> {
  try {
    let image = sharp(processedImage.data, {
      raw: {
        width: processedImage.width,
        height: processedImage.height,
        channels: processedImage.channels,
      },
    });

    switch (filter) {
      case "grayscale":
        image = image.grayscale();
        break;
      case "sepia":
        // Sharp doesn't have built-in sepia, so we'll use a color matrix approximation
        image = image
          .modulate({ saturation: 0.3 })
          .tint({ r: 255, g: 240, b: 200 });
        break;
      case "invert":
        image = image.negate();
        break;
      case "brightness":
        image = image.modulate({ brightness: intensity });
        break;
      case "contrast":
        // Sharp doesn't have direct contrast, but we can use linear for similar effect
        const factor = intensity;
        image = image.linear(factor, -(128 * factor) + 128);
        break;
    }

    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      data,
      width: info.width,
      height: info.height,
      channels: info.channels,
    };
  } catch (error) {
    throw new Error(
      `应用滤镜失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

/**
 * 创建预览图片数据
 */
export async function createPreviewImage(
  pixels: Array<{
    x: number;
    y: number;
    color: { r: number; g: number; b: number };
  }>,
  width: number,
  height: number,
  pixelSize = 10
): Promise<Buffer> {
  const canvasWidth = width * pixelSize;
  const canvasHeight = height * pixelSize;
  // 直接构建整张画布的原始 RGB 缓冲区，避免逐像素创建 sharp 实例
  const channels = 3;
  const buffer = Buffer.alloc(canvasWidth * canvasHeight * channels, 255); // 白色背景

  for (const pixel of pixels) {
    const startX = pixel.x * pixelSize;
    const startY = pixel.y * pixelSize;
    const r = pixel.color.r;
    const g = pixel.color.g;
    const b = pixel.color.b;

    for (let py = 0; py < pixelSize; py++) {
      const rowY = startY + py;
      const rowStart = (rowY * canvasWidth + startX) * channels;
      for (let px = 0; px < pixelSize; px++) {
        const idx = rowStart + px * channels;
        buffer[idx] = r;
        buffer[idx + 1] = g;
        buffer[idx + 2] = b;
      }
    }
  }

  try {
    return await sharp(buffer, {
      raw: { width: canvasWidth, height: canvasHeight, channels },
    })
      .png()
      .toBuffer();
  } catch (error) {
    throw new Error(
      `创建预览图片失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

/**
 * 保存图片到文件
 */
export async function saveImageToFile(
  imageBuffer: Buffer,
  filePath: string,
  format: "png" | "jpg" | "jpeg" | "webp" = "png"
): Promise<void> {
  try {
    let image = sharp(imageBuffer);

    switch (format) {
      case "jpg":
      case "jpeg":
        image = image.jpeg({ quality: 90 });
        break;
      case "webp":
        image = image.webp({ quality: 90 });
        break;
      default:
        image = image.png();
    }

    await image.toFile(filePath);
  } catch (error) {
    throw new Error(
      `保存图片失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}
