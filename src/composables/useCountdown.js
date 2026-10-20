import { onMounted, onUnmounted, ref } from 'vue'

export function useCountdown(durationMs, onComplete) {
  const remainingMs = ref(durationMs)
  const deadline = Date.now() + durationMs
  let intervalId
  let completed = false

  const tick = () => {
    remainingMs.value = Math.max(0, deadline - Date.now())
    if (!remainingMs.value && !completed) {
      completed = true
      onComplete()
    }
  }

  onMounted(() => {
    tick()
    intervalId = window.setInterval(tick, 200)
  })
  onUnmounted(() => window.clearInterval(intervalId))

  return { remainingMs }
}
