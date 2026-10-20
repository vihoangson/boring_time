<script setup>
import { reactive, ref } from 'vue'
import { useUrgesStore } from '../../stores/urges'

const urges = useUrgesStore()
const name = ref('')
const impact = ref(3)
const drafts = reactive({})

function update(habit) {
  urges.updateHabit(habit.id, { name: drafts[habit.id] ?? habit.name, impact: habit.impact })
}

function remove(habit) {
  if (window.confirm(`Xóa mục "${habit.name}" khỏi bản đồ thói quen? Nhật ký cũ vẫn được giữ.`)) urges.removeHabit(habit.id)
}

function add() {
  if (!urges.addHabit(name.value, impact.value)) return
  name.value = ''
  impact.value = 3
}
</script>

<template>
  <section class="reset-section">
    <h2>Bản đồ thói quen</h2>
    <p class="muted-note">Mức ảnh hưởng lên hiệu suất do bạn tự đánh giá, không phải thang đo khách quan.</p>
    <ul class="reset-edit-list">
      <li v-for="habit in urges.habits" :key="habit.id">
        <label>
          <span class="visually-hidden">Tên thói quen</span>
          <input v-model="drafts[habit.id]" class="text-input" :placeholder="habit.name" :aria-label="`Tên thói quen: ${habit.name}`" maxlength="80" @change="update(habit)" />
        </label>
        <label class="impact-picker">
          <span>Mức ảnh hưởng</span>
          <select v-model.number="habit.impact" :aria-label="`Mức ảnh hưởng của ${habit.name}`" @change="update(habit)">
            <option v-for="score in 5" :key="score" :value="score">{{ score }}/5</option>
          </select>
        </label>
        <button class="text-button danger-text" type="button" :aria-label="`Xóa ${habit.name}`" @click="remove(habit)">Xóa</button>
      </li>
    </ul>
    <form class="reset-inline-form" @submit.prevent="add">
      <label class="reset-field">Thêm thói quen
        <input v-model="name" class="text-input" maxlength="80" required placeholder="Ví dụ: kiểm tra email liên tục" />
      </label>
      <label class="reset-field">Ảnh hưởng
        <select v-model.number="impact" aria-label="Mức ảnh hưởng của thói quen mới">
          <option v-for="score in 5" :key="score" :value="score">{{ score }}/5</option>
        </select>
      </label>
      <button class="secondary-button" type="submit">Thêm</button>
    </form>
  </section>
</template>
