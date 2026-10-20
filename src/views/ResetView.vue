<script setup>
import { computed } from 'vue'
import AppHeader from '../components/ui/AppHeader.vue'
import HabitMap from '../components/urge/HabitMap.vue'
import IfThenPlans from '../components/urge/IfThenPlans.vue'
import AlternativeMenu from '../components/urge/AlternativeMenu.vue'
import UrgeInsights from '../components/urge/UrgeInsights.vue'
import { useSettingsStore } from '../stores/settings'
import { useUrgesStore } from '../stores/urges'

const settings = useSettingsStore()
const urges = useUrgesStore()
const weekCount = computed(() => urges.currentWeekCount)
const recentEntries = computed(() => urges.urgeEntries.slice(0, 30))

function updateDelay(value) {
  urges.setDelayMinutes(Number(value))
}
</script>

<template>
  <main class="page">
    <AppHeader title="Giảm kích thích" />
    <section class="standard-content reset-content">
      <p class="eyebrow">Nhìn thấy lựa chọn, không phán xét</p>
      <h1>Reset tập trung</h1>
      <p class="intro-copy">Tạo một khoảng dừng nhỏ để nhận ra mình đang cần gì.</p>
      <p class="reset-boundary-note">Boring Time không thể chặn ứng dụng hoặc trang web khác. Nếu phù hợp, bạn có thể bật chế độ Không làm phiền hoặc Focus trên thiết bị.</p>

      <section class="reset-section reset-delay-settings">
        <h2>Khoảng trì hoãn</h2>
        <label class="reset-field">Thời lượng
          <select :value="urges.delayMinutes" aria-label="Thời lượng trì hoãn mặc định" @change="updateDelay($event.target.value)">
            <option :value="5">5 phút</option>
            <option :value="10">10 phút</option>
            <option :value="20">20 phút</option>
          </select>
        </label>
        <label class="toggle-row reset-toggle">
          <span>Gợi ý tăng thời gian dần dần <small>Không tự thay đổi lựa chọn của bạn</small></span>
          <input :checked="urges.gradualDelay" type="checkbox" aria-label="Bật gợi ý trì hoãn tăng dần" @change="urges.setGradualDelay($event.target.checked)" />
        </label>
        <p v-if="urges.getSuggestedDelay()" class="muted-note" role="status">Nếu thấy phù hợp, có thể thử {{ urges.getSuggestedDelay() }} phút lần sau.</p>
      </section>
      <p class="week-count">Tuần này bạn đã dừng lại {{ weekCount }} lần để quan sát cơn muốn.</p>
      <p v-if="!settings.saveData" class="muted-note">Lịch sử thôi thúc và hoạt động thay thế chưa được lưu vì đã tắt lưu dữ liệu.</p>

      <UrgeInsights />

      <section class="reset-section">
        <h2>Ghi nhận gần đây</h2>
        <p v-if="!recentEntries.length" class="empty-state">Chưa có ghi nhận nào được lưu.</p>
        <ul v-else class="simple-record-list">
          <li v-for="entry in recentEntries" :key="entry.id">
            <div>
              <time>{{ new Date(entry.createdAt).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) }}</time>
              <p>{{ entry.habitName || entry.habitId }} · {{ entry.emotion }}<span v-if="entry.note"> · {{ entry.note }}</span></p>
              <p v-if="entry.outcome">{{ entry.outcome }} · {{ entry.decision }}</p>
              <p v-else-if="entry.exitedEarly">Đã dừng sớm</p>
            </div>
          </li>
        </ul>
      </section>
      <HabitMap />
      <IfThenPlans />
      <AlternativeMenu />
      <section class="reset-section reset-support-note">
        <p>Nếu cảm giác buồn chán, mất hứng thú hoặc lo âu kéo dài và nặng, trò chuyện với người thân hoặc chuyên gia cũng là một lựa chọn tốt.</p>
      </section>
    </section>
  </main>
</template>
