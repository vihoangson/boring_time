import { defineStore } from 'pinia'
import { readData, writeData } from '../services/storage'
import { useSettingsStore } from './settings'

export const useSessionsStore = defineStore('sessions', {
  state: () => ({ items: readData().sessions }),
  actions: {
    persist() {
      writeData({ settings: useSettingsStore().$state, sessions: this.items })
    },
    add(session) {
      if (!useSettingsStore().saveData) return
      this.items.unshift(session)
      this.items = this.items.slice(0, 5000)
      this.persist()
    },
    replace(items) {
      this.items = items
      this.persist()
    },
    clear() {
      this.items = []
      this.persist()
    },
  },
})
