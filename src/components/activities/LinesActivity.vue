<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const shown = ref(1)
const lines = Array.from({ length: 12 }, (_, index) => index)
const visibleLines = computed(() => shown.value)
let timer
onMounted(() => {
  timer = window.setInterval(() => { shown.value = (shown.value % lines.length) + 1 }, 3200)
})
onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <div class="activity-stage lines-stage" aria-label="Các đường kẻ xuất hiện theo mẫu lặp lại">
    <span
      v-for="line in lines"
      :key="line"
      class="grid-line"
      :class="{ 'line-visible': line < visibleLines }"
      :style="{ '--line-index': line }"
    />
  </div>
</template>
