import { defineComponent, h, onMounted, onBeforeUnmount, watch, PropType } from 'vue'
import { BeadsChart } from '../lib/BeadsChart'
import type { BeadDatum, GridDimensions, InteractionOptions, SegmentationOptions, ZoomOptions, PanOptions, HoverEvent, ClickEvent, SelectionChangeEvent, EditChangeEvent } from '../lib/types'
import type { BeadColor } from '@magic-beans/core'

type BackgroundRGB = { r: number; g: number; b: number }
type CodeLabelOptions = { codeLabelColor?: string; codeLabelAutoContrast?: boolean; codeLabelMinSize?: number; codeLabelFont?: string }
type BeadsChartVueProps = {
  dimensions: GridDimensions;
  beadData?: BeadDatum[];
  source?: string | Blob | HTMLImageElement;
  palette?: BeadColor[];
  maintainAspectRatio?: boolean;
  backgroundColor?: BackgroundRGB;
  showColorCodes?: boolean;
  codeLabelOptions?: CodeLabelOptions;
  segmentation?: SegmentationOptions;
  interaction?: InteractionOptions;
  zoom?: ZoomOptions;
  pan?: PanOptions;
  editEnabled?: boolean;
  editTool?: 'paint' | 'flood' | 'erase';
  brushBead?: BeadColor;
}

export const BeadsChartVue: ReturnType<typeof defineComponent> = defineComponent({
  name: 'BeadsChartVue',
  props: {
    dimensions: { type: Object as PropType<GridDimensions>, required: true },
    beadData: { type: Array as PropType<BeadDatum[] | undefined>, required: false },
    source: { type: [String, Object] as PropType<string | Blob | HTMLImageElement | undefined>, required: false },
    palette: { type: Array as PropType<BeadColor[] | undefined>, required: false },
    maintainAspectRatio: { type: Boolean as PropType<boolean | undefined>, required: false },
    backgroundColor: { type: Object as PropType<BackgroundRGB | undefined>, required: false },
    showColorCodes: { type: Boolean as PropType<boolean | undefined>, required: false },
    codeLabelOptions: { type: Object as PropType<CodeLabelOptions | undefined>, required: false },
    segmentation: { type: Object as PropType<SegmentationOptions | undefined>, required: false },
    interaction: { type: Object as PropType<InteractionOptions | undefined>, required: false },
    zoom: { type: Object as PropType<ZoomOptions | undefined>, required: false },
    pan: { type: Object as PropType<PanOptions | undefined>, required: false },
    editEnabled: { type: Boolean as PropType<boolean | undefined>, required: false },
    editTool: { type: String as PropType<'paint' | 'flood' | undefined>, required: false },
    brushBead: { type: Object as PropType<BeadColor | undefined>, required: false },
  },
  emits: {
    hover: (_e: HoverEvent) => true,
    click: (_e: ClickEvent) => true,
    'selection-change': (_e: SelectionChangeEvent) => true,
    'edit-change': (_e: EditChangeEvent) => true,
  },
  setup(props: Readonly<BeadsChartVueProps>, { emit }: { emit: (event: 'hover' | 'click' | 'selection-change' | 'edit-change', payload: unknown) => void }) {
    let el: HTMLElement | null = null
    let chart: BeadsChart | null = null
    let ro: ResizeObserver | null = null

    onMounted(() => {
      if (!el) return
      chart = new BeadsChart({
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

      chart.on('hover', (e: HoverEvent) => emit('hover', e))
      chart.on('click', (e: ClickEvent) => emit('click', e))
      chart.on('selection-change', (e: SelectionChangeEvent) => emit('selection-change', e))
      chart.on('edit-change', (e: EditChangeEvent) => emit('edit-change', e))

      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width
          const size = Math.max(1, Math.floor(width / props.dimensions.width))
          chart!.setBeadSize(size)
        }
      })
      ro.observe(el)
    })

    onBeforeUnmount(() => {
      ro?.disconnect()
      chart?.destroy()
      chart = null
    })

    // watchers for reactive props
    watch(() => props.beadData, (val: BeadDatum[] | undefined) => {
      if (!chart || !val) return
      chart.dataSource(val, props.dimensions)
    })

    watch(() => props.showColorCodes, (val: boolean | undefined) => {
      if (!chart || val === undefined) return
      chart.setShowColorCodes(!!val)
    })

    watch(() => props.codeLabelOptions, (val: CodeLabelOptions | undefined) => {
      if (!chart || !val) return
      chart.setColorCodeLabelOptions(val)
    })

    watch(() => props.editEnabled, (val: boolean | undefined) => {
      if (!chart || val === undefined) return
      chart.enableEdit(!!val)
    })

    watch(() => props.editTool, (val: 'paint' | 'flood' | undefined) => {
      if (!chart || !val) return
      chart.setEditTool(val)
    })

    watch(() => props.brushBead, (val: BeadColor | undefined) => {
      if (!chart || !val) return
      chart.setBrushBeadColor(val)
    })

    return () => h('div', {
      ref: (r: any) => { el = r as HTMLElement },
      style: { display: 'inline-block' },
    })
  }
})

// 兼容旧名导出
export const PixelChartVue: ReturnType<typeof defineComponent> = BeadsChartVue