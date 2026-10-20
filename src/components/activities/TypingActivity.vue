<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const taps = ref(0)
const onKey = (event) => {
  if (event.code === 'Space' && !event.repeat) {
    event.preventDefault()
    taps.value += 1
  }
}
const onTap = () => { taps.value += 1 }
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <button class="activity-stage typing-stage" type="button" aria-label="Chạm hoặc nhấn phím cách theo nhịp chậm" @click="onTap">
    <span>{{ taps > 0 ? ' ' : '' }}</span>
  </button>
</template>
