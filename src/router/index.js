import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SessionView from '../views/SessionView.vue'
import FinishView from '../views/FinishView.vue'
import HistoryView from '../views/HistoryView.vue'
import SettingsView from '../views/SettingsView.vue'
import LandingView from '../views/LandingView.vue'
import PomodoroView from '../views/PomodoroView.vue'
import ReportsView from '../views/ReportsView.vue'
import BreathingView from '../views/BreathingView.vue'
import ResetView from '../views/ResetView.vue'
import UrgeDelayView from '../views/UrgeDelayView.vue'
import { useSessionStore } from '../stores/session'
import { useBreathingStore } from '../stores/breathing'
import { useUrgesStore } from '../stores/urges'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/session', name: 'session', component: SessionView, meta: { fullscreen: true } },
    { path: '/landing', name: 'landing', component: LandingView, meta: { fullscreen: true } },
    { path: '/finish', name: 'finish', component: FinishView },
    { path: '/focus', name: 'focus', component: PomodoroView, meta: { fullscreen: true } },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/reports', name: 'reports', component: ReportsView },
    { path: '/breathing', name: 'breathing', component: BreathingView },
    { path: '/reset', name: 'reset', component: ResetView },
    { path: '/reset/delay', name: 'urge-delay', component: UrgeDelayView, meta: { fullscreen: true } },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

router.beforeEach((to) => {
  const session = useSessionStore()
  const breathing = useBreathingStore()
  const urges = useUrgesStore()
  if (to.name === 'session' && !session.active) return { name: 'home' }
  if (['landing', 'finish'].includes(to.name) && !session.endedAt) return { name: 'home' }
  if (session.active && to.name !== 'session') return { name: 'session' }
  if (breathing.active && to.name !== 'breathing') return { name: 'breathing' }
  if (urges.activeDelay && to.name !== 'urge-delay') return { name: 'urge-delay' }
  if (to.name === 'urge-delay' && !urges.activeDelay) return { name: 'reset' }
})

export default router
