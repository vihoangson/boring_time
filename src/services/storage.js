const STORAGE_KEY = 'boring-time-data'
const SCHEMA_VERSION = 1

export const DEFAULT_SETTINGS = {
  duration: 10,
  activity: 'dot',
  sound: 'brown',
  volume: 0.12,
  showTimer: true,
  theme: 'light',
  saveData: true,
}

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const validSession = (item) =>
  isRecord(item) &&
  typeof item.id === 'string' &&
  typeof item.endedAt === 'string' &&
  typeof item.duration === 'number' &&
  typeof item.activity === 'string' &&
  typeof item.sound === 'string' &&
  (item.mood === null || (Number.isInteger(item.mood) && item.mood >= 1 && item.mood <= 5)) &&
  (item.focus === null || (Number.isInteger(item.focus) && item.focus >= 1 && item.focus <= 5))

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
  }
}

function normalizeData(value) {
  if (!isRecord(value) || value.schemaVersion !== SCHEMA_VERSION) {
    return { schemaVersion: SCHEMA_VERSION, settings: { ...DEFAULT_SETTINGS }, sessions: [] }
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: normalizeSettings(value.settings),
    sessions: Array.isArray(value.sessions) ? value.sessions.filter(validSession).slice(-5000) : [],
  }
}

export function readData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? normalizeData(JSON.parse(raw)) : normalizeData(null)
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
  if (!isRecord(value) || value.schemaVersion !== SCHEMA_VERSION || !isRecord(value.settings) || !Array.isArray(value.sessions)) {
    throw new Error('Tệp không đúng định dạng dữ liệu Boring Time.')
  }
  if (!value.sessions.every(validSession)) {
    throw new Error('Tệp có một hoặc nhiều phiên không hợp lệ.')
  }
  return normalizeData(value)
}

export function exportData(settings, sessions) {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: normalizeSettings(settings),
    sessions: sessions.filter(validSession),
  }
}
