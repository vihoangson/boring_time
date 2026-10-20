<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/ui/AppHeader.vue'
import EmotionPicker from '../components/ui/EmotionPicker.vue'
import ScalePicker from '../components/ui/ScalePicker.vue'
import { useSessionStore } from '../stores/session'
import { useSessionsStore } from '../stores/sessions'
import { useSettingsStore } from '../stores/settings'

const session = useSessionStore()
const sessions = useSessionsStore()
const settings = useSettingsStore()
const router = useRouter()
const emotionAfter = ref(null)
const focusAfter = ref(null)
const note = ref('')
const saved = ref(false)
const durationMinutes = computed(() => Math.max(1, Math.round(session.elapsedSeconds / 60)))
const leaveTotal = computed(() => session.leaveCount + session.exitAttempts)

function save() {
  if (saved.value) return
  sessions.add({
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    endedAt: session.endedAt || new Date().toISOString(),
    duration: durationMinutes.value,
    plannedDuration: session.duration,
    completed: session.completedNaturally,
    activity: session.activity,
    sound: session.sound,
    emotionBefore: session.emotionBefore,
    emotionAfter: emotionAfter.value,
    focusBefore: session.focusBefore,
    focusAfter: focusAfter.value,
    exitAttempts: session.exitAttempts,
    leaveCount: session.leaveCount,
    note: note.value.trim(),
    nextTask: session.nextTask,
  })
  saved.value = true
  session.reset()
}
function done() {
  if (!saved.value) save()
  router.push('/')
}

function startFocus() {
  if (!saved.value) save()
  router.push('/focus')
}

function onScoreShortcut(event) {
  if (!/^[1-5]$/.test(event.key)) return
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return
  focusAfter.value = Number(event.key)
}
onMounted(() => window.addEventListener('keydown', onScoreShortcut))
onUnmounted(() => window.removeEventListener('keydown', onScoreShortcut))
</script>

<template>
  <main class="page finish-page">
    <AppHeader title="Khoảng lặng" />
    <section class="finish-content">
      <p class="eyebrow">Phiên đã khép lại</p>
      <h1>Chọn một việc để làm tiếp.</h1>
      <p v-if="session.nextTask" class="next-task-reminder">{{ session.nextTask }}</p>
      <p class="intro-copy">Không cần vội vàng. Hãy chọn một điều vừa sức.</p>
      <p class="before-session-summary">
        Trước phiên: {{ session.emotionBefore || 'chưa ghi nhận' }} · tập trung {{ session.focusBefore ?? '—' }}/5
      </p>
      <p class="leave-summary">Bạn có {{ leaveTotal }} lần muốn rời đi.</p>
      <div class="reflection">
        <EmotionPicker v-model="emotionAfter" label="Cảm xúc hiện tại" />
        <ScalePicker v-model="focusAfter" label="Mức tập trung hiện tại" name="focus-after" />
      </div>
      <label class="journal-field" for="session-note">
        Điều gì xuất hiện trong đầu bạn? <span>(có thể bỏ qua)</span>
        <textarea id="session-note" v-model="note" maxlength="500" rows="3" />
      </label>
      <p v-if="!settings.saveData" class="muted-note">Bạn đã tắt lưu dữ liệu. Phiên này sẽ không được ghi lại.</p>
      <div class="finish-actions">
        <button class="primary-button" type="button" @click="save()">Lưu và hoàn tất</button>
        <button class="quiet-button" type="button" @click="done">Bỏ qua</button>
      </div>
      <p v-if="saved" class="quiet-note" role="status">Đã hoàn tất.</p>
      <button class="focus-start-button" type="button" aria-label="Bắt đầu 25 phút tập trung" @click="startFocus">Bắt đầu 25 phút tập trung</button>
    </section>
  </main>
</template>
