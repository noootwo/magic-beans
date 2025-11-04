import { BeadColor, ConversionResult, PixelInfo } from '../types'

export type PixelPredicate = (p: PixelInfo) => boolean

export function updatePixelColor(
  result: ConversionResult,
  x: number,
  y: number,
  beadColor: BeadColor
): ConversionResult {
  const pixels = result.pixels.map(p => (p.x === x && p.y === y ? { ...p, beadColor } : p))
  return { ...result, pixels }
}

export function updatePixelsByPredicate(
  result: ConversionResult,
  predicate: PixelPredicate,
  updater: (p: PixelInfo) => PixelInfo
): ConversionResult {
  const pixels = result.pixels.map(p => (predicate(p) ? updater({ ...p }) : p))
  return { ...result, pixels }
}

export function removePixelsByPredicate(
  result: ConversionResult,
  predicate: PixelPredicate
): ConversionResult {
  const pixels = result.pixels.filter(p => !predicate(p))
  return { ...result, pixels }
}

export function addPixels(
  result: ConversionResult,
  newPixels: PixelInfo[]
): ConversionResult {
  // ensure no duplicates by (x,y), newPixels overwrite existing
  const key = (p: PixelInfo) => `${p.x},${p.y}`
  const map = new Map<string, PixelInfo>()
  for (const p of result.pixels) map.set(key(p), p)
  for (const p of newPixels) map.set(key(p), p)
  const pixels = Array.from(map.values())
  return { ...result, pixels }
}