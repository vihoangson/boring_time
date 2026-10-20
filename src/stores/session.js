import { defineStore } from 'pinia'

export const useSessionStore = defineStore('active-session', {
  state: () => ({
    active: false,
    startedAt: 0,
    deadline: 0,
    remainingMs: 0,
    paused: false,
    pausedAt: 0,
    duration: 10,
    activity: 'dot',
    sound: 'brown',
    volume: 0.12,
    endedAt: '',
    elapsedSeconds: 0,
  }),
  actions: {
    start(config) {
      this.duration = config.duration
      this.activity = config.activity
      this.sound = config.sound
      this.volume = config.volume
      this.startedAt = Date.now()
      this.deadline = this.startedAt + config.duration * 60_000
      this.remainingMs = config.duration * 60_000
      this.paused = false
      this.pausedAt = 0
      this.active = true
      this.endedAt = ''
      this.elapsedSeconds = 0
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
      this.elapsedSeconds = Math.max(0, Math.round(this.duration * 60 - this.remainingMs / 1000))
      this.endedAt = new Date().toISOString()
      this.active = false
      this.paused = false
    },
    reset() {
      this.active = false
      this.paused = false
      this.remainingMs = 0
    },
  },
})
