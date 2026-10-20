<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCountdown } from '../composables/useCountdown'
import { playGentleBell } from '../composables/useAudio'

const router = useRouter()

async function finishPomodoro() {
  try {
    await playGentleBell()
  } catch (error) {
    console.warn('Không thể phát âm thanh kết thúc tập trung.', error)
  }
}

const { remainingMs } = useCountdown(25 * 60_000, finishPomodoro)
const formattedTime = computed(() => {
  const seconds = Math.ceil(remainingMs.value / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
})
</script>

<template>
  <main class="pomodoro-view">
    <p class="eyebrow">Một khoảng tập trung</p>
    <time class="pomodoro-time" aria-live="off">{{ formattedTime }}</time>
    <p class="intro-copy">25 phút, theo nhịp của bạn.</p>
    <p v-if="remainingMs === 0" class="pomodoro-done" role="status">Khoảng tập trung đã kết thúc.</p>
    <button class="quiet-button" type="button" aria-label="Kết thúc khoảng tập trung" @click="router.push('/')">Kết thúc</button>
  </main>
</template>
