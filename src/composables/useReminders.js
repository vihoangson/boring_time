import { onMounted, onUnmounted, ref } from 'vue'
import { useSettingsStore } from '../stores/settings'

export function useReminders() {
  const settings = useSettingsStore()
  const inAppReminder = ref('')
  const notified = new Set()
  let intervalId

  function checkReminders() {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
    for (const reminder of settings.reminders) {
      if (!reminder.enabled || !reminder.days.includes(now.getDay()) || reminder.time !== time) continue
      const key = `${reminder.id}-${dateKey}-${time}`
      if (notified.has(key)) continue
      notified.add(key)

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification('Boring Time', { body: 'Đã đến giờ cho một khoảng lặng.' })
          notification.onclick = () => {
            window.focus()
            notification.close()
          }
        } catch (error) {
          console.warn('Không thể hiển thị thông báo hệ thống.', error)
          inAppReminder.value = 'Đã đến giờ cho một khoảng lặng, nếu bạn muốn.'
        }
      } else {
        inAppReminder.value = 'Đã đến giờ cho một khoảng lặng, nếu bạn muốn.'
      }
    }
  }

  onMounted(() => {
    checkReminders()
    intervalId = window.setInterval(checkReminders, 15_000)
  })
  onUnmounted(() => window.clearInterval(intervalId))

  return { inAppReminder }
}
