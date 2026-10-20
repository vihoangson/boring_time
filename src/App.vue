<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from './stores/settings'

const settings = useSettingsStore()
const route = useRoute()

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
    <RouterView />
  </div>
</template>
