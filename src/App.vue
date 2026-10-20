<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from './stores/settings'
import { usePwaUpdates } from './composables/usePwaUpdates'
import { useReminders } from './composables/useReminders'
import UrgeQuickCard from './components/urge/UrgeQuickCard.vue'

const settings = useSettingsStore()
const route = useRoute()
const quickCardOpen = ref(false)
const showUrgeShortcut = computed(() => !['breathing', 'urge-delay', 'focus'].includes(route.name))
const { updateAvailable, applyUpdate } = usePwaUpdates()
const { inAppReminder } = useReminders()

watch(
  () => settings.theme,
  (theme) => {
    document.documentElement.dataset.theme = theme
  },
  { immediate: true },
)
</script>

<template>
  <div class="app-shell" :class="{ 'session-shell': route.name === 'session' }">
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
      class="urge-floating-button"
      type="button"
      aria-label="Tôi đang muốn… Ghi nhận một thôi thúc"
      :aria-expanded="quickCardOpen"
      @click="quickCardOpen = !quickCardOpen"
    >Tôi đang muốn…</button>
    <RouterView />
  </div>
</template>
