import * as React from 'react'
import { BeadsChart } from '../lib/BeadsChart'
import type { BeadDatum, GridDimensions, InteractionOptions, SegmentationOptions, ZoomOptions, PanOptions } from '../lib/types'
import type { BeadColor } from '@magic-beans/core'

export type BeadsChartReactProps = {
  className?: string
  style?: React.CSSProperties
  dimensions: GridDimensions
  beadData?: BeadDatum[]
  source?: string | Blob | HTMLImageElement
  palette?: BeadColor[]
  maintainAspectRatio?: boolean
  backgroundColor?: { r: number; g: number; b: number }
  showColorCodes?: boolean
  codeLabelOptions?: {
    codeLabelColor?: string
    codeLabelAutoContrast?: boolean
    codeLabelMinSize?: number
    codeLabelFont?: string
  }
  segmentation?: SegmentationOptions
  interaction?: InteractionOptions
  zoom?: ZoomOptions
  pan?: PanOptions
  editEnabled?: boolean
  editTool?: 'paint' | 'flood' | 'erase'
  brushBead?: BeadColor
  onHover?: (ev: any) => void
  onClick?: (ev: any) => void
  onSelectionChange?: (ev: any) => void
  onEditChange?: (ev: any) => void
}

export const BeadsChartReact: React.FC<BeadsChartReactProps> = (props) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const chartRef = React.useRef<BeadsChart | null>(null)

  // Initialize chart
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

  const chart = new BeadsChart({
      container: el,
      dimensions: props.dimensions,
      beadSize: 10,
      interaction: props.interaction,
      edit: { enabled: !!props.editEnabled },
      zoom: props.zoom,
      pan: props.pan,
      segmentation: props.segmentation,
      showColorCodes: props.showColorCodes,
      codeLabelColor: props.codeLabelOptions?.codeLabelColor,
      codeLabelAutoContrast: props.codeLabelOptions?.codeLabelAutoContrast,
      codeLabelMinSize: props.codeLabelOptions?.codeLabelMinSize,
      codeLabelFont: props.codeLabelOptions?.codeLabelFont,
    })
    chartRef.current = chart

    if (props.beadData) {
      chart.dataSource(props.beadData, props.dimensions)
    } else if (props.source && props.palette) {
      chart.convertFromImage(props.source, {
        targetWidth: props.dimensions.width,
        targetHeight: props.dimensions.height,
        palette: props.palette,
        maintainAspectRatio: props.maintainAspectRatio,
        backgroundColor: props.backgroundColor,
      })
    }

    if (props.brushBead) chart.setBrushBeadColor(props.brushBead)
    if (props.editTool) chart.setEditTool(props.editTool)

    if (props.onHover) chart.on('hover', props.onHover)
    if (props.onClick) chart.on('click', props.onClick)
    if (props.onSelectionChange) chart.on('selection-change', props.onSelectionChange)
    if (props.onEditChange) chart.on('edit-change', props.onEditChange)

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        const size = Math.max(1, Math.floor(width / props.dimensions.width))
        chart.setBeadSize(size)
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.destroy()
      chartRef.current = null
      el.innerHTML = ''
    }
  }, [props.dimensions.width, props.dimensions.height])

  // Prop responders
  React.useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    if (props.beadData) chart.dataSource(props.beadData, props.dimensions)
  }, [props.beadData])

  React.useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    if (props.showColorCodes !== undefined) chart.setShowColorCodes(props.showColorCodes)
    if (props.codeLabelOptions) chart.setColorCodeLabelOptions(props.codeLabelOptions)
  }, [props.showColorCodes, props.codeLabelOptions])

  React.useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    chart.enableEdit(!!props.editEnabled)
    if (props.editTool) chart.setEditTool(props.editTool)
    if (props.brushBead) chart.setBrushBeadColor(props.brushBead)
  }, [props.editEnabled, props.editTool, props.brushBead])

  return React.createElement('div', {
    ref: containerRef,
    className: props.className,
    style: { display: 'inline-block', ...props.style },
  })
}

// 兼容旧名导出
export type PixelChartReactProps = BeadsChartReactProps
export const PixelChartReact: React.FC<BeadsChartReactProps> = BeadsChartReact