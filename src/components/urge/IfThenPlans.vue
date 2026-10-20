<script setup>
import { ref } from 'vue'
import { URGE_EMOTIONS } from '../../data/urgeDefaults'
import { useUrgesStore } from '../../stores/urges'

const urges = useUrgesStore()
const situation = ref('')
const action = ref('')
const habitId = ref('')
const emotion = ref('')

function add() {
  if (!urges.addPlan({ situation: situation.value, action: action.value, habitId: habitId.value, emotion: emotion.value })) return
  situation.value = ''
  action.value = ''
  habitId.value = ''
  emotion.value = ''
}
</script>

<template>
  <section class="reset-section">
    <h2>Kế hoạch nếu–thì</h2>
    <p class="muted-note">Tối đa 5 kế hoạch. Một câu nhỏ có thể giúp bạn chuẩn bị trước, không phải cam kết.</p>
    <ul v-if="urges.plans.length" class="simple-record-list">
      <li v-for="plan in urges.plans" :key="plan.id">
        <span><strong>Nếu</strong> {{ plan.situation }}, <strong>thì</strong> {{ plan.action }}</span>
        <button class="text-button" type="button" :aria-label="`Xóa kế hoạch nếu ${plan.situation}`" @click="urges.removePlan(plan.id)">Xóa</button>
      </li>
    </ul>
    <form v-if="urges.plans.length < 5" class="reset-plan-form" @submit.prevent="add">
      <label class="reset-field">Nếu
        <input v-model="situation" class="text-input" maxlength="120" required placeholder="cảm thấy chán buổi chiều" />
      </label>
      <label class="reset-field">Thì
        <input v-model="action" class="text-input" maxlength="160" required placeholder="đứng dậy đi lấy nước" />
      </label>
      <label class="reset-field">Áp dụng khi có thói quen này (không bắt buộc)
        <select v-model="habitId" aria-label="Chọn thói quen áp dụng">
          <option value="">Mọi thói quen</option>
          <option v-for="habit in urges.habits" :key="habit.id" :value="habit.id">{{ habit.name }}</option>
        </select>
      </label>
      <label class="reset-field">Cảm xúc (không bắt buộc)
        <select v-model="emotion" aria-label="Chọn cảm xúc áp dụng">
          <option value="">Mọi cảm xúc</option>
          <option v-for="item in URGE_EMOTIONS" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
      <button class="secondary-button" type="submit">Lưu kế hoạch</button>
    </form>
    <p v-else class="muted-note">Đã có 5 kế hoạch. Xóa một kế hoạch để tạo mục khác.</p>
  </section>
</template>
