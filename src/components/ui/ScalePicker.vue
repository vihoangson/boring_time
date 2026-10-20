<script setup>
defineProps({
  label: { type: String, required: true },
  modelValue: { type: Number, default: null },
  name: { type: String, required: true },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <fieldset class="scale-field">
    <legend>{{ label }}</legend>
    <div class="scale-options">
      <button
        v-for="score in 5"
        :key="score"
        class="scale-option"
        :class="{ selected: modelValue === score }"
        type="button"
        :aria-label="`${label}: ${score} trên 5`"
        :aria-pressed="modelValue === score"
        @click="$emit('update:modelValue', score)"
      >{{ score }}</button>
    </div>
    <div class="scale-hints"><span>Ít</span><span>Nhiều</span></div>
  </fieldset>
</template>
