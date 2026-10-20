export function useBreathingAudio() {
  let context
  let oscillator
  let master
  let stopped = false

  async function start(initialPhase = 'inhale') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return false

    context = new AudioContextClass()
    try {
      await context.resume()
      oscillator = context.createOscillator()
      master = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = initialPhase === 'inhale' ? 174 : 156
      master.gain.setValueAtTime(0.0001, context.currentTime)
      master.gain.linearRampToValueAtTime(0.018, context.currentTime + 1.2)
      oscillator.connect(master)
      master.connect(context.destination)
      oscillator.start()
      stopped = false
      return true
    } catch (error) {
      await context.close()
      context = null
      oscillator = null
      master = null
      throw error
    }
  }

  function setPhase(phase) {
    if (!context || !oscillator || stopped) return
    const frequency = phase === 'inhale' ? 174 : phase.startsWith('hold') ? 165 : 156
    oscillator.frequency.cancelScheduledValues(context.currentTime)
    oscillator.frequency.setTargetAtTime(frequency, context.currentTime, 0.35)
  }

  async function stop() {
    if (!context || stopped) return
    stopped = true
    const activeContext = context
    const activeOscillator = oscillator
    const activeMaster = master
    activeMaster.gain.cancelScheduledValues(activeContext.currentTime)
    activeMaster.gain.setTargetAtTime(0.0001, activeContext.currentTime, 0.3)
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    try {
      activeOscillator.stop()
    } catch (error) {
      if (error?.name !== 'InvalidStateError') throw error
    }
    await activeContext.close()
    context = null
    oscillator = null
    master = null
  }

  async function pause() {
    if (context?.state === 'running') await context.suspend()
  }

  async function resume() {
    if (context?.state === 'suspended') await context.resume()
  }

  return { start, setPhase, pause, resume, stop }
}
