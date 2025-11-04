import { BeadColor } from "../types";

/**
 * 计算两个RGB颜色之间的欧几里得距离
 */
export function calculateColorDistance(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const deltaR = color1.r - color2.r;
  const deltaG = color1.g - color2.g;
  const deltaB = color1.b - color2.b;

  return Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
}

/**
 * 计算两个RGB颜色之间的加权欧几里得距离
 * 考虑人眼对不同颜色的敏感度差异
 */
export function calculateWeightedColorDistance(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const deltaR = color1.r - color2.r;
  const deltaG = color1.g - color2.g;
  const deltaB = color1.b - color2.b;

  // 人眼对绿色最敏感，红色次之，蓝色最不敏感
  const weightR = 0.3;
  const weightG = 0.59;
  const weightB = 0.11;

  return Math.sqrt(
    weightR * deltaR * deltaR +
      weightG * deltaG * deltaG +
      weightB * deltaB * deltaB
  );
}

/**
 * 将RGB颜色转换为LAB颜色空间
 * LAB颜色空间在感知上更均匀，适合颜色匹配
 */
export function rgbToLab(rgb: { r: number; g: number; b: number }): {
  l: number;
  a: number;
  b: number;
} {
  // 首先转换到XYZ颜色空间
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  // 应用gamma校正
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // 转换到XYZ (使用sRGB色彩空间的转换矩阵)
  let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  let y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  let z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;

  // 标准化 (D65光源)
  x = x / 0.95047;
  y = y / 1.0;
  z = z / 1.08883;

  // 转换到LAB
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const bValue = 200 * (y - z);

  return { l, a, b: bValue };
}

/**
 * 计算两个LAB颜色之间的Delta E距离
 * Delta E是感知颜色差异的标准度量
 */
export function calculateDeltaE(
  lab1: { l: number; a: number; b: number },
  lab2: { l: number; a: number; b: number }
): number {
  const deltaL = lab1.l - lab2.l;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;

  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * 在色卡中找到与给定颜色最匹配的拼豆颜色
 */
export function findClosestBeadColor(
  targetColor: { r: number; g: number; b: number },
  palette: BeadColor[],
  useLabColorSpace = true
): BeadColor {
  if (palette.length === 0) {
    throw new Error("色卡不能为空");
  }

  let closestColor = palette[0];
  let minDistance = Infinity;

  if (useLabColorSpace) {
    // 使用LAB颜色空间和Delta E距离
    const targetLab = rgbToLab(targetColor);

    for (const beadColor of palette) {
      const beadLab = rgbToLab(beadColor.rgb);
      const distance = calculateDeltaE(targetLab, beadLab);

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = beadColor;
      }
    }
  } else {
    // 使用RGB颜色空间和加权欧几里得距离
    for (const beadColor of palette) {
      const distance = calculateWeightedColorDistance(
        targetColor,
        beadColor.rgb
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = beadColor;
      }
    }
  }

  return closestColor;
}

/**
 * 批量匹配颜色
 */
export function matchColors(
  colors: { r: number; g: number; b: number }[],
  palette: BeadColor[],
  useLabColorSpace = true
): BeadColor[] {
  return colors.map((color) =>
    findClosestBeadColor(color, palette, useLabColorSpace)
  );
}

/**
 * 十六进制颜色转RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`无效的十六进制颜色值: ${hex}`);
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * RGB颜色转十六进制
 */
export function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * 预计算色卡中每种颜色的 LAB 值，便于高效进行 Delta E 匹配
 */
export function precomputePaletteLab(
  palette: BeadColor[]
): { color: BeadColor; lab: { l: number; a: number; b: number } }[] {
  return palette.map((c) => ({ color: c, lab: rgbToLab(c.rgb) }));
}

/**
 * 使用预计算的 LAB 列表匹配最接近的颜色
 */
export function findClosestBeadColorFromLab(
  targetLab: { l: number; a: number; b: number },
  paletteLabs: { color: BeadColor; lab: { l: number; a: number; b: number } }[]
): BeadColor {
  let closest = paletteLabs[0].color;
  let minDistance = Infinity;
  for (let i = 0; i < paletteLabs.length; i++) {
    const d = calculateDeltaE(targetLab, paletteLabs[i].lab);
    if (d < minDistance) {
      minDistance = d;
      closest = paletteLabs[i].color;
    }
  }
  return closest;
}

/**
 * 通用颜色匹配器（跨 Node/浏览器）
 * - 纯算法实现，无任何 Node-only 依赖
 * - 支持 LAB/加权 RGB 两种模式
 * - 可复用预计算的 LAB 提升批量匹配性能
 */
export class ColorMatcher {
  private palette: BeadColor[];
  private useLabColorSpace: boolean;
  private paletteLabs: { color: BeadColor; lab: { l: number; a: number; b: number } }[] | null;

