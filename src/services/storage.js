const STORAGE_KEY = 'boring-time-data'
export const SCHEMA_VERSION = 4

export const EMOTIONS = ['căng thẳng', 'bồn chồn', 'bình thản', 'mệt', 'tràn năng lượng', 'trống rỗng']

export const DEFAULT_SETTINGS = {
  duration: 10,
  activity: 'dot',
  sound: 'brown',
  volume: 0.12,
  showTimer: true,
  theme: 'light',
  saveData: true,
  openingBreath: false,
  soundLayers: [{ type: 'brown', volume: 0.12 }],
  silentAudio: false,
  reminders: [],
  suggestDurationIncrease: false,
  breathingNoticeAcknowledged: false,
}

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const SOUND_TYPES = ['brown', 'white', 'rain', 'tick']
const validScore = (score) => score === null || (Number.isInteger(score) && score >= 1 && score <= 5)
const validEmotion = (emotion) => emotion === null || EMOTIONS.includes(emotion)
const validLegacySession = (item) =>
  isRecord(item) &&
  typeof item.id === 'string' &&
  typeof item.endedAt === 'string' &&
  (typeof item.duration === 'number' && Number.isFinite(item.duration) && item.duration >= 0) &&
  typeof item.activity === 'string' &&
  typeof item.sound === 'string' &&
  validScore(item.mood) &&
  validScore(item.focus)
const validSession = (item) =>
  isRecord(item) &&
  typeof item.id === 'string' &&
  typeof item.endedAt === 'string' &&
  typeof item.duration === 'number' &&
  typeof item.activity === 'string' &&
  typeof item.sound === 'string' &&
  validEmotion(item.emotionBefore ?? null) &&
  validEmotion(item.emotionAfter ?? null) &&
  validScore(item.focusBefore ?? null) &&
  validScore(item.focusAfter ?? item.focus ?? null) &&
  Number.isInteger(item.exitAttempts ?? 0) && (item.exitAttempts ?? 0) >= 0 &&
  Number.isInteger(item.leaveCount ?? 0) && (item.leaveCount ?? 0) >= 0 &&
  (item.plannedDuration === undefined || (Number.isFinite(item.plannedDuration) && item.plannedDuration > 0)) &&
  (item.completed === undefined || typeof item.completed === 'boolean') &&
  (item.kind === undefined || ['rest', 'breathing'].includes(item.kind)) &&
  (item.breathingPattern === undefined || typeof item.breathingPattern === 'string') &&
  (item.breathingRhythm === undefined || typeof item.breathingRhythm === 'string') &&
  (item.cyclesCompleted === undefined || (Number.isInteger(item.cyclesCompleted) && item.cyclesCompleted >= 0)) &&
  (item.elapsedSeconds === undefined || (Number.isFinite(item.elapsedSeconds) && item.elapsedSeconds >= 0)) &&
  (item.note === undefined || typeof item.note === 'string') &&
  (item.nextTask === undefined || typeof item.nextTask === 'string')

function normalizeSoundLayers(value, legacySound, legacyVolume) {
  if (Array.isArray(value)) {
    const layers = []
    for (const layer of value) {
      if (!isRecord(layer) || !SOUND_TYPES.includes(layer.type) || layers.some((existing) => existing.type === layer.type)) continue
      layers.push({
        type: layer.type,
        volume: typeof layer.volume === 'number' && Number.isFinite(layer.volume)
          ? Math.min(0.3, Math.max(0, layer.volume))
          : DEFAULT_SETTINGS.volume,
      })
      if (layers.length === 3) break
    }
    return layers
  }
  return SOUND_TYPES.includes(legacySound)
    ? [{
        type: legacySound,
        volume: typeof legacyVolume === 'number' && Number.isFinite(legacyVolume)
          ? Math.min(0.3, Math.max(0, legacyVolume))
          : DEFAULT_SETTINGS.volume,
      }]
    : []
}

