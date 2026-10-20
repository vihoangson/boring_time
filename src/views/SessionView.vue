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
const finishing = ref(false)
const exitProgress = ref(0)
let exitTimer
let exitInterval
let holdStartedAt = 0
let departureRecorded = false
let completing = false
const activities = { dot: DotActivity, count: CountActivity, lines: LinesActivity, paint: PaintActivity, typing: TypingActivity }
const activityComponent = computed(() => activities[session.activity] || DotActivity)
const formattedTime = computed(() => {
  const seconds = Math.ceil(session.remainingMs / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
})
useWakeLock(computed(() => session.active && !session.paused))

async function finishSession(completedNaturally = false) {
  if (completing) return
  completing = true
  finishing.value = true
  await stopAudio()
  session.finish(completedNaturally)
  router.replace('/landing')
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
  try {
    if (audioReady.value) await resumeAudio()
    else if (session.soundLayers.length) {
      await startAudio(session.soundLayers)
      audioReady.value = true
    }
  } catch (error) {
    console.warn('Âm thanh không thể tiếp tục trên trình duyệt này.', error)
  }
}
async function exitEarly() {
  cancelExitHold()
  if (session.paused) session.resume()
  await finishSession()
}

function recordDeparture() {
  if (departureRecorded) return
  departureRecorded = true
  session.recordLeave()
}

function onVisibility() {
  if (document.visibilityState === 'visible') {
    departureRecorded = false
    return
  }
  if (document.visibilityState === 'hidden' && session.active && !session.paused) {
    recordDeparture()
    pausedByVisibility.value = true
    pause()
  }
}
function beginExitHold(event) {
  if (holdStartedAt || !session.active) return
  if (event?.pointerId !== undefined) event.currentTarget.setPointerCapture?.(event.pointerId)
  holdStartedAt = Date.now()
  session.recordExitAttempt()
  exitProgress.value = 0
  exitInterval = window.setInterval(() => {
    exitProgress.value = Math.min(100, ((Date.now() - holdStartedAt) / 3000) * 100)
  }, 50)
  exitTimer = window.setTimeout(exitEarly, 3000)
}
function cancelExitHold() {
  if (!holdStartedAt) return
  holdStartedAt = 0
  exitProgress.value = 0
  window.clearTimeout(exitTimer)
  window.clearInterval(exitInterval)
}
function onKeyDown(event) {
  if (event.repeat) return
  if (event.code === 'Space') {
    if (event.target instanceof HTMLElement && event.target.closest('button, input, textarea, select')) return
    event.preventDefault()
    event.stopPropagation()
    if (session.paused) resume()
    else pause()
    return
  }
  if (event.key !== 'Escape') return
  event.preventDefault()
  beginExitHold()
}
function onKeyUp(event) {
  if (event.key === 'Escape') cancelExitHold()
}
function onWindowBlur() {
  if (session.active && document.visibilityState === 'visible') recordDeparture()
}
function onWindowFocus() {
  departureRecorded = false
}
function beforeUnload(event) {
  if (!session.active) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('blur', onWindowBlur)
  window.addEventListener('focus', onWindowFocus)
  window.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('beforeunload', beforeUnload)
  try {
    if (!session.paused) {
      await startAudio(session.soundLayers)
      audioReady.value = session.soundLayers.length > 0
    }
  } catch (error) {
    console.warn('Âm thanh không thể phát trên trình duyệt này.', error)
  }
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('blur', onWindowBlur)
  window.removeEventListener('focus', onWindowFocus)
  window.removeEventListener('keydown', onKeyDown, true)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('beforeunload', beforeUnload)
  window.clearTimeout(exitTimer)
  window.clearInterval(exitInterval)
})
</script>

<template>
  <main class="session-view" :class="[`activity-${session.activity}`, { 'is-finishing': finishing, 'breathing-view': session.phase === 'breathing' }]">
    <div v-if="session.phase === 'breathing'" class="activity-stage breathing-stage" aria-label="Hít thở chậm trong 30 giây">
      <span class="breathing-orb" />
    </div>
    <component :is="activityComponent" v-else />
    <time v-if="settings.showTimer" class="session-timer" aria-live="off">{{ formattedTime }}</time>
    <button
      class="exit-button"
      type="button"
      aria-label="Giữ nút 3 giây để kết thúc phiên"
      title="Giữ 3 giây để kết thúc"
      @pointerdown="beginExitHold"
      @pointerup="cancelExitHold"
      @pointercancel="cancelExitHold"
      @keydown.space.prevent="beginExitHold"
      @keyup.space.prevent="cancelExitHold"
      @blur="cancelExitHold"
    >
      <span class="exit-progress" :style="{ '--hold-progress': `${exitProgress}%` }" aria-hidden="true" />
      <span>Thoát</span>
    </button>
    <p v-if="session.phase === 'breathing'" class="session-footnote">Hãy hít thở thật tự nhiên</p>
    <section v-if="session.paused" class="pause-message" role="status">
      <p>{{ pausedByVisibility ? 'Phiên đã tạm dừng khi bạn rời khỏi trang.' : 'Phiên đang tạm dừng.' }}</p>
      <button class="quiet-button" type="button" @click="resume">Tiếp tục khi bạn sẵn sàng</button>
    </section>
    <p v-if="session.phase !== 'breathing'" class="session-footnote">Giữ Esc hoặc nút Thoát trong 3 giây để kết thúc</p>
  </main>
</template>
