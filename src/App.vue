<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from './stores/settings'
import { usePwaUpdates } from './composables/usePwaUpdates'

const settings = useSettingsStore()
const route = useRoute()
const { updateAvailable, applyUpdate } = usePwaUpdates()

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
    <RouterView />
  </div>
</template>
