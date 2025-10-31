import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock image-processor module
vi.mock("../src/utils/image-processor", () => ({
  loadImageFromSource: vi.fn().mockResolvedValue({
    data: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 0, 0, 255, 0, 0]),
    width: 4,
    height: 4,
    channels: 3,
  }),
  resizeImage: vi.fn().mockResolvedValue({
    data: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 0, 0, 255, 0, 0]),
    width: 2,
    height: 2,
    channels: 3,
  }),
  getImagePixelData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
    ]),
    width: 2,
    height: 2,
  }),
  getPixelColor: vi.fn().mockReturnValue({ r: 255, g: 0, b: 0, a: 255 }),
  getAllPixelColors: vi.fn().mockReturnValue([
    { x: 0, y: 0, r: 255, g: 0, b: 0, a: 255 },
    { x: 1, y: 0, r: 255, g: 0, b: 0, a: 255 },
    { x: 0, y: 1, r: 255, g: 0, b: 0, a: 255 },
    { x: 1, y: 1, r: 255, g: 0, b: 0, a: 255 },
  ]),
  processTransparency: vi.fn().mockReturnValue({ r: 255, g: 0, b: 0 }),
  applyImageFilter: vi.fn().mockResolvedValue({
    data: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 0, 0, 255, 0, 0]),
    width: 2,
    height: 2,
    channels: 3,
  }),
  createPreviewImage: vi.fn().mockResolvedValue(Buffer.from("mock-preview")),
  saveImageToFile: vi.fn().mockResolvedValue(undefined),
}));

import { MagicBeans } from "../src/core/MagicBeans";
import { BeadColor, ConversionConfig } from "../src/types";
import { createTestProcessedImage } from "./setup";

