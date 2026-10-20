<script setup>
import AppHeader from '../components/ui/AppHeader.vue'
import SoundMixer from '../components/ui/SoundMixer.vue'
import ReminderManager from '../components/ui/ReminderManager.vue'
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()
const durationOptions = [5, 10, 15, 20]
const activities = [
  { value: 'dot', label: 'Chấm chạy chậm' },
  { value: 'count', label: 'Đếm vô nghĩa' },
  { value: 'lines', label: 'Đường kẻ lặp' },
  { value: 'paint', label: 'Sơn khô' },
  { value: 'typing', label: 'Gõ lặp' },
]
function update(key, value) {
  settings.update({ [key]: value })
}
</script>

<template>
  <main class="page">
    <AppHeader title="Cài đặt" />
    <section class="standard-content settings-content">
      <p class="eyebrow">Điều chỉnh theo cách của bạn</p>
      <h1>Cài đặt</h1>
      <div class="settings-group">
        <label class="setting-row">
          <span>Thời lượng mặc định</span>
          <select :value="settings.duration" aria-label="Thời lượng mặc định" @change="update('duration', Number($event.target.value))">
            <option v-for="duration in [...new Set([...durationOptions, settings.duration])].sort((a, b) => a - b)" :key="duration" :value="duration">{{ duration }} phút</option>
          </select>
        </label>
        <label class="setting-row">
          <span>Hoạt động mặc định</span>
          <select :value="settings.activity" aria-label="Hoạt động mặc định" @change="update('activity', $event.target.value)">
            <option v-for="item in activities" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label class="setting-row toggle-row">
          <span>Hiện đồng hồ trong phiên</span>
          <input :checked="settings.showTimer" type="checkbox" @change="update('showTimer', $event.target.checked)" />
        </label>
        <label class="setting-row toggle-row">
          <span>Hít thở nhẹ trước phiên <small>30 giây</small></span>
          <input :checked="settings.openingBreath" aria-label="Bật hoặc tắt hít thở mở đầu" type="checkbox" @change="update('openingBreath', $event.target.checked)" />
        </label>
        <label class="setting-row">
          <span>Giao diện</span>
          <select :value="settings.theme" aria-label="Chế độ sáng tối" @change="update('theme', $event.target.value)">
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </select>
        </label>
        <label class="setting-row toggle-row">
          <span>Lưu lịch sử trên thiết bị</span>
          <input :checked="settings.saveData" type="checkbox" @change="update('saveData', $event.target.checked)" />
        </label>
        <label class="setting-row toggle-row">
          <span>Gợi ý tăng 2 phút sau ba phiên hoàn thành</span>
          <input :checked="settings.suggestDurationIncrease" type="checkbox" aria-label="Bật gợi ý tăng thời lượng" @change="update('suggestDurationIncrease', $event.target.checked)" />
        </label>
      </div>
      <div class="settings-group settings-mix-group"><SoundMixer /></div>
      <div class="settings-group"><ReminderManager /></div>
      <section class="settings-group breathing-settings-note">
        <h2>Lưu ý khi tập thở</h2>
        <p>Thở nhẹ nhàng, không gắng sức. Nếu thấy chóng mặt, choáng hoặc khó chịu, hãy quay lại thở bình thường. Đây là bài tập thư giãn, không thay thế tư vấn y tế.</p>
      </section>
      <section class="settings-group shortcut-help">
        <h2>Phím tắt</h2>
        <p><kbd>Space</kbd> bắt đầu ở màn hình chính hoặc tạm dừng/tiếp tục trong phiên.</p>
        <p><kbd>Esc</kbd> giữ 3 giây để kết thúc phiên.</p>
        <p><kbd>1</kbd>–<kbd>5</kbd> chọn điểm tập trung ở màn hình đánh giá.</p>
      </section>
      <p class="settings-note">Cài đặt và lịch sử được lưu trong trình duyệt này. Tắt lưu lịch sử sẽ chỉ ngăn các phiên mới được ghi lại.</p>
    </section>
  </main>
</template>
