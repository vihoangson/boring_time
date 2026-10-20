<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useBreathingAudio } from '../composables/useBreathingAudio'
import { useBreathingEngine } from '../composables/useBreathingEngine'
import { useWakeLock } from '../composables/useWakeLock'
import { getBreathingPattern, getBreathingRhythm, BREATHING_PATTERNS } from '../data/breathingPatterns'
import { useBreathingStore } from '../stores/breathing'
import { useSettingsStore } from '../stores/settings'
import AppHeader from '../components/ui/AppHeader.vue'
import BreathVisual from '../components/breathing/BreathVisual.vue'

const breathing = useBreathingStore()
const settings = useSettingsStore()
const engine = useBreathingEngine()
const audio = useBreathingAudio()
const choosingPattern = ref(false)
const showSummary = ref(false)
const hiddenPause = ref(false)
const audioNotice = ref('')
const summary = ref({ completed: false, elapsedSeconds: 0, cyclesCompleted: 0 })
const pattern = computed(() => getBreathingPattern(breathing.selectedPattern))
const nextPattern = computed(() => ({
  gentle: getBreathingPattern('coherent'),
  coherent: getBreathingPattern('gentle'),
  box: getBreathingPattern('gentle'),
}[pattern.value.id]))
const phaseMessage = computed(() => `${engine.isIntro.value ? 'Làm quen · ' : ''}${engine.phase.value.label}`)
const active = computed(() => engine.running.value && !engine.paused.value)

