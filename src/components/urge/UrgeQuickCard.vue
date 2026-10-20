<script setup>
import { computed, ref } from 'vue'
import { URGE_EMOTIONS } from '../../data/urgeDefaults'
import { useSettingsStore } from '../../stores/settings'
import { useUrgesStore } from '../../stores/urges'
import { useRouter } from 'vue-router'

const emit = defineEmits(['close'])
const urges = useUrgesStore()
const settings = useSettingsStore()
const router = useRouter()
const habitId = ref(urges.habits[0]?.id || '')
const emotion = ref(URGE_EMOTIONS[0])
const note = ref('')
const habits = computed(() => urges.habits)

function begin() {
  if (!urges.beginUrge({ habitId: habitId.value, emotion: emotion.value, note: note.value })) return
  emit('close')
  router.push({ name: 'urge-delay' })
}
</script>

<template>
  <section class="urge-quick-card" role="dialog" aria-modal="false" aria-labelledby="urge-quick-title">
    <div class="urge-quick-heading">
      <h2 id="urge-quick-title">Tôi đang muốn…</h2>
      <button class="text-button" type="button" aria-label="Đóng thẻ ghi thôi thúc" @click="emit('close')">Đóng</button>
    </div>
    <form @submit.prevent="begin">
      <label class="reset-field">Thói quen
        <select v-model="habitId" required aria-label="Chọn thói quen">
          <option v-for="habit in habits" :key="habit.id" :value="habit.id">{{ habit.name }}</option>
        </select>
      </label>
      <label class="reset-field">Cảm xúc lúc này
        <select v-model="emotion" aria-label="Chọn cảm xúc">
          <option v-for="item in URGE_EMOTIONS" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
      <label class="reset-field">Ghi chú (không bắt buộc)
        <input v-model="note" class="text-input" maxlength="500" autocomplete="off" />
      </label>
      <p class="urge-quick-note">Trì hoãn {{ urges.delayMinutes }} phút để quan sát cơn muốn. Bạn luôn có thể dừng sớm.</p>
      <p v-if="!settings.saveData" class="urge-quick-note">Lưu lịch sử đang tắt; thông tin này không được ghi lại.</p>
      <button class="primary-button" type="submit" :disabled="!habits.length">Bắt đầu khoảng trì hoãn</button>
      <RouterLink v-if="!habits.length" class="text-button" to="/reset" @click="emit('close')">Thêm thói quen trước</RouterLink>
    </form>
  </section>
</template>
