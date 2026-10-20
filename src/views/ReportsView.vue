<script setup>
import { computed } from 'vue'
import AppHeader from '../components/ui/AppHeader.vue'
import { useSessionsStore } from '../stores/sessions'

const sessions = useSessionsStore()
const activityLabels = {
  dot: 'Chấm chạy chậm',
  count: 'Đếm vô nghĩa',
  lines: 'Đường kẻ lặp',
  paint: 'Sơn khô',
  typing: 'Gõ lặp',
}
const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function mondayOf(date) {
  const monday = new Date(date)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}
function average(items, pick) {
  const values = items.map(pick).filter(Number.isFinite)
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

const weekStart = mondayOf(new Date())
const weekEnd = new Date(weekStart)
weekEnd.setDate(weekEnd.getDate() + 7)
const weekItems = computed(() => sessions.items.filter((item) => {
  const date = new Date(item.endedAt)
  return date >= weekStart && date < weekEnd
}))
const totalMinutes = computed(() => weekItems.value.reduce((sum, item) => sum + (item.duration || 0), 0))
const thisWeekCount = computed(() => weekItems.value.length)

const activityAverages = computed(() => Object.entries(activityLabels)
  .map(([id, label]) => ({
    id,
    label,
    average: average(weekItems.value.filter((item) => item.activity === id), (item) => item.focusAfter),
  }))
  .filter((item) => item.average !== null)
  .sort((a, b) => b.average - a.average))
const bestActivity = computed(() => activityAverages.value[0] || null)

const timeAverages = computed(() => {
  const groups = [
    { id: 'morning', label: 'Sáng', test: (hour) => hour >= 5 && hour < 12 },
    { id: 'afternoon', label: 'Chiều', test: (hour) => hour >= 12 && hour < 18 },
    { id: 'evening', label: 'Tối', test: (hour) => hour >= 18 || hour < 5 },
  ]
  return groups.map((group) => {
    const items = weekItems.value.filter((item) => group.test(new Date(item.endedAt).getHours()))
    return { ...group, average: average(items, (item) => item.focusAfter), count: items.length }
  }).filter((group) => group.average !== null).sort((a, b) => b.average - a.average)
})
const bestTime = computed(() => timeAverages.value[0] || null)

const emotionTransitions = computed(() => {
  const counts = new Map()
  weekItems.value.forEach((item) => {
    if (!item.emotionBefore || !item.emotionAfter) return
    const key = `${item.emotionBefore} → ${item.emotionAfter}`
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
})

const dayMinutes = computed(() => {
  const totals = new Map()
  sessions.items.forEach((item) => {
    const date = new Date(item.endedAt)
    const key = localDateKey(date)
    totals.set(key, (totals.get(key) || 0) + (item.duration || 0))
  })
  return totals
})
const maxDayMinutes = computed(() => Math.max(1, ...dayMinutes.value.values()))
const heatmapWeeks = computed(() => {
  const firstMonday = new Date(weekStart)
  firstMonday.setDate(firstMonday.getDate() - 25 * 7)
  return Array.from({ length: 26 }, (_, weekIndex) => Array.from({ length: 7 }, (_, dayIndex) => {
    const date = new Date(firstMonday)
    date.setDate(date.getDate() + weekIndex * 7 + dayIndex)
    const minutes = dayMinutes.value.get(localDateKey(date)) || 0
    return {
      key: localDateKey(date),
      label: `${date.toLocaleDateString('vi-VN', { dateStyle: 'medium' })}: ${minutes} phút`,
      minutes,
      level: minutes === 0 ? 0 : Math.min(4, Math.ceil((minutes / maxDayMinutes.value) * 4)),
    }
  }))
})

const scoredSessions = computed(() => sessions.items.filter((item) => Number.isFinite(item.focusAfter)))
const hasEnoughCorrelationData = computed(() => scoredSessions.value.length >= 5)
const correlationPoints = (kind) => {
  const items = scoredSessions.value
  const values = items.map((item) => {
    if (kind === 'duration') return item.plannedDuration || item.duration
    if (kind === 'activity') return Object.keys(activityLabels).indexOf(item.activity)
    return new Date(item.endedAt).getHours()
  })
  const min = Math.min(...values)
  const max = Math.max(...values)
  return items.map((item, index) => ({
    id: item.id,
    x: kind === 'activity'
      ? 20 + (values[index] / (Object.keys(activityLabels).length - 1)) * 280
      : 20 + (max === min ? 0.5 : (values[index] - min) / (max - min)) * 280,
    y: 120 - ((item.focusAfter - 1) / 4) * 100,
  }))
}
const xAxisCaption = (kind) => ({
  duration: 'Trục ngang: thời lượng dự định (phút).',
  activity: 'Trục ngang: chấm · đếm · đường · sơn · gõ.',
  hour: 'Trục ngang: giờ kết thúc phiên (0–23).',
}[kind])

</script>

<template>
  <main class="page">
    <AppHeader title="Báo cáo tuần" />
    <section class="standard-content report-content">
      <p class="eyebrow">Nhìn lại, không chấm điểm</p>
      <h1>Báo cáo tuần</h1>
      <p class="week-count">Tuần này bạn đã có {{ thisWeekCount }} buổi.</p>

      <section class="report-summary" aria-label="Tóm tắt tuần này">
        <article class="report-metric"><span>Tổng thời lượng</span><strong>{{ totalMinutes }} phút</strong></article>
        <article class="report-metric"><span>Số phiên</span><strong>{{ thisWeekCount }}</strong></article>
        <article class="report-metric"><span>Hoạt động có điểm tập trung trung bình cao nhất</span><strong>{{ bestActivity?.label || 'Chưa có dữ liệu' }}</strong></article>
        <article class="report-metric"><span>Khung giờ có điểm tập trung trung bình cao nhất</span><strong>{{ bestTime?.label || 'Chưa có dữ liệu' }}</strong></article>
      </section>

      <section class="report-section">
        <h2>Cảm xúc trước và sau phiên</h2>
        <p v-if="!emotionTransitions.length" class="muted-note">Chưa có đủ ghi nhận cảm xúc trong tuần này.</p>
        <ul v-else class="transition-list">
          <li v-for="[transition, count] in emotionTransitions" :key="transition">{{ transition }} <span>{{ count }} phiên</span></li>
        </ul>
      </section>

      <section class="report-section">
        <h2>Nhịp trong 26 tuần gần đây</h2>
        <div class="heatmap-layout">
          <div class="heatmap-weekdays" aria-hidden="true">
            <span v-for="day in weekdays" :key="day">{{ day }}</span>
          </div>
          <div class="heatmap-grid" role="img" aria-label="Lưới hoạt động theo ngày; sắc độ đậm hơn tương ứng tổng thời lượng cao hơn">
            <div v-for="(week, index) in heatmapWeeks" :key="index" class="heatmap-week">
              <span
                v-for="day in week"
                :key="day.key"
                class="heatmap-day"
                :class="`heat-${day.level}`"
                :title="day.label"
              />
            </div>
          </div>
        </div>
        <p class="chart-caption">Sắc độ đậm hơn biểu thị tổng số phút nhiều hơn trong ngày.</p>
      </section>

      <section class="report-section">
        <h2>Điểm tập trung theo phiên</h2>
        <p v-if="!hasEnoughCorrelationData" class="empty-state">Cần thêm dữ liệu trước khi xem biểu đồ tương quan.</p>
        <template v-else>
          <div class="correlation-grid">
            <article v-for="chart in [
              { id: 'duration', title: 'Thời lượng' },
              { id: 'activity', title: 'Hoạt động' },
              { id: 'hour', title: 'Giờ trong ngày' },
            ]" :key="chart.id" class="correlation-card">
              <h3>{{ chart.title }}</h3>
              <svg viewBox="0 0 320 145" role="img" :aria-label="`Điểm tập trung theo ${chart.title.toLowerCase()}`">
                <path d="M20 20V120H300" fill="none" stroke="currentColor" stroke-opacity=".2" />
                <text x="5" y="24" class="svg-axis-label">5</text>
                <text x="5" y="121" class="svg-axis-label">1</text>
                <circle
                  v-for="point in correlationPoints(chart.id)"
                  :key="point.id"
                  :cx="point.x"
                  :cy="point.y"
                  r="4"
                  class="correlation-point"
                />
              </svg>
              <p class="chart-caption">Trục dọc: điểm tập trung (1–5). {{ xAxisCaption(chart.id) }}</p>
            </article>
          </div>
        </template>
      </section>
    </section>
  </main>
</template>
