import { onMounted, onUnmounted, ref } from 'vue'

export function useCountdown(durationMs, onComplete) {
  const remainingMs = ref(durationMs)
  let intervalId
  let completed = false
  let paused = false
  let deadline = Date.now() + durationMs

  const tick = () => {
    if (paused) return
    remainingMs.value = Math.max(0, deadline - Date.now())
    if (!remainingMs.value && !completed) {
      completed = true
      onComplete()
    }
  }

  const pause = () => {
    if (paused) return
    remainingMs.value = Math.max(0, deadline - Date.now())
    paused = true
  }
  const resume = () => {
    if (!paused) return
    deadline = Date.now() + remainingMs.value
    paused = false
    tick()
  }
  const pauseForUrge = () => pause()
  const resumeAfterUrge = () => resume()

  onMounted(() => {
    tick()
    intervalId = window.setInterval(tick, 200)
    window.addEventListener('boring-time:urge-start', pauseForUrge)
    window.addEventListener('boring-time:urge-end', resumeAfterUrge)
  })
  onUnmounted(() => {
    window.clearInterval(intervalId)
    window.removeEventListener('boring-time:urge-start', pauseForUrge)
    window.removeEventListener('boring-time:urge-end', resumeAfterUrge)
  })

  return { remainingMs }
}
