import { onUnmounted } from 'vue'

export async function playGentleBell() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return

  const context = new AudioContextClass()
  try {
    await context.resume()
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    const startAt = context.currentTime
    oscillator.type = 'sine'
    oscillator.frequency.value = 523.25
    envelope.gain.setValueAtTime(0.0001, startAt)
    envelope.gain.linearRampToValueAtTime(0.018, startAt + 0.18)
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.25)
    oscillator.connect(envelope)
    envelope.connect(context.destination)
    oscillator.start(startAt)
    oscillator.stop(startAt + 1.3)
    window.setTimeout(() => context.close(), 1500)
  } catch (error) {
    await context.close()
    throw error
  }
}

export function useAudio() {
  let context
  let master
  const sources = []
  const tickTimers = new Map()
  let tickLayers = []
  let restartTicks = () => {}
  let stopped = false

  async function start(selection, fallbackVolume = 0.12) {
    const layers = Array.isArray(selection)
      ? selection.slice(0, 3)
      : selection === 'silence' ? [] : [{ type: selection, volume: fallbackVolume }]
    if (!layers.length) return
    if (layers.some((layer) => !['brown', 'white', 'rain', 'tick'].includes(layer.type))) {
      throw new Error('Âm thanh không được hỗ trợ.')
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    context = new AudioContextClass()
    await context.resume()
    master = context.createGain()
    master.gain.setValueAtTime(0, context.currentTime)
    master.gain.linearRampToValueAtTime(1, context.currentTime + 2.5)
    master.connect(context.destination)

    function playTick(layer) {
      if (!context || stopped) return
      const gain = context.createGain()
      gain.gain.value = Math.min(0.3, Math.max(0, layer.volume))
      gain.connect(master)
      const oscillator = context.createOscillator()
      const envelope = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = 180
      envelope.gain.setValueAtTime(0.0001, context.currentTime)
      envelope.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.015)
      envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11)
      oscillator.connect(envelope)
      envelope.connect(gain)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.12)
      window.setTimeout(() => gain.disconnect(), 150)
    }

    function scheduleTicks(immediate = true) {
      tickLayers.forEach((layer, index) => {
        if (immediate) playTick(layer)
        tickTimers.set(index, window.setInterval(() => playTick(layer), 2000))
      })
    }

    layers.forEach((layer) => {
      const layerGain = context.createGain()
      layerGain.gain.value = Math.min(0.3, Math.max(0, layer.volume))
      layerGain.connect(master)

      if (layer.type === 'tick') {
        tickLayers.push(layer)
        return
      }

      const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate)
      const channel = buffer.getChannelData(0)
      let brown = 0
      for (let i = 0; i < channel.length; i += 1) {
        const white = Math.random() * 2 - 1
        if (layer.type === 'brown') {
          brown = (brown + 0.02 * white) / 1.02
          channel[i] = brown * 3.5
        } else {
          channel[i] = white
        }
      }
      const source = context.createBufferSource()
      source.buffer = buffer
      source.loop = true
      if (layer.type === 'rain') {
        const filter = context.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 1100
        source.connect(filter)
        filter.connect(layerGain)
      } else {
        source.connect(layerGain)
      }
      source.start()
      sources.push(source)
      sources.push(layerGain)
    })

    scheduleTicks()
    restartTicks = () => scheduleTicks(false)
  }

  async function stop() {
    if (!context || stopped) return
    stopped = true
    tickTimers.forEach((timer) => window.clearInterval(timer))
    tickTimers.clear()
    const now = context.currentTime
    master?.gain.cancelScheduledValues(now)
    master?.gain.setValueAtTime(master.gain.value, now)
    master?.gain.linearRampToValueAtTime(0, now + 1.5)
    await new Promise((resolve) => window.setTimeout(resolve, 1600))
    sources.forEach((source) => {
      if (typeof source.stop === 'function') source.stop()
      else source.disconnect()
    })
    await context.close()
  }

  async function pause() {
    if (context && context.state === 'running') {
      tickTimers.forEach((timer) => window.clearInterval(timer))
      tickTimers.clear()
      await context.suspend()
    }
  }

  async function resume() {
    if (context && context.state === 'suspended') {
      await context.resume()
      restartTicks()
    }
  }

  onUnmounted(() => {
    if (context && !stopped) {
      tickTimers.forEach((timer) => window.clearInterval(timer))
      sources.forEach((source) => {
        if (typeof source.stop === 'function') source.stop()
        else source.disconnect()
      })
      context.close().catch((error) => console.warn('Không thể đóng AudioContext.', error))
    }
  })

  return { start, stop, pause, resume }
}
