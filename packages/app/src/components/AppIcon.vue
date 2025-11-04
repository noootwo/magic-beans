<template>
  <Icon
    :icon="name"
    :width="size"
    :height="size"
    :aria-label="ariaLabel"
    :style="{ color }"
  />
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

withDefaults(defineProps<{
  name: string
  size?: 16 | 20 | 24 | 32 | number | string
  ariaLabel?: string
  color?: string
}>(), {
  size: 20,
  color: 'currentColor',
  ariaLabel: undefined,
})
</script>