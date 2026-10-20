import { onMounted, onUnmounted } from 'vue'
import { useSessionStore } from '../stores/session'

export function useTimer(onComplete) {
  const session = useSessionStore()
  let intervalId

  const tick = () => {
    session.updateRemaining()
    if (session.remainingMs > 0 || !session.active || session.paused) return
    if (session.phase === 'breathing') session.beginActivity()
    else onComplete(true)
  }

  onMounted(() => {
    tick()
    intervalId = window.setInterval(tick, 250)
  })

  onUnmounted(() => window.clearInterval(intervalId))
}
