import { defineStore } from 'pinia'
import { readData, writeData } from '../services/storage'
import { useSettingsStore } from './settings'

function createId(prefix) {
  return globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useUrgesStore = defineStore('urges', {
  state: () => {
    const reset = readData().reset
    return { ...reset, activeDelay: reset.activeDelay || null, delayRemainingMs: 0 }
  },
  getters: {
    currentWeekCount: (state) => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
      return state.urgeEntries.filter((entry) => new Date(entry.createdAt) >= start).length
    },
  },
  actions: {
    persist() {
      const data = readData()
      const reset = {
        ...this.$state,
        activeDelay: useSettingsStore().saveData ? this.activeDelay : null,
      }
      writeData({ ...data, reset })
    },
    addHabit(name, impact) {
      const cleanName = name.trim()
      if (!cleanName || this.habits.length >= 100) return false
      this.habits.push({ id: createId('habit'), name: cleanName.slice(0, 80), impact, custom: true })
      this.persist()
      return true
    },
    updateHabit(id, values) {
      const habit = this.habits.find((item) => item.id === id)
      if (!habit) return
      if (typeof values.name === 'string' && values.name.trim()) habit.name = values.name.trim().slice(0, 80)
      if (Number.isInteger(values.impact) && values.impact >= 1 && values.impact <= 5) habit.impact = values.impact
      this.persist()
    },
    removeHabit(id) {
      this.habits = this.habits.filter((item) => item.id !== id)
      this.plans = this.plans.map((plan) => plan.habitId === id ? { ...plan, habitId: null } : plan)
      this.persist()
    },
    addPlan(values) {
      if (this.plans.length >= 5 || !values.situation.trim() || !values.action.trim()) return false
      this.plans.push({
        id: createId('plan'),
        situation: values.situation.trim().slice(0, 120),
        action: values.action.trim().slice(0, 160),
        habitId: values.habitId || null,
        emotion: values.emotion || null,
      })
      this.persist()
      return true
    },
    removePlan(id) {
      this.plans = this.plans.filter((plan) => plan.id !== id)
      this.persist()
    },
    addAlternative(values) {
      if (!values.name.trim() || this.alternatives.length >= 100) return false
      this.alternatives.push({
        id: createId('alternative'),
        name: values.name.trim().slice(0, 80),
        minutes: values.minutes,
        energy: values.energy,
        custom: true,
      })
      this.persist()
      return true
    },
    updateAlternative(id, values) {
      const item = this.alternatives.find((activity) => activity.id === id)
      if (!item) return
      if (typeof values.name === 'string' && values.name.trim()) item.name = values.name.trim().slice(0, 80)
      if ([5, 15, 30].includes(values.minutes)) item.minutes = values.minutes
      if (['low', 'medium'].includes(values.energy)) item.energy = values.energy
      this.persist()
    },
    removeAlternative(id) {
      this.alternatives = this.alternatives.filter((item) => item.id !== id)
      this.persist()
    },
    completeAlternative(activityId, note = '') {
      const activity = this.alternatives.find((item) => item.id === activityId)
      if (!activity) return
      if (!useSettingsStore().saveData) return
      this.alternativeEntries.unshift({
        id: createId('alternative-log'),
        createdAt: new Date().toISOString(),
        activityId,
        activityName: activity.name,
        note: note.trim().slice(0, 500),
      })
      this.alternativeEntries = this.alternativeEntries.slice(0, 5000)
      this.persist()
    },
    setDelayMinutes(minutes) {
      if (![5, 10, 20].includes(minutes)) return
      this.delayMinutes = minutes
      this.persist()
    },
    setGradualDelay(enabled) {
      this.gradualDelay = Boolean(enabled)
      this.persist()
    },
    getSuggestedDelay() {
      if (!this.gradualDelay) return null
      const current = this.delayMinutes
      if (current === 5 && this.urgeEntries.length >= 3) return 10
      if (current === 10 && this.urgeEntries.length >= 6) return 20
      return null
    },
    beginUrge({ habitId, emotion, note = '' }) {
      const habit = this.habits.find((item) => item.id === habitId)
      if (!habit || !emotion) return false
      const entry = {
        id: createId('urge'),
        createdAt: new Date().toISOString(),
        habitId,
        habitName: habit.name,
        emotion,
        note: note.trim().slice(0, 500),
        delayMinutes: this.delayMinutes,
        outcome: null,
        decision: null,
        exitedEarly: false,
      }
      if (useSettingsStore().saveData) {
        this.urgeEntries.unshift(entry)
        this.urgeEntries = this.urgeEntries.slice(0, 5000)
      }
      this.activeDelay = { ...entry, deadline: Date.now() + this.delayMinutes * 60_000 }
      this.delayRemainingMs = this.delayMinutes * 60_000
      this.persist()
      return true
    },
    updateDelayRemaining() {
      if (this.activeDelay) this.delayRemainingMs = Math.max(0, this.activeDelay.deadline - Date.now())
    },
    finishDelay(outcome, decision) {
      this.updateDelayRemaining()
      const active = this.activeDelay
      if (!active) return
      const entry = this.urgeEntries.find((item) => item.id === active.id)
      if (entry) {
        entry.outcome = outcome
        entry.decision = decision
      }
      this.activeDelay = null
      this.delayRemainingMs = 0
      this.persist()
    },
    exitDelayEarly() {
      const active = this.activeDelay
      if (!active) return
      const entry = this.urgeEntries.find((item) => item.id === active.id)
      if (entry) entry.exitedEarly = true
      this.activeDelay = null
      this.delayRemainingMs = 0
      this.persist()
    },
    clearResetData() {
      const defaults = readData().reset
      this.$patch({
        habits: defaults.habits,
        urgeEntries: [],
        plans: [],
        alternatives: defaults.alternatives,
        alternativeEntries: [],
        delayMinutes: 10,
        gradualDelay: false,
        activeDelay: null,
        delayRemainingMs: 0,
      })
      this.persist()
    },
    loadResetData(reset) {
      this.$patch({
        ...reset,
        activeDelay: null,
        delayRemainingMs: 0,
      })
      this.persist()
    },
    clearInMemory() {
      const defaults = readData().reset
      this.$patch({
        ...defaults,
        activeDelay: null,
        delayRemainingMs: 0,
      })
    },
  },
})
