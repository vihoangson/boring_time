import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SessionView from '../views/SessionView.vue'
import FinishView from '../views/FinishView.vue'
import HistoryView from '../views/HistoryView.vue'
import SettingsView from '../views/SettingsView.vue'
import { useSessionStore } from '../stores/session'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/session', name: 'session', component: SessionView, meta: { fullscreen: true } },
    { path: '/finish', name: 'finish', component: FinishView },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

router.beforeEach((to) => {
  const session = useSessionStore()
  if (to.name === 'session' && !session.active) return { name: 'home' }
  if (session.active && to.name !== 'session' && to.name !== 'finish') return { name: 'session' }
})

export default router
