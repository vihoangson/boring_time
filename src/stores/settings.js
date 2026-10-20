import { defineStore } from 'pinia'
import { readData, writeData } from '../services/storage'
import { useSessionsStore } from './sessions'

export const useSettingsStore = defineStore('settings', {
  state: () => ({ ...readData().settings }),
  actions: {
    persist() {
      const sessions = useSessionsStore()
      writeData({ settings: this.$state, sessions: sessions.items })
    },
    update(values) {
      Object.assign(this, values)
      this.persist()
    },
  },
})