useWakeLock(active)

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `breath-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function saveResult(result) {
  breathing.setActive(false)
  const elapsedMinutes = Math.round((result.elapsedSeconds / 60) * 10) / 10
  breathing.saveSession({
    id: makeId(),
    endedAt: new Date().toISOString(),
    duration: elapsedMinutes,
    plannedDuration: 3,
    completed: result.completed,
    kind: 'breathing',
    activity: pattern.value.id,
    sound: 'breath-tone',
    breathingPattern: pattern.value.id,
    breathingRhythm: getBreathingRhythm(pattern.value),
    cyclesCompleted: result.cyclesCompleted,
    elapsedSeconds: result.elapsedSeconds,
    emotionBefore: null,
    emotionAfter: null,
    focusBefore: null,
    focusAfter: null,
    exitAttempts: 0,
    leaveCount: 0,
    note: '',
    nextTask: '',
  })
  summary.value = result
  showSummary.value = true
  hiddenPause.value = false
  try {
    await audio.stop()
  } catch (error) {
    console.warn('Không thể kết thúc âm thanh hướng dẫn thở.', error)
    audioNotice.value = 'Âm thanh hướng dẫn không thể kết thúc tự động.'
  }
}

async function startBreathing() {
  if (engine.running.value) return
  showSummary.value = false
  hiddenPause.value = false
  audioNotice.value = ''
  try {
    const audioAvailable = await audio.start('inhale')
    if (!audioAvailable) audioNotice.value = 'Âm thanh không khả dụng trên trình duyệt này; bạn vẫn có thể thở theo vòng hướng dẫn.'
  } catch (error) {
    console.warn('Âm thanh hướng dẫn thở không khả dụng.', error)
    audioNotice.value = 'Không thể phát âm thanh hướng dẫn; bạn vẫn có thể tiếp tục bằng vòng thở.'
  }
  breathing.setActive(true)
  engine.start(pattern.value, 180, (phase) => audio.setPhase(phase), saveResult)
}

async function pauseBreathing(fromVisibility = false) {
  if (!engine.running.value || engine.paused.value) return
  engine.pause()
  if (fromVisibility) hiddenPause.value = true
  try {
    await audio.pause()
  } catch (error) {
    console.warn('Không thể tạm dừng âm thanh hướng dẫn thở.', error)
  }
}

async function resumeBreathing() {
  if (!engine.running.value || !engine.paused.value) return
  try {
    await audio.resume()
  } catch (error) {
    console.warn('Không thể tiếp tục âm thanh hướng dẫn thở.', error)
    audioNotice.value = 'Âm thanh chưa tiếp tục được; bạn có thể thở theo vòng hướng dẫn.'
  }
  hiddenPause.value = false
  engine.resume()
}

function finishBreathing() {
  engine.stop()
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') pauseBreathing(true)
}

function choosePattern(patternId) {
  breathing.selectPattern(patternId)
  choosingPattern.value = false
  showSummary.value = false
}

function acknowledgeNotice() {
  breathing.acknowledgeHealthNotice()
}

onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (engine.running.value) {
    breathing.setActive(false)
    audio.stop().catch((error) => console.warn('Không thể đóng âm thanh hướng dẫn thở.', error))
  }
})
</script>

<template>
  <main class="page breathing-page">
    <AppHeader title="Tập thở" />
    <section class="standard-content breathing-content">
      <p class="eyebrow">Một nhịp chậm, theo cách của bạn</p>
      <h1>Tập thở</h1>

      <aside v-if="!settings.breathingNoticeAcknowledged" class="breathing-health-note" aria-label="Lưu ý sức khỏe">
        <p>Thở nhẹ nhàng, không gắng sức. Nếu thấy chóng mặt, choáng hoặc khó chịu, hãy quay lại thở bình thường. Đây là bài tập thư giãn, không thay thế tư vấn y tế.</p>
        <button class="text-button" type="button" @click="acknowledgeNotice">Đã hiểu</button>
      </aside>

      <p v-if="!engine.running.value && !showSummary" class="breathing-intro-copy">
        {{ pattern.description }} · {{ pattern.recommendation }}
      </p>
      <p v-if="!engine.running.value && !showSummary" class="breathing-rhythm">
        {{ pattern.phases.map((item) => `${item.label} ${item.seconds} giây`).join(' · ') }}
      </p>
      <p v-if="pattern.phases.some((item) => item.id.startsWith('hold')) && !engine.running.value" class="muted-note">
        Có thể bỏ qua pha giữ hơi bất cứ lúc nào.
      </p>

      <div v-if="engine.running.value" class="breathing-session" :class="{ 'breathing-paused': engine.paused.value }">
        <p v-if="engine.isIntro.value" class="breathing-guidance">
          Ngồi thoải mái. Hít bằng mũi, thở ra từ từ.
        </p>
        <BreathVisual
          :phase="engine.phase.value.id"
          :phase-seconds="engine.phase.value.seconds"
          :progress="engine.progress.value"
          :is-intro="engine.isIntro.value"
        />
        <p class="breathing-phase" aria-live="polite" aria-atomic="true">{{ phaseMessage }}</p>
        <p class="muted-note">{{ engine.isIntro.value ? 'Làm quen trong giây lát' : 'Hãy để nhịp thở tự nhiên' }}</p>
        <p v-if="audioNotice" class="muted-note" role="status">{{ audioNotice }}</p>
        <p v-if="hiddenPause" class="breathing-pause-note" role="status">Buổi thở đã tạm dừng khi bạn rời trang.</p>
        <div class="breathing-controls">
          <button v-if="engine.paused.value" class="primary-button" type="button" aria-label="Tiếp tục buổi thở" @click="resumeBreathing">Tiếp tục</button>
          <button v-else class="secondary-button" type="button" aria-label="Tạm dừng buổi thở" @click="pauseBreathing()">Tạm dừng</button>
          <button class="text-button" type="button" aria-label="Kết thúc buổi thở" @click="finishBreathing">Kết thúc</button>
        </div>
      </div>

      <section v-else-if="showSummary" class="breathing-summary" role="status">
        <BreathVisual phase="exhale" :phase-seconds="6" :progress="0" />
        <h2>{{ summary.completed ? 'Buổi thở đã kết thúc.' : 'Bạn đã dừng lại.' }}</h2>
        <p>{{ summary.cyclesCompleted }} nhịp hoàn thành · {{ Math.round(summary.elapsedSeconds / 60 * 10) / 10 }} phút</p>
        <p v-if="audioNotice" role="status">{{ audioNotice }}</p>
        <p>Bài tiếp theo có thể là <strong>{{ nextPattern.name }}</strong>.</p>
        <div class="breathing-controls">
          <button class="secondary-button" type="button" @click="choosePattern(nextPattern.id)">Chọn bài này</button>
          <button class="primary-button" type="button" @click="showSummary = false">Xong</button>
        </div>
      </section>

      <template v-else>
        <BreathVisual phase="inhale" :phase-seconds="4" :progress="0" />
        <button class="primary-button breathing-start" type="button" aria-label="Bắt đầu thở nhẹ nhàng trong ba phút" @click="startBreathing">
          Bắt đầu thở
        </button>
        <button class="text-button breathing-choose" type="button" :aria-expanded="choosingPattern" @click="choosingPattern = !choosingPattern">
          {{ choosingPattern ? 'Ẩn lựa chọn' : 'Chọn bài thở khác' }}
        </button>
        <div v-if="choosingPattern" class="breathing-pattern-list" role="group" aria-label="Chọn bài thở">
          <button
            v-for="item in BREATHING_PATTERNS"
            :key="item.id"
            class="breathing-pattern-option"
            :class="{ selected: item.id === pattern.id }"
            type="button"
            :aria-pressed="item.id === pattern.id"
            @click="choosePattern(item.id)"
          >
            <span>{{ item.name }}</span>
            <small>{{ item.recommendation }} · {{ item.description }}</small>
          </button>
        </div>
        <p v-if="audioNotice" class="muted-note" role="status">{{ audioNotice }}</p>
        <p class="quiet-note">Buổi mặc định kéo dài 3 phút. Bạn có thể dừng bất cứ lúc nào.</p>
      </template>
    </section>
  </main>
</template>
