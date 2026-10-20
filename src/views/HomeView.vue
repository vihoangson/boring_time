<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/ui/AppHeader.vue'
import { useSettingsStore } from '../stores/settings'
import { useSessionStore } from '../stores/session'

const settings = useSettingsStore()
const session = useSessionStore()
const router = useRouter()
const durations = [5, 10, 15, 20]
const activities = [
  { id: 'dot', name: 'Chấm chạy chậm', detail: 'Một chấm di chuyển qua lại' },
  { id: 'count', name: 'Đếm vô nghĩa', detail: 'Mỗi số hiện lên rồi mờ đi' },
  { id: 'lines', name: 'Đường kẻ lặp', detail: 'Các đường kẻ xuất hiện từ từ' },
  { id: 'paint', name: 'Sơn khô', detail: 'Hai sắc độ đổi màu thật chậm' },
  { id: 'typing', name: 'Gõ lặp', detail: 'Chạm màn hình hoặc nhấn phím cách' },
]
const sounds = [
  { id: 'brown', name: 'Tiếng ồn nâu' },
  { id: 'white', name: 'Tiếng ồn trắng nhẹ' },
  { id: 'rain', name: 'Mưa đều' },
  { id: 'tick', name: 'Tích tắc chậm' },
  { id: 'silence', name: 'Im lặng' },
]
const volumeLabel = computed(() => `${Math.round(settings.volume * 100)}%`)
function start() {
  session.start(settings.$state)
  router.push('/session')
}
</script>

<template>
  <main class="page">
    <AppHeader />
    <section class="home-content">
      <p class="eyebrow">Một khoảng lặng có chủ đích</p>
      <h1>Không cần làm gì cả.</h1>
      <p class="intro-copy">Hãy để tâm trí nghỉ ngơi một chút trước khi tiếp tục.</p>

      <div class="setup-section">
        <h2>Thời lượng</h2>
        <div class="choice-row duration-row" aria-label="Chọn thời lượng">
          <button
            v-for="duration in durations"
            :key="duration"
            class="choice"
            :class="{ selected: settings.duration === duration }"
            type="button"
            :aria-pressed="settings.duration === duration"
            @click="settings.update({ duration })"
          >{{ duration }} <span>phút</span></button>
        </div>
      </div>

      <div class="setup-section">
        <h2>Hoạt động</h2>
        <div class="activity-choices">
          <button
            v-for="activity in activities"
            :key="activity.id"
            class="activity-choice"
            :class="{ selected: settings.activity === activity.id }"
            type="button"
            :aria-pressed="settings.activity === activity.id"
            @click="settings.update({ activity: activity.id })"
          >
            <span>{{ activity.name }}</span>
            <small>{{ activity.detail }}</small>
          </button>
        </div>
      </div>

      <div class="setup-section sound-section">
        <div>
          <h2>Âm thanh</h2>
          <select
            :value="settings.sound"
            aria-label="Chọn âm thanh"
            @change="settings.update({ sound: $event.target.value })"
          >
            <option v-for="sound in sounds" :key="sound.id" :value="sound.id">{{ sound.name }}</option>
          </select>
        </div>
        <label class="volume-control">
          Âm lượng <span>{{ volumeLabel }}</span>
          <input
            :value="settings.volume"
            aria-label="Âm lượng"
            type="range"
            min="0"
            max="0.3"
            step="0.01"
            @input="settings.update({ volume: Number($event.target.value) })"
          />
        </label>
      </div>
      <button class="primary-button start-button" type="button" aria-label="Bắt đầu phiên nghỉ" @click="start">Bắt đầu</button>
      <p class="quiet-note">Không có mục tiêu nào cần đạt.</p>
    </section>
  </main>
</template>
