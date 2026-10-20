<script setup>
import { computed } from 'vue'
import { URGE_EMOTIONS } from '../../data/urgeDefaults'
import { useUrgesStore } from '../../stores/urges'

const urges = useUrgesStore()
const hourCounts = computed(() => Array.from({ length: 24 }, (_, hour) => urges.urgeEntries.filter((entry) => new Date(entry.createdAt).getHours() === hour).length))
const emotionCounts = computed(() => URGE_EMOTIONS.map((emotion) => ({
  emotion,
  count: urges.urgeEntries.filter((entry) => entry.emotion === emotion).length,
})).filter((item) => item.count > 0).sort((a, b) => b.count - a.count))
const maxHour = computed(() => Math.max(1, ...hourCounts.value))
const maxEmotion = computed(() => Math.max(1, ...emotionCounts.value.map((item) => item.count)))
const insight = computed(() => {
  if (urges.urgeEntries.length < 7) return 'Cần thêm dữ liệu.'
  const hour = hourCounts.value.indexOf(maxHour.value)
  const emotion = emotionCounts.value[0]?.emotion
  if (!emotion) return 'Chưa có mẫu lặp rõ ràng.'
  const time = hour < 12 ? 'buổi sáng' : hour < 18 ? 'buổi chiều' : 'buổi tối'
  return `Có vẻ như bạn hay muốn ${time} khi cảm thấy ${emotion.toLowerCase()}. Đây chỉ là một quan sát từ ghi chép của bạn.`
})
</script>

<template>
  <section class="reset-section">
    <h2>Nhìn lại nhật ký thôi thúc</h2>
    <p class="muted-note">Chỉ là những ghi nhận của bạn, không phải lời giải thích nguyên nhân.</p>
    <template v-if="urges.urgeEntries.length >= 7">
      <div class="urge-chart-card">
        <h3>Thời điểm trong ngày</h3>
        <svg viewBox="0 0 480 130" role="img" aria-label="Biểu đồ số lần ghi thôi thúc theo giờ trong ngày">
          <line x1="12" y1="104" x2="468" y2="104" class="urge-chart-axis" />
          <rect
            v-for="(count, hour) in hourCounts"
            :key="hour"
            :x="14 + hour * 19"
            :y="100 - count / maxHour * 80"
            width="11"
            :height="count ? count / maxHour * 80 : 1"
            rx="2"
            class="urge-chart-bar"
          >
            <title>{{ hour }} giờ: {{ count }} lần</title>
          </rect>
          <text v-for="hour in [0, 6, 12, 18, 23]" :key="hour" :x="14 + hour * 19" y="122" class="urge-chart-label">{{ hour }}h</text>
        </svg>
      </div>
      <div class="urge-emotion-list">
        <h3>Cảm xúc được ghi nhận</h3>
        <div v-for="item in emotionCounts" :key="item.emotion" class="urge-emotion-row">
          <span>{{ item.emotion }}</span><span class="urge-emotion-track"><i :style="{ width: `${item.count / maxEmotion * 100}%` }" /></span><span>{{ item.count }}</span>
        </div>
      </div>
    </template>
    <p v-else class="empty-state">Cần thêm dữ liệu (7 ghi nhận trở lên) để xem các mẫu theo giờ và cảm xúc.</p>
    <p class="urge-insight" role="status">{{ insight }}</p>
  </section>
</template>
