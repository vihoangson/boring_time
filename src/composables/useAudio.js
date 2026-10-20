import { onUnmounted } from 'vue'

export function useAudio() {
  let context
  let master
  let source
  let tickTimer
  let stopped = false

  async function start(type, volume) {
    if (type === 'silence') return
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    context = new AudioContextClass()
    await context.resume()
    master = context.createGain()
    master.gain.setValueAtTime(0, context.currentTime)
    master.gain.linearRampToValueAtTime(volume, context.currentTime + 2.5)
    master.connect(context.destination)

    if (type === 'tick') {
      const tick = () => {
        if (!context || stopped) return
        const oscillator = context.createOscillator()
        const envelope = context.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.value = 180
        envelope.gain.setValueAtTime(0.0001, context.currentTime)
        envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.22), context.currentTime + 0.015)
        envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11)
        oscillator.connect(envelope)
        envelope.connect(context.destination)
        oscillator.start()
        oscillator.stop(context.currentTime + 0.12)
      }
      tick()
      tickTimer = window.setInterval(tick, 2000)
      return
    }

    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate)
    const channel = buffer.getChannelData(0)
    let brown = 0
    for (let i = 0; i < channel.length; i += 1) {
      const white = Math.random() * 2 - 1
      if (type === 'brown') {
        brown = (brown + 0.02 * white) / 1.02
        channel[i] = brown * 3.5
      } else {
        channel[i] = white
      }
    }
    source = context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    if (type === 'rain') {
      const filter = context.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1100
      source.connect(filter)
      filter.connect(master)
    } else {
      source.connect(master)
    }
    source.start()
  }

  async function stop() {
    if (!context || stopped) return
    stopped = true
    window.clearInterval(tickTimer)
    const now = context.currentTime
    master?.gain.cancelScheduledValues(now)
    master?.gain.setValueAtTime(master.gain.value, now)
    master?.gain.linearRampToValueAtTime(0, now + 1.5)
    await new Promise((resolve) => window.setTimeout(resolve, 1600))
    source?.stop()
    await context.close()
  }

  async function pause() {
    if (context && context.state === 'running') await context.suspend()
  }

  async function resume() {
    if (context && context.state === 'suspended') await context.resume()
  }

  onUnmounted(() => {
    if (context && !stopped) {
      window.clearInterval(tickTimer)
      source?.stop()
      context.close()
    }
  })

  return { start, stop, pause, resume }
}
