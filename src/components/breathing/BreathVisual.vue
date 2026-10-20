<script setup>
import { computed } from 'vue'

const props = defineProps({
  phase: { type: String, required: true },
  progress: { type: Number, default: 0 },
  isIntro: { type: Boolean, default: false },
})

const visualStyle = computed(() => {
  const progress = Math.min(1, Math.max(0, props.progress))
  const eased = progress * progress * (3 - 2 * progress)
  const scale = props.phase === 'inhale'
    ? 0.88 + eased * 0.2
    : props.phase === 'exhale'
      ? 1.08 - eased * 0.2
      : props.phase === 'hold-in'
        ? 1.08
        : props.phase === 'hold-out'
          ? 0.88
          : 1
  const opacity = props.phase === 'inhale'
    ? 0.62 + eased * 0.3
    : props.phase === 'exhale'
      ? 0.9 - eased * 0.3
      : 0.76
  return { '--breath-scale': scale, '--breath-opacity': opacity }
})
</script>

<template>
  <div class="breath-visual" :class="[`breath-${phase}`, { 'breath-intro': isIntro }]" :style="visualStyle" aria-hidden="true">
    <svg class="breath-ring" viewBox="0 0 240 240">
      <circle class="breath-ring-outline" cx="120" cy="120" r="92" />
      <circle class="breath-ring-core" cx="120" cy="120" r="70" />
    </svg>
  </div>
</template>
