<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const count = ref(1)
let timer
const visible = computed(() => count.value > 0)
onMounted(() => {
  timer = window.setInterval(() => { count.value += 1 }, 5000)
})
onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <div class="activity-stage count-stage" aria-label="Số đếm tăng dần chậm">
    <span :key="count" class="count-number" :class="{ 'is-visible': visible }">{{ count }}</span>
  </div>
</template>
