<script setup>
import { useRouter } from 'vue-router'
import { useCountdown } from '../composables/useCountdown'

const router = useRouter()
useCountdown(60_000, () => router.replace('/finish'))

function skip() {
  router.replace('/finish')
}
</script>

<template>
  <main class="landing-view" aria-label="Khoảng thời gian đáp xuống">
    <span class="landing-orb" aria-hidden="true" />
    <button class="landing-skip" type="button" aria-label="Bỏ qua thời gian đáp xuống" @click="skip">Bỏ qua</button>
  </main>
</template>
