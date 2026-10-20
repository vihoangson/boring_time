<script setup>
import { computed, ref } from 'vue'
import AppHeader from '../components/ui/AppHeader.vue'
import { clearData, DEFAULT_SETTINGS, exportData, importData } from '../services/storage'
import { useSessionsStore } from '../stores/sessions'
import { useSettingsStore } from '../stores/settings'

const sessions = useSessionsStore()
const settings = useSettingsStore()
const notice = ref('')
const fileInput = ref(null)
const activityNames = { dot: 'Chấm chạy chậm', count: 'Đếm vô nghĩa', lines: 'Đường kẻ lặp', paint: 'Sơn khô', typing: 'Gõ lặp' }
const soundNames = { brown: 'Tiếng ồn nâu', white: 'Tiếng ồn trắng nhẹ', rain: 'Mưa đều', tick: 'Tích tắc chậm', silence: 'Im lặng' }
const recentWeeks = computed(() => {
  const now = new Date()
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const next = new Date(date)
    next.setDate(next.getDate() + 1)
    const day = sessions.items.filter((item) => {
      const ended = new Date(item.endedAt)
      return ended >= date && ended < next
    })
    const scores = day.flatMap((item) => [item.mood, item.focus].filter(Number.isFinite))
    return {
      label: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
      count: day.length,
      average: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
    }
  })
})
const maxSessions = computed(() => Math.max(1, ...recentWeeks.value.map((day) => day.count)))

function exportJson() {
  const blob = new Blob([JSON.stringify(exportData(settings.$state, sessions.items), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `boring-time-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
async function importJson(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const imported = importData(JSON.parse(await file.text()))
    settings.update(imported.settings)
    sessions.replace(imported.sessions)
    notice.value = `Đã nhập ${imported.sessions.length} phiên.`
  } catch (error) {
    notice.value = error instanceof Error ? error.message : 'Không thể nhập tệp này.'
  } finally {
    event.target.value = ''
  }
}
function clearHistory() {
  if (!window.confirm('Xóa toàn bộ lịch sử và dữ liệu đã lưu trên thiết bị này?')) return
  if (!clearData()) {
    notice.value = 'Không thể xóa dữ liệu khỏi bộ nhớ trình duyệt.'
    return
  }
  settings.$patch({ ...DEFAULT_SETTINGS })
  sessions.items = []
  notice.value = 'Dữ liệu đã được xóa.'
}
</script>

<template>
  <main class="page">
    <AppHeader title="Lịch sử" />
    <section class="standard-content">
      <p class="eyebrow">Nhìn lại nhẹ nhàng</p>
      <h1>Lịch sử</h1>
      <section class="chart-card" aria-label="Thống kê bảy ngày gần nhất">
        <h2>7 ngày gần nhất</h2>
        <div class="week-chart">
          <div v-for="day in recentWeeks" :key="day.label" class="chart-day">
            <span class="chart-count">{{ day.count }}</span>
            <div class="bar-track" :aria-label="`${day.count} phiên`">
              <span class="bar" :style="{ height: `${Math.max(5, (day.count / maxSessions) * 100)}%` }" />
            </div>
            <span class="chart-label">{{ day.label }}</span>
            <span class="chart-average">{{ day.average === null ? '—' : day.average.toFixed(1) }}</span>
          </div>
        </div>
        <p class="chart-caption">Số phía trên: phiên · số phía dưới: điểm cảm xúc/tập trung trung bình</p>
      </section>

      <div class="history-heading"><h2>Các phiên gần đây</h2><span>{{ sessions.items.length }} phiên</span></div>
      <p v-if="!sessions.items.length" class="empty-state">Chưa có phiên nào được lưu.</p>
      <ul v-else class="session-list">
        <li v-for="item in sessions.items" :key="item.id" class="history-item">
          <div>
            <time>{{ new Date(item.endedAt).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) }}</time>
            <p>{{ item.duration }} phút · {{ activityNames[item.activity] || item.activity }} · {{ soundNames[item.sound] || item.sound }}</p>
          </div>
          <span class="session-score">{{ item.mood ?? '—' }} / {{ item.focus ?? '—' }}</span>
        </li>
      </ul>
      <section class="data-actions">
        <h2>Dữ liệu trên thiết bị</h2>
        <p>Xuất JSON để sao lưu. Nhập JSON sẽ thay thế cài đặt và lịch sử hiện có. Không có dữ liệu nào được gửi đi.</p>
        <div class="button-row">
          <button class="secondary-button" type="button" @click="exportJson">Xuất JSON</button>
          <button class="secondary-button" type="button" @click="fileInput?.click()">Nhập JSON</button>
          <button class="text-button danger-text" type="button" @click="clearHistory">Xóa toàn bộ dữ liệu</button>
          <input ref="fileInput" class="visually-hidden" type="file" accept="application/json,.json" aria-label="Chọn tệp JSON để nhập" @change="importJson" />
        </div>
        <p v-if="notice" class="muted-note" role="status">{{ notice }}</p>
      </section>
    </section>
  </main>
</template>
