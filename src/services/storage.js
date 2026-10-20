const STORAGE_KEY = 'boring-time-data'
export const SCHEMA_VERSION = 2

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
}

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const validScore = (score) => score === null || (Number.isInteger(score) && score >= 1 && score <= 5)
const validEmotion = (emotion) => emotion === null || EMOTIONS.includes(emotion)
const validLegacySession = (item) =>
  isRecord(item) &&
  typeof item.id === 'string' &&
  typeof item.endedAt === 'string' &&
  typeof item.duration === 'number' &&
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
  Number.isInteger(item.exitAttempts ?? 0) &&
  Number.isInteger(item.leaveCount ?? 0) &&
  (item.note === undefined || typeof item.note === 'string') &&
  (item.nextTask === undefined || typeof item.nextTask === 'string')

function normalizeSettings(value) {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS }
  return {
    duration: [5, 10, 15, 20].includes(value.duration) ? value.duration : DEFAULT_SETTINGS.duration,
    activity: ['dot', 'count', 'lines', 'paint', 'typing'].includes(value.activity) ? value.activity : DEFAULT_SETTINGS.activity,
    sound: ['brown', 'white', 'rain', 'tick', 'silence'].includes(value.sound) ? value.sound : DEFAULT_SETTINGS.sound,
    volume: typeof value.volume === 'number' && Number.isFinite(value.volume)
      ? Math.min(0.3, Math.max(0, value.volume))
      : DEFAULT_SETTINGS.volume,
    showTimer: typeof value.showTimer === 'boolean' ? value.showTimer : DEFAULT_SETTINGS.showTimer,
    theme: ['light', 'dark'].includes(value.theme) ? value.theme : DEFAULT_SETTINGS.theme,
    saveData: typeof value.saveData === 'boolean' ? value.saveData : DEFAULT_SETTINGS.saveData,
    openingBreath: typeof value.openingBreath === 'boolean' ? value.openingBreath : DEFAULT_SETTINGS.openingBreath,
  }
}

function migrateSession(item) {
  return {
    id: item.id,
    endedAt: item.endedAt,
    duration: item.duration,
    activity: item.activity,
    sound: item.sound,
    emotionBefore: validEmotion(item.emotionBefore) ? item.emotionBefore : null,
    emotionAfter: validEmotion(item.emotionAfter) ? item.emotionAfter : null,
    focusBefore: validScore(item.focusBefore) ? item.focusBefore : null,
    focusAfter: validScore(item.focusAfter) ? item.focusAfter : validScore(item.focus) ? item.focus : null,
    exitAttempts: Number.isInteger(item.exitAttempts) && item.exitAttempts >= 0 ? item.exitAttempts : 0,
    leaveCount: Number.isInteger(item.leaveCount) && item.leaveCount >= 0 ? item.leaveCount : 0,
    note: typeof item.note === 'string' ? item.note : '',
    nextTask: typeof item.nextTask === 'string' ? item.nextTask : '',
  }
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
  if (!isRecord(value) || ![1, SCHEMA_VERSION].includes(value.schemaVersion) || !isRecord(value.settings) || !Array.isArray(value.sessions)) {
    throw new Error('Tệp không đúng định dạng dữ liệu Boring Time.')
  }
  if (
    (value.schemaVersion === SCHEMA_VERSION && !value.sessions.every(validSession)) ||
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
