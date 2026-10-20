<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTimer } from '../composables/useTimer'
import { useAudio } from '../composables/useAudio'
import { useWakeLock } from '../composables/useWakeLock'
import { useSessionStore } from '../stores/session'
import { useSettingsStore } from '../stores/settings'
import DotActivity from '../components/activities/DotActivity.vue'
import CountActivity from '../components/activities/CountActivity.vue'
import LinesActivity from '../components/activities/LinesActivity.vue'
import PaintActivity from '../components/activities/PaintActivity.vue'
import TypingActivity from '../components/activities/TypingActivity.vue'

const session = useSessionStore()
const settings = useSettingsStore()
const router = useRouter()
const { start: startAudio, stop: stopAudio, pause: pauseAudio, resume: resumeAudio } = useAudio()
const pausedByVisibility = ref(false)
const audioReady = ref(false)
const escapeHeld = ref(false)
const escapeProgress = ref(false)
let escapeTimer
let completing = false
const activities = { dot: DotActivity, count: CountActivity, lines: LinesActivity, paint: PaintActivity, typing: TypingActivity }
const activityComponent = computed(() => activities[session.activity] || DotActivity)
const formattedTime = computed(() => {
  const seconds = Math.ceil(session.remainingMs / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
})
useWakeLock(computed(() => session.active && !session.paused))

async function finishSession() {
  if (completing) return
  completing = true
  await stopAudio()
  session.finish()
  router.replace('/finish')
}

useTimer(finishSession)

async function pause() {
  if (!session.paused) {
    session.pause()
    if (audioReady.value) await pauseAudio()
  }
}
async function resume() {
  session.resume()
  pausedByVisibility.value = false
  if (audioReady.value) await resumeAudio()
}
async function exitEarly() {
  if (session.paused) session.resume()
  await finishSession()
}

function onVisibility() {
  if (document.visibilityState === 'hidden' && session.active && !session.paused) {
    pausedByVisibility.value = true
    pause()
  }
}
function onKeyDown(event) {
  if (event.key !== 'Escape' || escapeHeld.value) return
  event.preventDefault()
  escapeHeld.value = true
  escapeProgress.value = false
  escapeTimer = window.setTimeout(() => {
    escapeProgress.value = true
    exitEarly()
  }, 2000)
}
function onKeyUp(event) {
  if (event.key !== 'Escape') return
  escapeHeld.value = false
  escapeProgress.value = false
  window.clearTimeout(escapeTimer)
}

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  try {
    await startAudio(session.sound, session.volume)
    audioReady.value = session.sound !== 'silence'
  } catch (error) {
    console.warn('Âm thanh không thể phát trên trình duyệt này.', error)
  }
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.clearTimeout(escapeTimer)
})
</script>

<template>
  <main class="session-view" :class="`activity-${session.activity}`">
    <component :is="activityComponent" />
    <time v-if="settings.showTimer" class="session-timer" aria-live="off">{{ formattedTime }}</time>
    <button class="exit-button" type="button" aria-label="Kết thúc phiên" @click="exitEarly">Thoát</button>
    <div v-if="escapeProgress" class="exit-hint" role="status">Đang kết thúc phiên…</div>
    <section v-if="session.paused" class="pause-message" role="status">
      <p>{{ pausedByVisibility ? 'Phiên đã tạm dừng khi bạn rời khỏi trang.' : 'Phiên đang tạm dừng.' }}</p>
      <button class="quiet-button" type="button" @click="resume">Tiếp tục khi bạn sẵn sàng</button>
    </section>
    <p class="session-footnote">Nhấn Esc giữ 2 giây để kết thúc</p>
  </main>
</template>
