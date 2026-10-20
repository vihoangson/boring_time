<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/ui/AppHeader.vue'
import BreathVisual from '../components/breathing/BreathVisual.vue'
import AlternativeMenu from '../components/urge/AlternativeMenu.vue'
import { useAudio } from '../composables/useAudio'
import { useSessionStore } from '../stores/session'
import { useUrgesStore } from '../stores/urges'

const urges = useUrgesStore()
const session = useSessionStore()
const router = useRouter()
const now = ref(Date.now())
const showOutcome = ref(false)
const audioEnabled = ref(false)
const audioNotice = ref('')
const selectedOutcome = ref('')
const selectedDecision = ref('')
const { start: startAudio, stop: stopAudio } = useAudio()
let timer
const activeDelay = computed(() => urges.activeDelay)
const remainingMs = computed(() => activeDelay.value ? Math.max(0, activeDelay.value.deadline - now.value) : 0)
const remainingSeconds = computed(() => Math.ceil(remainingMs.value / 1000))
const formattedTime = computed(() => `${String(Math.floor(remainingSeconds.value / 60)).padStart(2, '0')}:${String(remainingSeconds.value % 60).padStart(2, '0')}`)
const phaseElapsed = computed(() => activeDelay.value ? Math.floor((now.value - new Date(activeDelay.value.createdAt).getTime()) / 1000) % 10 : 0)
const isInhale = computed(() => phaseElapsed.value < 4)
const phaseProgress = computed(() => isInhale.value ? phaseElapsed.value / 4 : (phaseElapsed.value - 4) / 6)
const matchingPlan = computed(() => urges.plans.find((plan) =>
  (!plan.habitId || plan.habitId === activeDelay.value?.habitId) &&
  (!plan.emotion || plan.emotion === activeDelay.value?.emotion),
))
const phaseName = computed(() => isInhale.value ? 'Hít vào' : 'Thở ra')

function updateTimer() {
  now.value = Date.now()
  urges.updateDelayRemaining()
  if (!remainingMs.value && activeDelay.value) showOutcome.value = true
}

async function toggleAmbient() {
  if (audioEnabled.value) {
    try {
      await stopAudio()
      audioEnabled.value = false
    } catch (error) {
      console.warn('Không thể tắt âm thanh nền.', error)
      audioNotice.value = 'Không thể tắt âm thanh nền tự động.'
    }
    return
  }
  try {
    await startAudio('brown', 0.05)
    audioEnabled.value = true
  } catch (error) {
    console.warn('Không thể phát âm thanh nền.', error)
    audioNotice.value = 'Âm thanh nền không khả dụng; bạn vẫn có thể tiếp tục trong yên lặng.'
  }
}

function saveOutcome() {
  if (!selectedOutcome.value || !selectedDecision.value) return
  const returnRoute = urges.returnRoute
  urges.finishDelay(selectedOutcome.value, selectedDecision.value)
  showOutcome.value = false
  returnFromDelay(returnRoute)
}

function exitEarly() {
  const returnRoute = urges.returnRoute
  urges.exitDelayEarly()
  showOutcome.value = false
  returnFromDelay(returnRoute)
}

function returnFromDelay(returnRoute) {
  if (session.active && returnRoute === '/session') session.resume()
  router.replace(returnRoute || { name: 'reset' })
}

onMounted(() => {
  if (!activeDelay.value) {
    router.replace({ name: 'reset' })
    return
  }
  updateTimer()
  timer = window.setInterval(updateTimer, 250)
})
onUnmounted(() => {
  window.clearInterval(timer)
  if (audioEnabled.value) stopAudio().catch((error) => console.warn('Không thể đóng âm thanh nền.', error))
})
</script>

<template>
  <main class="page delay-page">
    <AppHeader title="Khoảng trì hoãn" />
    <section class="standard-content delay-content">
      <p class="eyebrow">Không cần chống lại cảm giác</p>
      <template v-if="!showOutcome">
        <h1>Quan sát trong giây lát.</h1>
        <p class="intro-copy">Bạn muốn {{ activeDelay?.habitName }} khi cảm thấy {{ activeDelay?.emotion.toLowerCase() }}.</p>
        <div v-if="matchingPlan" class="matching-plan" role="status"><strong>Nếu</strong> {{ matchingPlan.situation }}, <strong>thì</strong> {{ matchingPlan.action }}</div>
        <BreathVisual :phase="isInhale ? 'inhale' : 'exhale'" :progress="phaseProgress" />
        <p class="breathing-phase" aria-live="off">{{ phaseName }}</p>
        <time class="delay-timer" aria-label="Thời gian trì hoãn còn lại">{{ formattedTime }}</time>
        <p class="muted-note">Hít vào nhẹ, rồi thở ra từ từ. Cơn muốn có thể đổi theo thời gian.</p>
        <div class="breathing-controls">
          <button class="secondary-button" type="button" :aria-pressed="audioEnabled" @click="toggleAmbient">{{ audioEnabled ? 'Tắt âm nền' : 'Âm nền nhẹ (tùy chọn)' }}</button>
          <button class="text-button" type="button" aria-label="Thoát khoảng trì hoãn sớm" @click="exitEarly">Dừng sớm</button>
        </div>
        <p v-if="audioNotice" class="muted-note" role="status">{{ audioNotice }}</p>
      </template>
      <template v-else>
        <h1>Bây giờ bạn thấy thế nào?</h1>
        <p class="intro-copy">Không có lựa chọn đúng hay sai.</p>
        <fieldset class="urge-choice-group">
          <legend>Cơn muốn</legend>
          <label v-for="outcome in ['Cơn muốn đã giảm', 'Vẫn muốn nhưng ổn', 'Vẫn muốn mạnh']" :key="outcome">
            <input v-model="selectedOutcome" type="radio" name="urge-outcome" :value="outcome" />
            <span>{{ outcome }}</span>
          </label>
        </fieldset>
        <fieldset class="urge-choice-group">
          <legend>Điều bạn muốn làm</legend>
          <label v-for="decision in ['Làm việc khác', 'Vẫn làm', 'Chưa biết']" :key="decision">
            <input v-model="selectedDecision" type="radio" name="urge-decision" :value="decision" />
            <span>{{ decision }}</span>
          </label>
        </fieldset>
        <div class="button-row delay-outcome-actions">
          <button class="primary-button" type="button" :disabled="!selectedOutcome || !selectedDecision" @click="saveOutcome">Lưu và tiếp tục</button>
          <button class="text-button" type="button" @click="exitEarly">Bỏ qua</button>
        </div>
        <AlternativeMenu compact />
      </template>
    </section>
  </main>
</template>
