<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from './stores/settings'
import { usePwaUpdates } from './composables/usePwaUpdates'
import { useReminders } from './composables/useReminders'
import UrgeQuickCard from './components/urge/UrgeQuickCard.vue'
import UrgeDelayView from './views/UrgeDelayView.vue'
import { useUrgesStore } from './stores/urges'

const settings = useSettingsStore()
const urges = useUrgesStore()
const route = useRoute()
const quickCardOpen = ref(false)
const urgeButton = ref(null)
const showUrgeShortcut = computed(() => !urges.activeDelay)
const { updateAvailable, applyUpdate } = usePwaUpdates()
const { inAppReminder } = useReminders()

watch(
  () => settings.theme,
  (theme) => {
    document.documentElement.dataset.theme = theme
  },
  { immediate: true },
)
watch(() => urges.activeDelay, (activeDelay) => {
  if (activeDelay) {
    quickCardOpen.value = false
    return
  }
  nextTick(() => urgeButton.value?.focus())
})
onMounted(() => {
  if (urges.activeDelay) window.dispatchEvent(new Event('boring-time:urge-start'))
})
</script>

<template>
  <div class="app-shell" :class="{ 'session-shell': route.name === 'session' }">
    <div :inert="Boolean(urges.activeDelay)" :aria-hidden="Boolean(urges.activeDelay)">
      <aside v-if="updateAvailable" class="update-toast" role="status">
        Có phiên bản mới. <button type="button" aria-label="Tải lại để cập nhật Boring Time" @click="applyUpdate">Tải lại để cập nhật</button>
      </aside>
      <aside v-if="inAppReminder" class="reminder-toast" role="status">
        <span>{{ inAppReminder }}</span>
        <RouterLink to="/">Bắt đầu</RouterLink>
        <button type="button" aria-label="Đóng lời nhắc" @click="inAppReminder = ''">Đóng</button>
      </aside>
      <UrgeQuickCard v-if="quickCardOpen && showUrgeShortcut" @close="quickCardOpen = false" />
      <button
        v-if="showUrgeShortcut"
        ref="urgeButton"
        class="urge-floating-button"
        type="button"
        aria-label="Tôi đang muốn… Ghi nhận một thôi thúc"
        :aria-expanded="quickCardOpen"
        @click="quickCardOpen = !quickCardOpen"
      >Tôi đang muốn…</button>
      <RouterView />
    </div>
    <UrgeDelayView v-if="urges.activeDelay" />
  </div>
</template>
