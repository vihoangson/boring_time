<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/ui/AppHeader.vue'
import ScalePicker from '../components/ui/ScalePicker.vue'
import { useSessionStore } from '../stores/session'
import { useSessionsStore } from '../stores/sessions'
import { useSettingsStore } from '../stores/settings'

const session = useSessionStore()
const sessions = useSessionsStore()
const settings = useSettingsStore()
const router = useRouter()
const mood = ref(null)
const focus = ref(null)
const saved = ref(false)
const durationMinutes = computed(() => Math.max(1, Math.round(session.elapsedSeconds / 60)))

function save(rated = true) {
  if (saved.value) return
  sessions.add({
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    endedAt: session.endedAt || new Date().toISOString(),
    duration: durationMinutes.value,
    activity: session.activity,
    sound: session.sound,
    mood: rated ? mood.value : null,
    focus: rated ? focus.value : null,
  })
  saved.value = true
  session.reset()
}
function done() {
  if (!saved.value) save(false)
  router.push('/')
}
</script>

<template>
  <main class="page finish-page">
    <AppHeader title="Khoảng lặng" />
    <section class="finish-content">
      <p class="eyebrow">Phiên đã khép lại</p>
      <h1>Chọn một việc để làm tiếp.</h1>
      <p class="intro-copy">Không cần vội vàng. Hãy chọn một điều vừa sức.</p>
      <div class="reflection">
        <ScalePicker v-model="mood" label="Cảm xúc hiện tại" name="mood" />
        <ScalePicker v-model="focus" label="Mức tập trung hiện tại" name="focus" />
      </div>
      <p v-if="!settings.saveData" class="muted-note">Bạn đã tắt lưu dữ liệu. Phiên này sẽ không được ghi lại.</p>
      <div class="finish-actions">
        <button class="primary-button" type="button" @click="save()">Lưu và hoàn tất</button>
        <button class="quiet-button" type="button" @click="done">Bỏ qua</button>
      </div>
      <p v-if="saved" class="quiet-note" role="status">Đã hoàn tất.</p>
    </section>
  </main>
</template>
