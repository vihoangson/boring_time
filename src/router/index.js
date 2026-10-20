import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SessionView from '../views/SessionView.vue'
import FinishView from '../views/FinishView.vue'
import HistoryView from '../views/HistoryView.vue'
import SettingsView from '../views/SettingsView.vue'
import LandingView from '../views/LandingView.vue'
import PomodoroView from '../views/PomodoroView.vue'
import { useSessionStore } from '../stores/session'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/session', name: 'session', component: SessionView, meta: { fullscreen: true } },
    { path: '/landing', name: 'landing', component: LandingView, meta: { fullscreen: true } },
    { path: '/finish', name: 'finish', component: FinishView },
    { path: '/focus', name: 'focus', component: PomodoroView, meta: { fullscreen: true } },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

router.beforeEach((to) => {
  const session = useSessionStore()
  if (to.name === 'session' && !session.active) return { name: 'home' }
  if (['landing', 'finish'].includes(to.name) && !session.endedAt) return { name: 'home' }
  if (session.active && to.name !== 'session') return { name: 'session' }
})

export default router
