// 仅用于类型解析的垫片，避免 IDE 报 “找不到模块 'vue'”
// 构建时仍将 vue 标记为 external，不会被打包
declare module 'vue' {
  export const defineComponent: any
  export const h: any
  export const onMounted: any
  export const onBeforeUnmount: any
  export const watch: any
  export type PropType<T> = any
}

declare module '*.vue' {
  const component: any
  export default component
}