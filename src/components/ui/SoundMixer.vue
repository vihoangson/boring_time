<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../../stores/settings'

const settings = useSettingsStore()
const notice = ref('')
const sounds = [
  { id: 'brown', name: 'Tiếng ồn nâu' },
  { id: 'white', name: 'Tiếng ồn trắng nhẹ' },
  { id: 'rain', name: 'Mưa đều' },
  { id: 'tick', name: 'Tích tắc chậm' },
]

function selectSound(event, type) {
  const layers = [...settings.soundLayers]
  if (event.target.checked) {
    if (layers.length >= 3) {
      notice.value = 'Có thể chọn tối đa ba lớp âm thanh.'
      event.target.checked = false
      return
    }
    layers.push({ type, volume: 0.08 })
  } else {
    const index = layers.findIndex((layer) => layer.type === type)
    if (index !== -1) layers.splice(index, 1)
  }
  notice.value = ''
  settings.update({
    soundLayers: layers,
    sound: layers.map((layer) => layer.type).join('+') || 'silence',
    silentAudio: layers.length === 0,
  })
}

function setLayerVolume(type, volume) {
  settings.update({
    soundLayers: settings.soundLayers.map((layer) => layer.type === type ? { ...layer, volume } : layer),
  })
}

function setSilence(enabled) {
  const soundLayers = !enabled && settings.soundLayers.length === 0
    ? [{ type: 'brown', volume: settings.volume }]
    : settings.soundLayers
  settings.update({
    silentAudio: enabled,
    soundLayers,
    sound: enabled ? 'silence' : soundLayers.map((layer) => layer.type).join('+'),
  })
}
</script>

<template>
  <section class="sound-mixer">
    <h2>Âm thanh <span class="muted-inline">· mix gần nhất được lưu</span></h2>
    <div class="sound-layers">
      <div v-for="sound in sounds" :key="sound.id" class="sound-layer">
        <label class="sound-layer-toggle">
          <input
            type="checkbox"
            :checked="settings.soundLayers.some((layer) => layer.type === sound.id)"
            :disabled="settings.soundLayers.length >= 3 && !settings.soundLayers.some((layer) => layer.type === sound.id)"
            :aria-label="`Thêm hoặc bỏ lớp ${sound.name}`"
            @change="selectSound($event, sound.id)"
          />
          <span>{{ sound.name }}</span>
        </label>
        <label v-if="settings.soundLayers.some((layer) => layer.type === sound.id)" class="layer-volume">
          Âm lượng
          <input
            :value="settings.soundLayers.find((layer) => layer.type === sound.id)?.volume ?? 0.08"
            :aria-label="`Âm lượng lớp ${sound.name}`"
            type="range"
            min="0"
            max="0.3"
            step="0.01"
            @input="setLayerVolume(sound.id, Number($event.target.value))"
          />
        </label>
      </div>
    </div>
    <label class="silence-toggle">
      <input :checked="settings.silentAudio" type="checkbox" aria-label="Im lặng hoàn toàn" @change="setSilence($event.target.checked)" />
      Im lặng hoàn toàn
    </label>
    <p v-if="notice" class="muted-note" role="status">{{ notice }}</p>
  </section>
</template>
