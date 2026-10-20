<script setup>
import { computed, ref } from 'vue'
import { useUrgesStore } from '../../stores/urges'

const props = defineProps({
  compact: { type: Boolean, default: false },
})
const urges = useUrgesStore()
const timeFilter = ref('any')
const energyFilter = ref('any')
const suggestedId = ref('')
const completingId = ref('')
const note = ref('')
const newName = ref('')
const newMinutes = ref(15)
const newEnergy = ref('low')
const activities = computed(() => urges.alternatives.filter((item) =>
  (timeFilter.value === 'any' || item.minutes <= Number(timeFilter.value)) &&
  (energyFilter.value === 'any' || item.energy === energyFilter.value),
))
const suggested = computed(() => activities.value.find((item) => item.id === suggestedId.value) || null)

function suggest() {
  if (!activities.value.length) {
    suggestedId.value = ''
    return
  }
  suggestedId.value = activities.value[Math.floor(Math.random() * activities.value.length)].id
}

function startCompletion(activity) {
  completingId.value = activity.id
  note.value = ''
}

function saveCompletion() {
  urges.completeAlternative(completingId.value, note.value)
  completingId.value = ''
  note.value = ''
}

function add() {
  if (!urges.addAlternative({ name: newName.value, minutes: newMinutes.value, energy: newEnergy.value })) return
  newName.value = ''
}
</script>

<template>
  <section class="reset-section alternative-section">
    <h2>Hoạt động thay thế</h2>
    <p v-if="!props.compact" class="muted-note">Chọn điều nhỏ, dễ chịu và phù hợp với thời gian, năng lượng hiện có.</p>
    <div class="alternative-filters">
      <label>Thời gian
        <select v-model="timeFilter" aria-label="Lọc theo thời gian">
          <option value="any">Bất kỳ</option>
          <option value="5">Đến 5 phút</option>
          <option value="15">Đến 15 phút</option>
          <option value="30">Đến 30 phút</option>
        </select>
      </label>
      <label>Năng lượng
        <select v-model="energyFilter" aria-label="Lọc theo năng lượng">
          <option value="any">Bất kỳ</option>
          <option value="low">Thấp</option>
          <option value="medium">Vừa</option>
        </select>
      </label>
    </div>
    <button class="secondary-button" type="button" aria-label="Gợi ý một hoạt động thay thế" @click="suggest">Gợi ý cho tôi</button>
    <p v-if="suggested" class="alternative-suggestion" role="status">{{ suggested.name }} · {{ suggested.minutes }} phút · năng lượng {{ suggested.energy === 'low' ? 'thấp' : 'vừa' }}</p>
    <p v-if="!activities.length" class="empty-state">Chưa có hoạt động phù hợp với bộ lọc này.</p>
    <ul v-else class="alternative-list">
      <li v-for="activity in activities" :key="activity.id" :class="{ 'is-suggested': suggestedId === activity.id }">
        <div class="alternative-name">
          <input
            :value="activity.name"
            :aria-label="`Tên hoạt động: ${activity.name}`"
            maxlength="80"
            @change="urges.updateAlternative(activity.id, { name: $event.target.value })"
          />
          <small>{{ activity.minutes }} phút · năng lượng {{ activity.energy === 'low' ? 'thấp' : 'vừa' }}</small>
        </div>
        <button class="text-button" type="button" :aria-label="`Đánh dấu đã làm: ${activity.name}`" @click="startCompletion(activity)">Đã làm</button>
        <button class="text-button danger-text" type="button" :aria-label="`Xóa hoạt động ${activity.name}`" @click="urges.removeAlternative(activity.id)">Xóa</button>
        <form v-if="completingId === activity.id" class="alternative-note-form" @submit.prevent="saveCompletion">
          <label>Cảm nhận (không bắt buộc)
            <input v-model="note" class="text-input" maxlength="500" />
          </label>
          <button class="secondary-button" type="submit">Lưu</button>
        </form>
      </li>
    </ul>
    <form v-if="!compact" class="reset-inline-form" @submit.prevent="add">
      <label class="reset-field">Thêm hoạt động
        <input v-model="newName" class="text-input" maxlength="80" required placeholder="Một điều dễ chịu, đơn giản" />
      </label>
      <label class="reset-field">Thời lượng
        <select v-model.number="newMinutes" aria-label="Thời lượng hoạt động mới">
          <option :value="5">5 phút</option><option :value="15">15 phút</option><option :value="30">30 phút</option>
        </select>
      </label>
      <label class="reset-field">Năng lượng
        <select v-model="newEnergy" aria-label="Mức năng lượng hoạt động mới">
          <option value="low">Thấp</option><option value="medium">Vừa</option>
        </select>
      </label>
      <button class="secondary-button" type="submit">Thêm</button>
    </form>
  </section>
</template>