describe("MagicBeans 测试", () => {
  let customColors: BeadColor[];

  beforeEach(() => {
    customColors = [
      {
        name: "RED",
        hex: "#FF0000",
        rgb: { r: 255, g: 0, b: 0 },
        brand: "test",
      },
      {
        name: "GREEN",
        hex: "#00FF00",
        rgb: { r: 0, g: 255, b: 0 },
        brand: "test",
      },
      {
        name: "BLUE",
        hex: "#0000FF",
        rgb: { r: 0, g: 0, b: 255 },
        brand: "test",
      },
      {
        name: "WHITE",
        hex: "#FFFFFF",
        rgb: { r: 255, g: 255, b: 255 },
        brand: "test",
      },
      {
        name: "BLACK",
        hex: "#000000",
        rgb: { r: 0, g: 0, b: 0 },
        brand: "test",
      },
    ];
  });

  describe("构造函数和配置", () => {
    it("应该使用默认配置创建实例", () => {
      const magicBeans = new MagicBeans();
      const config = magicBeans.getConfig();

      expect(config.width).toBe(32);
      expect(config.height).toBe(32);
      expect(config.palette).toBe("coco");
      expect(config.maintainAspectRatio).toBe(true);
    });

    it("应该使用自定义配置创建实例", () => {
      const config: ConversionConfig = {
        width: 64,
        height: 48,
        palette: customColors,
        maintainAspectRatio: false,
      };

      const magicBeans = new MagicBeans(config);
      const actualConfig = magicBeans.getConfig();

      expect(actualConfig.width).toBe(64);
      expect(actualConfig.height).toBe(48);
      expect(actualConfig.palette).toBe(customColors);
      expect(actualConfig.maintainAspectRatio).toBe(false);
    });

    it("应该更新配置", () => {
      const magicBeans = new MagicBeans();

      magicBeans.updateConfig({
        width: 16,
        height: 16,
      });

      const config = magicBeans.getConfig();
      expect(config.width).toBe(16);
      expect(config.height).toBe(16);
    });

    it("应该获取调色板", () => {
      const magicBeans = new MagicBeans({ palette: customColors });
      const palette = magicBeans.getPalette();

      expect(palette.getColorCount()).toBe(5);
    });

    it("应该更新调色板", () => {
      const magicBeans = new MagicBeans();
      const originalCount = magicBeans.getPalette().getColorCount();

      magicBeans.updateConfig({ palette: customColors });

      const newPalette = magicBeans.getPalette();
      expect(newPalette.getColorCount()).toBe(5);
      expect(newPalette.getColorCount()).not.toBe(originalCount);
    });
  });

  describe("图片转换", () => {
    it("应该从源文件转换图片", async () => {
      const magicBeans = new MagicBeans({
        width: 2,
        height: 2,
        palette: customColors,
      });

      const result = await magicBeans.convertFromSource("test-image.jpg");

      expect(result.pixels).toHaveLength(4); // 2x2 = 4 像素
      expect(result.dimensions.width).toBe(2);
      expect(result.dimensions.height).toBe(2);
      expect(result.palette).toHaveLength(5);
    });

    it("应该从ProcessedImage转换", async () => {
      const magicBeans = new MagicBeans({
        width: 2,
        height: 2,
        palette: customColors,
      });

      const processedImage = createTestProcessedImage(4, 4, {
        r: 255,
        g: 0,
        b: 0,
      });

      const result = await magicBeans.convertFromProcessedImage(
        processedImage as any
      );

      expect(result.pixels).toHaveLength(4); // 2x2 = 4 像素
      expect(result.dimensions.width).toBe(2);
      expect(result.dimensions.height).toBe(2);
      expect(result.palette).toHaveLength(5);
    });

    it("应该生成颜色统计", async () => {
      const magicBeans = new MagicBeans({
        width: 2,
        height: 2,
        palette: customColors,
      });

      const result = await magicBeans.convertFromSource("test-image.jpg");

      expect(result.colorStats).toBeDefined();
      expect(Object.keys(result.colorStats).length).toBeGreaterThan(0);
    });
  });

  describe("预览和导出", () => {
    it("应该创建预览图片", async () => {
      const magicBeans = new MagicBeans({
        width: 2,
        height: 2,
        palette: customColors,
      });

      const result = await magicBeans.convertFromSource("test-image.jpg");
      const preview = await magicBeans.createPreview(result, 10);

      expect(preview).toBeInstanceOf(Buffer);
    });

    it("应该保存预览图片", async () => {
      const magicBeans = new MagicBeans({
        width: 2,
        height: 2,
        palette: customColors,
      });

      const result = await magicBeans.convertFromSource("test-image.jpg");

      await expect(
        magicBeans.savePreview(result, "test-preview.png")
      ).resolves.not.toThrow();
    });

    it("应该导出图案数据", async () => {
      const magicBeans = new MagicBeans({
        width: 2,
        height: 2,
        palette: customColors,
      });

      const result = await magicBeans.convertFromSource("test-image.jpg");
      const pattern = magicBeans.exportPattern(result);

      expect(pattern.pattern).toHaveLength(2); // 2行
      expect(pattern.pattern[0]).toHaveLength(2); // 每行2列
      expect(pattern.legend).toBeDefined();
      expect(pattern.statistics).toBeDefined();
    });

    it("应该导出为JSON", async () => {
      const magicBeans = new MagicBeans({
        width: 2,
        height: 2,
        palette: customColors,
      });

      const result = await magicBeans.convertFromSource("test-image.jpg");
      const json = magicBeans.exportToJSON(result);

      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.result).toBeDefined();
      expect(parsed.result.dimensions).toBeDefined();
      expect(parsed.result.pixels).toBeDefined();
      expect(parsed.result.pattern).toBeDefined();
    });

    it("应该导出颜色统计为CSV", async () => {
      const magicBeans = new MagicBeans({
        width: 2,
        height: 2,
        palette: customColors,
      });

      const result = await magicBeans.convertFromSource("test-image.jpg");
      const csv = magicBeans.exportColorStatsToCSV(result);

      expect(csv).toContain("Color Name,Hex,RGB,Brand,Count,Percentage");
      expect(csv.split("\n").length).toBeGreaterThan(1);
    });
  });

  describe("批量转换", () => {
    it("应该批量转换多个图片", async () => {
      const magicBeans = new MagicBeans({
        width: 2,
        height: 2,
        palette: customColors,
      });

      const sources = ["image1.jpg", "image2.png"];
      const results = await magicBeans.convertBatch(sources);

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result.pixels).toHaveLength(4);
        expect(result.dimensions.width).toBe(2);
        expect(result.dimensions.height).toBe(2);
      });
    });
  });

  describe("实用功能", () => {
    it("应该估算拼豆用量", async () => {
      const magicBeans = new MagicBeans({
        width: 2,
        height: 2,
        palette: customColors,
      });

      const result = await magicBeans.convertFromSource("test-image.jpg");
      const usage = magicBeans.estimateBeadUsage(result);

      expect(usage.totalBeads).toBe(4); // 2x2 = 4 颗拼豆
      expect(usage.colorBreakdown).toBeInstanceOf(Array);
      expect(usage.colorBreakdown.length).toBeGreaterThan(0);
    });
  });

  describe("错误处理", () => {
    it("应该处理无效的ProcessedImage", async () => {
      const magicBeans = new MagicBeans({ palette: customColors });

      await expect(
        magicBeans.convertFromProcessedImage(null as any)
      ).rejects.toThrow();
    });
  });
});