  constructor(
    palette: BeadColor[],
    options?: { useLabColorSpace?: boolean }
  ) {
    if (!Array.isArray(palette) || palette.length === 0) {
      throw new Error("色卡不能为空");
    }
    this.palette = [...palette];
    this.useLabColorSpace = options?.useLabColorSpace ?? true;
    this.paletteLabs = this.useLabColorSpace ? precomputePaletteLab(this.palette) : null;
  }

  /**
   * 更新色卡（会自动刷新预计算的 LAB）
   */
  updatePalette(palette: BeadColor[]): void {
    if (!Array.isArray(palette) || palette.length === 0) {
      throw new Error("色卡不能为空");
    }
    this.palette = [...palette];
    this.paletteLabs = this.useLabColorSpace ? precomputePaletteLab(this.palette) : null;
  }

  /**
   * 匹配最接近颜色（输入为 RGB）
   */
  closest(targetColor: { r: number; g: number; b: number }): BeadColor {
    if (this.useLabColorSpace) {
      const targetLab = rgbToLab(targetColor);
      return this.closestFromLab(targetLab);
    }
    let closestColor = this.palette[0];
    let minDistance = Infinity;
    for (let i = 0; i < this.palette.length; i++) {
      const d = calculateWeightedColorDistance(targetColor, this.palette[i].rgb);
      if (d < minDistance) {
        minDistance = d;
        closestColor = this.palette[i];
      }
    }
    return closestColor;
  }

  /**
   * 使用预计算的 LAB 匹配最接近颜色（输入为 LAB）
   */
  closestFromLab(targetLab: { l: number; a: number; b: number }): BeadColor {
    if (!this.useLabColorSpace || !this.paletteLabs) {
      // 若未启用 LAB 模式，回退到 RGB 距离（需转换）
      const rgb = this.labToApproxRgb(targetLab);
      return this.closest(rgb);
    }
    let closest = this.paletteLabs[0].color;
    let minDistance = Infinity;
    for (let i = 0; i < this.paletteLabs.length; i++) {
      const d = calculateDeltaE(targetLab, this.paletteLabs[i].lab);
      if (d < minDistance) {
        minDistance = d;
        closest = this.paletteLabs[i].color;
      }
    }
    return closest;
  }

  /**
   * 批量匹配（输入为一组 RGB）
   */
  batchClosest(colors: { r: number; g: number; b: number }[]): BeadColor[] {
    return colors.map((c) => this.closest(c));
  }

  /**
   * 返回前 K 个最接近的颜色（适合提供候选列表）
   */
  topKClosest(targetColor: { r: number; g: number; b: number }, k: number): BeadColor[] {
    const distances: Array<{ color: BeadColor; distance: number }> = [];
    if (this.useLabColorSpace) {
      const tl = rgbToLab(targetColor);
      for (let i = 0; i < (this.paletteLabs?.length ?? 0); i++) {
        const entry = this.paletteLabs![i];
        distances.push({ color: entry.color, distance: calculateDeltaE(tl, entry.lab) });
      }
    } else {
      for (let i = 0; i < this.palette.length; i++) {
        const c = this.palette[i];
        distances.push({ color: c, distance: calculateWeightedColorDistance(targetColor, c.rgb) });
      }
    }
    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, Math.max(0, Math.min(k, distances.length))).map((d) => d.color);
  }

  /**
   * 简易 LAB -> RGB 近似（仅用于在未启用 LAB 时的回退，不保证精度）
   * 为保持通用性与简洁性，这里使用近似反变换，避免引入复杂依赖。
   */
  private labToApproxRgb(lab: { l: number; a: number; b: number }): { r: number; g: number; b: number } {
    // 反向近似：LAB -> XYZ -> sRGB（简化版）
    let y = (lab.l + 16) / 116;
    let x = lab.a / 500 + y;
    let z = y - lab.b / 200;

    const x3 = x * x * x;
    const y3 = y * y * y;
    const z3 = z * z * z;

    x = x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787;
    y = y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787;
    z = z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787;

    // D65 白点
    x = x * 0.95047;
    y = y * 1.0;
    z = z * 1.08883;

    // XYZ -> sRGB
    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let b = x * 0.0557 + y * -0.2040 + z * 1.0570;

    // 伽马校正
    const gamma = (u: number) => (u > 0.0031308 ? 1.055 * Math.pow(u, 1 / 2.4) - 0.055 : 12.92 * u);

    r = gamma(r);
    g = gamma(g);
    b = gamma(b);

    // 限制范围并转 0-255
    const to255 = (u: number) => Math.max(0, Math.min(255, Math.round(u * 255)));
    return { r: to255(r), g: to255(g), b: to255(b) };
  }
}