function normalizeReminders(value) {
  if (!Array.isArray(value)) return []
  const ids = new Set()
  return value.filter((reminder) => {
    if (
      !isRecord(reminder) ||
      typeof reminder.id !== 'string' ||
      ids.has(reminder.id) ||
      !Array.isArray(reminder.days) ||
      !reminder.days.length ||
      !reminder.days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) ||
      typeof reminder.time !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminder.time) ||
      typeof reminder.enabled !== 'boolean'
    ) return false
    ids.add(reminder.id)
    return true
  }).slice(0, 20).map((reminder) => ({
    id: reminder.id,
    days: [...new Set(reminder.days)],
    time: reminder.time,
    enabled: reminder.enabled,
  }))
}

function normalizeSettings(value) {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS }
  return {
    duration: Number.isInteger(value.duration) && value.duration >= 5 && value.duration <= 22
      ? value.duration
      : DEFAULT_SETTINGS.duration,
    activity: ['dot', 'count', 'lines', 'paint', 'typing'].includes(value.activity) ? value.activity : DEFAULT_SETTINGS.activity,
    sound: ['brown', 'white', 'rain', 'tick', 'silence'].includes(value.sound) ? value.sound : DEFAULT_SETTINGS.sound,
    volume: typeof value.volume === 'number' && Number.isFinite(value.volume)
      ? Math.min(0.3, Math.max(0, value.volume))
      : DEFAULT_SETTINGS.volume,
    showTimer: typeof value.showTimer === 'boolean' ? value.showTimer : DEFAULT_SETTINGS.showTimer,
    theme: ['light', 'dark'].includes(value.theme) ? value.theme : DEFAULT_SETTINGS.theme,
    saveData: typeof value.saveData === 'boolean' ? value.saveData : DEFAULT_SETTINGS.saveData,
    openingBreath: typeof value.openingBreath === 'boolean' ? value.openingBreath : DEFAULT_SETTINGS.openingBreath,
    soundLayers: normalizeSoundLayers(value.soundLayers, value.sound, value.volume),
    silentAudio: typeof value.silentAudio === 'boolean' ? value.silentAudio : false,
    reminders: normalizeReminders(value.reminders),
    suggestDurationIncrease: typeof value.suggestDurationIncrease === 'boolean'
      ? value.suggestDurationIncrease
      : DEFAULT_SETTINGS.suggestDurationIncrease,
    breathingNoticeAcknowledged: typeof value.breathingNoticeAcknowledged === 'boolean'
      ? value.breathingNoticeAcknowledged
      : DEFAULT_SETTINGS.breathingNoticeAcknowledged,
  }
}

function migrateSession(item) {
  const migrated = {
    id: item.id,
    endedAt: item.endedAt,
    duration: item.duration,
    activity: item.activity,
    sound: item.sound,
    plannedDuration: Number.isFinite(item.plannedDuration) && item.plannedDuration > 0 ? item.plannedDuration : item.duration,
    completed: item.completed === true,
    emotionBefore: validEmotion(item.emotionBefore) ? item.emotionBefore : null,
    emotionAfter: validEmotion(item.emotionAfter) ? item.emotionAfter : null,
    focusBefore: validScore(item.focusBefore) ? item.focusBefore : null,
    focusAfter: validScore(item.focusAfter) ? item.focusAfter : validScore(item.focus) ? item.focus : null,
    exitAttempts: Number.isInteger(item.exitAttempts) && item.exitAttempts >= 0 ? item.exitAttempts : 0,
    leaveCount: Number.isInteger(item.leaveCount) && item.leaveCount >= 0 ? item.leaveCount : 0,
    note: typeof item.note === 'string' ? item.note : '',
    nextTask: typeof item.nextTask === 'string' ? item.nextTask : '',
  }
  if (item.kind === 'breathing') {
    migrated.kind = 'breathing'
    migrated.breathingPattern = typeof item.breathingPattern === 'string' ? item.breathingPattern : 'gentle'
    migrated.breathingRhythm = typeof item.breathingRhythm === 'string' ? item.breathingRhythm : ''
    migrated.cyclesCompleted = Number.isInteger(item.cyclesCompleted) && item.cyclesCompleted >= 0 ? item.cyclesCompleted : 0
    migrated.elapsedSeconds = Number.isFinite(item.elapsedSeconds) && item.elapsedSeconds >= 0 ? item.elapsedSeconds : item.duration * 60
  } else if (item.kind === 'rest') {
    migrated.kind = 'rest'
  }
  return migrated
}

