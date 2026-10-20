import { onMounted, onUnmounted, watch } from 'vue'

export function useWakeLock(active) {
  let lock

  const request = async () => {
    if (!active.value || !('wakeLock' in navigator)) return
    try {
      lock = await navigator.wakeLock.request('screen')
    } catch (error) {
      if (error?.name !== 'NotAllowedError') console.warn('Không thể bật Screen Wake Lock.', error)
    }
  }
  const release = async () => {
    if (lock) {
      await lock.release()
      lock = null
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible') request()
  }

  onMounted(() => {
    request()
    document.addEventListener('visibilitychange', onVisibility)
  })
  watch(active, (value) => (value ? request() : release()))
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    release()
  })
}
