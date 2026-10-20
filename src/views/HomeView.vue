<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/ui/AppHeader.vue'
import { useSettingsStore } from '../stores/settings'
import { useSessionStore } from '../stores/session'
import EmotionPicker from '../components/ui/EmotionPicker.vue'
import ScalePicker from '../components/ui/ScalePicker.vue'
import { useSessionsStore } from '../stores/sessions'
import SoundMixer from '../components/ui/SoundMixer.vue'

const settings = useSettingsStore()
const session = useSessionStore()
const sessions = useSessionsStore()
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
]
const nextTask = ref('')
const emotionBefore = ref(null)
const focusBefore = ref(null)
const durationOptions = computed(() => [...new Set([...durations, settings.duration])].sort((a, b) => a - b))
const increaseSuggestion = computed(() => {
  if (!settings.suggestDurationIncrease || settings.duration >= 22) return null
  const latest = [...sessions.items]
    .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
    .slice(0, 3)
  return latest.length === 3 && latest.every((item) => item.completed && item.plannedDuration === settings.duration)
    ? settings.duration + 2
    : null
})

function chooseForMe() {
  const activity = activities[Math.floor(Math.random() * activities.length)]
  const sound = [...sounds, { id: 'silence', name: 'Im lặng' }][Math.floor(Math.random() * (sounds.length + 1))]
  settings.update({
    activity: activity.id,
    silentAudio: sound.id === 'silence',
    sound: sound.id,
    soundLayers: sound.id === 'silence'
      ? settings.soundLayers
      : [{ type: sound.id, volume: 0.08 }],
  })
}

function start() {
  session.start(settings.$state, {
    nextTask: nextTask.value.trim(),
    emotionBefore: emotionBefore.value,
    focusBefore: focusBefore.value,
  })
  router.push('/session')
}

function onShortcut(event) {
  if (event.code !== 'Space' || event.repeat) return
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, button, summary, [contenteditable="true"]')) return
  event.preventDefault()
  start()
}

onMounted(() => window.addEventListener('keydown', onShortcut))
onUnmounted(() => window.removeEventListener('keydown', onShortcut))
</script>

<template>
  <main class="page">
    <AppHeader />
    <section class="home-content">
      <p class="eyebrow">Một khoảng lặng có chủ đích</p>
      <h1>Không cần làm gì cả.</h1>
      <p class="intro-copy">Hãy để tâm trí nghỉ ngơi một chút trước khi tiếp tục.</p>
      <RouterLink class="secondary-button home-breathing-link" to="/breathing">Tập thở · 3 phút</RouterLink>

      <div class="setup-section next-task-section">
        <label class="field-label" for="next-task">Việc tiếp theo bạn định làm? <span>Không bắt buộc</span></label>
        <input id="next-task" v-model="nextTask" class="text-input" type="text" maxlength="120" autocomplete="off" />
      </div>

      <details class="optional-check-in">
        <summary>Ghi nhận cảm xúc trước phiên <span>(có thể bỏ qua)</span></summary>
        <div class="pre-session-reflection">
          <EmotionPicker v-model="emotionBefore" label="Bạn đang cảm thấy thế nào?" />
          <ScalePicker v-model="focusBefore" label="Mức tập trung hiện tại" name="focus-before" />
        </div>
      </details>

      <div class="setup-section">
        <h2>Thời lượng</h2>
        <div class="choice-row duration-row" aria-label="Chọn thời lượng">
          <button
            v-for="duration in durationOptions"
            :key="duration"
            class="choice"
            :class="{ selected: settings.duration === duration }"
            type="button"
            :aria-pressed="settings.duration === duration"
            @click="settings.update({ duration })"
          >{{ duration }} <span>phút</span></button>
        </div>
        <p v-if="increaseSuggestion" class="duration-suggestion" role="status">
          Bạn đã hoàn thành ba phiên ở {{ settings.duration }} phút. Nếu thấy phù hợp, có thể thử {{ increaseSuggestion }} phút.
          <button type="button" @click="settings.update({ duration: increaseSuggestion })">Chọn {{ increaseSuggestion }} phút</button>
        </p>
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

      <div class="setup-section"><SoundMixer /></div>
      <button class="quiet-button choose-random" type="button" aria-label="Chọn ngẫu nhiên hoạt động và âm thanh" @click="chooseForMe">Chọn giúp tôi</button>
      <button class="primary-button start-button" type="button" aria-label="Bắt đầu phiên nghỉ" @click="start">Bắt đầu</button>
      <p class="quiet-note">Không có mục tiêu nào cần đạt.</p>
    </section>
  </main>
</template>
