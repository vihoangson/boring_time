<script setup>
import { EMOTIONS } from '../../services/storage'

defineProps({
  modelValue: { type: String, default: null },
  label: { type: String, required: true },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <fieldset class="emotion-field">
    <legend>{{ label }}</legend>
    <div class="emotion-options">
      <button
        v-for="emotion in EMOTIONS"
        :key="emotion"
        class="emotion-option"
        :class="{ selected: modelValue === emotion }"
        type="button"
        :aria-label="`${label}: ${emotion}`"
        :aria-pressed="modelValue === emotion"
        @click="$emit('update:modelValue', modelValue === emotion ? null : emotion)"
      >{{ emotion }}</button>
    </div>
  </fieldset>
</template>
