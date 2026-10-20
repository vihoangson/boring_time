import { onUnmounted, ref } from 'vue'

const INTRO_DURATION_MS = 20_000
const INTRO_PHASES = [
  { id: 'inhale', label: 'Hít vào', seconds: 4 },
  { id: 'exhale', label: 'Thở ra', seconds: 6 },
]

function phaseAt(phases, elapsedMs) {
  const cycleMs = phases.reduce((sum, phase) => sum + phase.seconds * 1000, 0)
  const cyclePosition = elapsedMs % cycleMs
  let phaseStart = 0
  for (const phase of phases) {
    const phaseDuration = phase.seconds * 1000
    if (cyclePosition < phaseStart + phaseDuration) {
      return {
        phase,
        progress: (cyclePosition - phaseStart) / phaseDuration,
        remainingSeconds: Math.max(1, Math.ceil((phaseStart + phaseDuration - cyclePosition) / 1000)),
      }
    }
    phaseStart += phaseDuration
  }
  return { phase: phases[0], progress: 0, remainingSeconds: phases[0].seconds }
}

export function useBreathingEngine() {
  const running = ref(false)
  const paused = ref(false)
  const finished = ref(false)
  const isIntro = ref(false)
  const phase = ref(INTRO_PHASES[0])
  const progress = ref(0)
  const remainingSeconds = ref(INTRO_PHASES[0].seconds)
  const elapsedSeconds = ref(0)
  const cyclesCompleted = ref(0)
  let timer
  let startedAt = 0
  let accumulatedMs = 0
  let durationSeconds = 180
  let pattern
  let lastNotifiedPhase = ''
  let onPhaseChange = () => {}
  let onFinish = () => {}

  function update(now = performance.now()) {
    if (!running.value || paused.value) return
    const elapsedMs = accumulatedMs + now - startedAt
    elapsedSeconds.value = Math.floor(elapsedMs / 1000)

    if (elapsedMs < INTRO_DURATION_MS) {
      isIntro.value = true
      const current = phaseAt(INTRO_PHASES, elapsedMs)
      phase.value = current.phase
      progress.value = current.progress
      remainingSeconds.value = current.remainingSeconds
      if (lastNotifiedPhase !== current.phase.id) {
        lastNotifiedPhase = current.phase.id
        onPhaseChange(current.phase.id)
      }
      return
    }

    isIntro.value = false
    const activeElapsedMs = elapsedMs - INTRO_DURATION_MS
    const activeElapsedSeconds = Math.min(durationSeconds, Math.floor(activeElapsedMs / 1000))
    const cycleLength = pattern.phases.reduce((sum, item) => sum + item.seconds, 0)
    cyclesCompleted.value = Math.floor(activeElapsedSeconds / cycleLength)

    if (activeElapsedMs >= durationSeconds * 1000) {
      finish(true, true)
      return
    }

    const current = phaseAt(pattern.phases, activeElapsedMs)
    phase.value = current.phase
    progress.value = current.progress
    remainingSeconds.value = current.remainingSeconds
    if (lastNotifiedPhase !== current.phase.id) {
      lastNotifiedPhase = current.phase.id
      onPhaseChange(current.phase.id)
    }
  }

  function finish(completed = false, alreadyUpdated = false) {
    if (!running.value) return
    if (!alreadyUpdated) update(performance.now())
    if (!running.value) return
    running.value = false
    paused.value = false
    finished.value = completed
    window.clearInterval(timer)
    onFinish({
      completed,
      elapsedSeconds: elapsedSeconds.value,
      cyclesCompleted: cyclesCompleted.value,
    })
  }

  function start(selectedPattern, selectedDuration = 180, phaseCallback = () => {}, finishCallback = () => {}) {
    if (running.value) return
    pattern = selectedPattern
    durationSeconds = selectedDuration
    onPhaseChange = phaseCallback
    onFinish = finishCallback
    startedAt = performance.now()
    accumulatedMs = 0
    elapsedSeconds.value = 0
    cyclesCompleted.value = 0
    finished.value = false
    paused.value = false
    running.value = true
    lastNotifiedPhase = ''
    update(startedAt)
    timer = window.setInterval(() => update(), 80)
  }

  function pause() {
    if (!running.value || paused.value) return
    const now = performance.now()
    update(now)
    accumulatedMs += now - startedAt
    paused.value = true
  }

  function resume() {
    if (!running.value || !paused.value) return
    startedAt = performance.now()
    paused.value = false
    update(startedAt)
  }

  function stop() {
    finish(false)
  }

  onUnmounted(() => window.clearInterval(timer))

  return {
    running,
    paused,
    finished,
    isIntro,
    phase,
    progress,
    remainingSeconds,
    elapsedSeconds,
    cyclesCompleted,
    start,
    pause,
    resume,
    stop,
  }
}
