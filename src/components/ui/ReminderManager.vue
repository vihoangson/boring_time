<script setup>
import { computed, onMounted, ref } from 'vue'
import { useSettingsStore } from '../../stores/settings'

const settings = useSettingsStore()
const days = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' },
]
const selectedDays = ref([1, 2, 3, 4, 5])
const time = ref('09:00')
const permission = ref('unsupported')
const notice = ref('')
const canAdd = computed(() => selectedDays.value.length > 0 && settings.reminders.length < 20)

onMounted(() => {
  if ('Notification' in window) permission.value = Notification.permission
})

function updateReminders(reminders) {
  settings.update({ reminders })
}
function addReminder() {
  if (!canAdd.value) return
  updateReminders([...settings.reminders, {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    days: [...selectedDays.value].sort((a, b) => a - b),
    time: time.value,
    enabled: true,
  }])
}
function toggleDay(day) {
  selectedDays.value = selectedDays.value.includes(day)
    ? selectedDays.value.filter((value) => value !== day)
    : [...selectedDays.value, day]
}
function toggleReminder(id, enabled) {
  updateReminders(settings.reminders.map((reminder) => reminder.id === id ? { ...reminder, enabled } : reminder))
}
function removeReminder(id) {
  updateReminders(settings.reminders.filter((reminder) => reminder.id !== id))
}
function describeDays(reminder) {
  return days.filter((day) => reminder.days.includes(day.value)).map((day) => day.label).join(' · ')
}
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    notice.value = 'Thông báo hệ thống không được trình duyệt hỗ trợ; lời nhắc sẽ hiện trong ứng dụng.'
    return
  }
  try {
    permission.value = await Notification.requestPermission()
    notice.value = permission.value === 'granted'
      ? 'Đã bật thông báo khi ứng dụng đang chạy.'
      : 'Chưa được cấp quyền; lời nhắc sẽ chỉ hiện trong ứng dụng.'
  } catch (error) {
    console.warn('Không thể xin quyền thông báo.', error)
    notice.value = 'Không thể bật thông báo; lời nhắc sẽ chỉ hiện trong ứng dụng.'
  }
}
</script>

<template>
  <section class="reminder-manager">
    <h2>Lịch nhắc</h2>
    <p class="settings-note">Lời nhắc chỉ hoạt động khi ứng dụng đang mở hoặc PWA đang chạy. Không thể nhắc khi ứng dụng hoàn toàn đã đóng vì không có máy chủ.</p>
    <div class="reminder-editor">
      <fieldset class="day-picker">
        <legend>Ngày lặp lại</legend>
        <div class="day-options">
          <button
            v-for="day in days"
            :key="day.value"
            class="day-option"
            :class="{ selected: selectedDays.includes(day.value) }"
            type="button"
            :aria-label="`Chọn ${day.label}`"
            :aria-pressed="selectedDays.includes(day.value)"
            @click="toggleDay(day.value)"
          >{{ day.label }}</button>
        </div>
      </fieldset>
      <label class="reminder-time">Giờ <input v-model="time" type="time" aria-label="Giờ nhắc" /></label>
      <button class="secondary-button" type="button" :disabled="!canAdd" @click="addReminder">Thêm lịch</button>
    </div>
    <ul v-if="settings.reminders.length" class="reminder-list">
      <li v-for="reminder in settings.reminders" :key="reminder.id">
        <div><strong>{{ reminder.time }}</strong><span>{{ describeDays(reminder) }}</span></div>
        <label class="reminder-enabled"><span class="visually-hidden">Bật lịch {{ reminder.time }}</span><input :checked="reminder.enabled" type="checkbox" @change="toggleReminder(reminder.id, $event.target.checked)" /></label>
        <button class="text-button danger-text" type="button" :aria-label="`Xóa lịch ${reminder.time}`" @click="removeReminder(reminder.id)">Xóa</button>
      </li>
    </ul>
    <p v-else class="muted-note">Chưa có lịch nhắc nào.</p>
    <button v-if="permission !== 'granted'" class="text-button notification-permission" type="button" @click="requestNotificationPermission">Bật thông báo hệ thống (tùy chọn)</button>
    <p v-if="notice" class="muted-note" role="status">{{ notice }}</p>
  </section>
</template>
