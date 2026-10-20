<script setup>
import AppHeader from '../components/ui/AppHeader.vue'
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()
const activities = [
  { value: 'dot', label: 'Chấm chạy chậm' },
  { value: 'count', label: 'Đếm vô nghĩa' },
  { value: 'lines', label: 'Đường kẻ lặp' },
  { value: 'paint', label: 'Sơn khô' },
  { value: 'typing', label: 'Gõ lặp' },
]
const sounds = [
  { value: 'brown', label: 'Tiếng ồn nâu' },
  { value: 'white', label: 'Tiếng ồn trắng nhẹ' },
  { value: 'rain', label: 'Mưa đều' },
  { value: 'tick', label: 'Tích tắc chậm' },
  { value: 'silence', label: 'Im lặng' },
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
            <option v-for="duration in [5, 10, 15, 20]" :key="duration" :value="duration">{{ duration }} phút</option>
          </select>
        </label>
        <label class="setting-row">
          <span>Hoạt động mặc định</span>
          <select :value="settings.activity" aria-label="Hoạt động mặc định" @change="update('activity', $event.target.value)">
            <option v-for="item in activities" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label class="setting-row">
          <span>Âm thanh mặc định</span>
          <select :value="settings.sound" aria-label="Âm thanh mặc định" @change="update('sound', $event.target.value)">
            <option v-for="item in sounds" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label class="setting-row">
          <span>Âm lượng mặc định <small>{{ Math.round(settings.volume * 100) }}%</small></span>
          <input :value="settings.volume" aria-label="Âm lượng mặc định" type="range" min="0" max="0.3" step="0.01" @input="update('volume', Number($event.target.value))" />
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
      </div>
      <p class="settings-note">Cài đặt và lịch sử được lưu trong trình duyệt này. Tắt lưu lịch sử sẽ chỉ ngăn các phiên mới được ghi lại.</p>
    </section>
  </main>
</template>
