import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { DEFAULT_SETTINGS, SCHEMA_VERSION, importData, readData, writeData } from '../src/services/storage.js'

const values = new Map()
globalThis.window = {
  localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  },
}

const legacyData = {
  schemaVersion: 1,
  settings: { duration: 15, activity: 'paint', sound: 'rain', volume: 0.2, showTimer: false, theme: 'dark', saveData: true },
  sessions: [{
    id: 'legacy-1',
    endedAt: '2026-10-19T12:00:00.000Z',
    duration: 15,
    activity: 'paint',
    sound: 'rain',
    mood: 4,
    focus: 3,
  }],
}

beforeEach(() => values.clear())
afterEach(() => values.clear())

test('migrates saved v1 data and keeps previous settings and sessions', () => {
  values.set('boring-time-data', JSON.stringify(legacyData))

  const migrated = readData()
  const persisted = JSON.parse(values.get('boring-time-data'))

  assert.equal(migrated.schemaVersion, SCHEMA_VERSION)
  assert.equal(migrated.settings.duration, 15)
  assert.equal(migrated.settings.activity, 'paint')
  assert.equal(migrated.settings.theme, 'dark')
  assert.equal(migrated.settings.openingBreath, DEFAULT_SETTINGS.openingBreath)
  assert.equal(migrated.sessions.length, 1)
  assert.equal(migrated.sessions[0].id, 'legacy-1')
  assert.equal(migrated.sessions[0].focusAfter, 3)
  assert.equal(migrated.sessions[0].emotionBefore, null)
  assert.equal(persisted.schemaVersion, SCHEMA_VERSION)
  assert.equal(persisted.sessions[0].mood, undefined)
})

test('imports legacy v1 JSON through the same migration', () => {
  const migrated = importData(legacyData)

  assert.equal(migrated.schemaVersion, SCHEMA_VERSION)
  assert.equal(migrated.sessions[0].focusAfter, 3)
  assert.equal(migrated.settings.openingBreath, false)
})

test('writes new session fields in the current schema', () => {
  const data = {
    schemaVersion: SCHEMA_VERSION,
    settings: DEFAULT_SETTINGS,
    sessions: [{
      id: 'new-1',
      endedAt: '2026-10-20T12:00:00.000Z',
      duration: 10,
      activity: 'dot',
      sound: 'brown',
      emotionBefore: 'bồn chồn',
      emotionAfter: 'bình thản',
      focusBefore: 2,
      focusAfter: 4,
      exitAttempts: 1,
      leaveCount: 2,
      note: 'Một ý nghĩ',
      nextTask: 'Đọc vài trang',
    }],
  }

  assert.equal(writeData(data), true)
  assert.deepEqual(readData().sessions[0], data.sessions[0])
})
