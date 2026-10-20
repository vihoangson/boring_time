<script setup>
import { computed } from 'vue'

const props = defineProps({
  phase: { type: String, required: true },
  progress: { type: Number, required: true },
  phaseSeconds: { type: Number, required: true },
  isIntro: { type: Boolean, default: false },
})

const visualStyle = computed(() => ({
  '--phase-duration': `${props.phaseSeconds}s`,
  '--breath-scale': props.phase === 'inhale' ? 1.14 : props.phase === 'exhale' ? 0.88 : 1,
}))
</script>

<template>
  <div class="breath-visual" :class="[`breath-${phase}`, { 'breath-intro': isIntro }]" :style="visualStyle" aria-hidden="true">
    <svg class="breath-ring" viewBox="0 0 240 240">
      <circle class="breath-ring-outline" cx="120" cy="120" r="92" />
      <circle class="breath-ring-core" cx="120" cy="120" r="70" />
    </svg>
  </div>
</template>
