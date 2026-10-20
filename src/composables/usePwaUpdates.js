import { onMounted, onUnmounted, ref } from 'vue'

export function usePwaUpdates() {
  const updateAvailable = ref(false)
  let registration
  let installingWorker
  let installingStateHandler
  let reloadOnControllerChange = false

  const onControllerChange = () => {
    if (reloadOnControllerChange) window.location.reload()
  }

  function watchInstallingWorker() {
    if (!registration?.installing) return
    installingWorker = registration.installing
    installingStateHandler = () => {
      if (installingWorker?.state === 'installed' && navigator.serviceWorker.controller) {
        updateAvailable.value = true
      }
    }
    installingWorker.addEventListener('statechange', installingStateHandler)
  }

  onMounted(async () => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    try {
      registration = await navigator.serviceWorker.ready
      updateAvailable.value = Boolean(registration.waiting && navigator.serviceWorker.controller)
      registration.addEventListener('updatefound', watchInstallingWorker)
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
      registration.update().catch(() => {})
    } catch (error) {
      console.warn('Không thể kiểm tra phiên bản Boring Time mới.', error)
    }
  })

  onUnmounted(() => {
    registration?.removeEventListener('updatefound', watchInstallingWorker)
    if (installingWorker && installingStateHandler) {
      installingWorker.removeEventListener('statechange', installingStateHandler)
    }
    navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange)
  })

  function applyUpdate() {
    if (!registration?.waiting) return
    reloadOnControllerChange = true
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  return { updateAvailable, applyUpdate }
}
