import { defineStore } from 'pinia'
import { useSessionsStore } from './sessions'
import { useSettingsStore } from './settings'

export const useBreathingStore = defineStore('breathing', {
  state: () => ({ selectedPattern: 'gentle', active: false }),
  actions: {
    selectPattern(patternId) {
      this.selectedPattern = patternId
    },
    acknowledgeHealthNotice() {
      useSettingsStore().update({ breathingNoticeAcknowledged: true })
    },
    saveSession(session) {
      useSessionsStore().add(session)
    },
    setActive(value) {
      this.active = value
    },
  },
})
