import { defineStore } from 'pinia'

export const useSessionStore = defineStore('active-session', {
  state: () => ({
    active: false,
    startedAt: 0,
    deadline: 0,
    remainingMs: 0,
    paused: false,
    pausedAt: 0,
    phase: 'activity',
    duration: 10,
    activity: 'dot',
    sound: 'brown',
    volume: 0.12,
    nextTask: '',
    emotionBefore: null,
    focusBefore: null,
    emotionAfter: null,
    focusAfter: null,
    exitAttempts: 0,
    leaveCount: 0,
    note: '',
    endedAt: '',
    elapsedSeconds: 0,
  }),
  actions: {
    start(config, reflection = {}) {
      this.duration = config.duration
      this.activity = config.activity
      this.sound = config.sound
      this.volume = config.volume
      this.nextTask = reflection.nextTask || ''
      this.emotionBefore = reflection.emotionBefore || null
      this.focusBefore = reflection.focusBefore || null
      this.emotionAfter = null
      this.focusAfter = null
      this.exitAttempts = 0
      this.leaveCount = 0
      this.note = ''
      this.phase = config.openingBreath ? 'breathing' : 'activity'
      this.startedAt = this.phase === 'activity' ? Date.now() : 0
      this.deadline = Date.now() + (this.phase === 'breathing' ? 30_000 : config.duration * 60_000)
      this.remainingMs = this.phase === 'breathing' ? 30_000 : config.duration * 60_000
      this.paused = false
      this.pausedAt = 0
      this.active = true
      this.endedAt = ''
      this.elapsedSeconds = 0
    },
    beginActivity() {
      this.phase = 'activity'
      this.startedAt = Date.now()
      this.deadline = this.startedAt + this.duration * 60_000
      this.remainingMs = this.duration * 60_000
    },
    recordLeave() {
      if (this.active) this.leaveCount += 1
    },
    recordExitAttempt() {
      if (this.active) this.exitAttempts += 1
    },
    pause() {
      if (!this.active || this.paused) return
      this.remainingMs = Math.max(0, this.deadline - Date.now())
      this.paused = true
      this.pausedAt = Date.now()
    },
    resume() {
      if (!this.active || !this.paused) return
      this.deadline = Date.now() + this.remainingMs
      this.paused = false
      this.pausedAt = 0
    },
    updateRemaining() {
      if (this.active && !this.paused) this.remainingMs = Math.max(0, this.deadline - Date.now())
    },
    finish() {
      this.updateRemaining()
      this.elapsedSeconds = this.phase === 'activity'
        ? Math.max(0, Math.round(this.duration * 60 - this.remainingMs / 1000))
        : 0
      this.endedAt = new Date().toISOString()
      this.active = false
      this.paused = false
      this.phase = 'landing'
    },
    reset() {
      this.active = false
      this.paused = false
      this.remainingMs = 0
    },
  },
})