export function migrateData(value) {
  if (!isRecord(value)) return { schemaVersion: SCHEMA_VERSION, settings: { ...DEFAULT_SETTINGS }, sessions: [] }

  if (value.schemaVersion === SCHEMA_VERSION) {
    return {
      schemaVersion: SCHEMA_VERSION,
      settings: normalizeSettings(value.settings),
      sessions: Array.isArray(value.sessions) ? value.sessions.filter(validSession).map(migrateSession).slice(-5000) : [],
    }
  }

  if (value.schemaVersion === 1) {
    return {
      schemaVersion: SCHEMA_VERSION,
      settings: normalizeSettings(value.settings),
      sessions: Array.isArray(value.sessions) ? value.sessions.filter(validLegacySession).map((item) => ({
        ...migrateSession(item),
        emotionBefore: null,
        emotionAfter: null,
        focusBefore: null,
        focusAfter: item.focus,
      })).slice(-5000) : [],
    }
  }

  if (value.schemaVersion === 2) {
    return {
      schemaVersion: SCHEMA_VERSION,
      settings: normalizeSettings(value.settings),
      sessions: Array.isArray(value.sessions) ? value.sessions.filter(validSession).map(migrateSession).slice(-5000) : [],
    }
  }

  if (value.schemaVersion === 3) {
    return {
      schemaVersion: SCHEMA_VERSION,
      settings: normalizeSettings(value.settings),
      sessions: Array.isArray(value.sessions) ? value.sessions.filter(validSession).map(migrateSession).slice(-5000) : [],
    }
  }

  return { schemaVersion: SCHEMA_VERSION, settings: { ...DEFAULT_SETTINGS }, sessions: [] }
}

function normalizeData(value) {
  return migrateData(value)
}

export function readData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return normalizeData(null)
    const parsed = JSON.parse(raw)
    const migrated = migrateData(parsed)
    if (parsed.schemaVersion !== SCHEMA_VERSION) writeData(migrated)
    return migrated
  } catch (error) {
    console.warn('Không thể đọc dữ liệu Boring Time từ localStorage.', error)
    return normalizeData(null)
  }
}

export function writeData(data) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizeData({ ...data, schemaVersion: SCHEMA_VERSION })),
    )
    return true
  } catch (error) {
    console.error('Không thể lưu dữ liệu Boring Time vào localStorage.', error)
    return false
  }
}

export function clearData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Không thể xóa dữ liệu Boring Time khỏi localStorage.', error)
    return false
  }
}

export function importData(value) {
  if (!isRecord(value) || ![1, 2, 3, SCHEMA_VERSION].includes(value.schemaVersion) || !isRecord(value.settings) || !Array.isArray(value.sessions)) {
    throw new Error('Tệp không đúng định dạng dữ liệu Boring Time.')
  }
  if (
    (value.schemaVersion === SCHEMA_VERSION && !value.sessions.every(validSession)) ||
    (value.schemaVersion === 3 && !value.sessions.every(validSession)) ||
    (value.schemaVersion === 2 && !value.sessions.every(validSession)) ||
    (value.schemaVersion === 1 && !value.sessions.every(validLegacySession))
  ) {
    throw new Error('Tệp có một hoặc nhiều phiên không hợp lệ.')
  }
  return migrateData(value)
}

export function exportData(settings, sessions) {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: normalizeSettings(settings),
    sessions: sessions.filter(validSession),
  }
}
