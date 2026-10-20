import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { DEFAULT_SETTINGS, SCHEMA_VERSION, exportData, importData, readData, writeData } from '../src/services/storage.js'

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

test('migrates v2 settings and sessions to layered audio defaults without losing records', () => {
  const migrated = importData({
    schemaVersion: 2,
    settings: { duration: 10, activity: 'dot', sound: 'rain', volume: 0.17, showTimer: true, theme: 'light', saveData: true, openingBreath: false },
    sessions: [{
      id: 'v2-1',
      endedAt: '2026-10-20T12:00:00.000Z',
      duration: 9,
      activity: 'count',
      sound: 'rain',
      emotionBefore: 'mệt',
      emotionAfter: 'bình thản',
      focusBefore: 2,
      focusAfter: 4,
      exitAttempts: 1,
      leaveCount: 2,
      note: '',
      nextTask: 'Viết một dòng',
    }],
  })

  assert.equal(migrated.schemaVersion, SCHEMA_VERSION)
  assert.deepEqual(migrated.settings.soundLayers, [{ type: 'rain', volume: 0.17 }])
  assert.equal(migrated.sessions[0].id, 'v2-1')
  assert.equal(migrated.sessions[0].plannedDuration, 9)
  assert.equal(migrated.sessions[0].completed, false)
})

test('writes new session fields in the current schema', () => {
  const data = {
    schemaVersion: SCHEMA_VERSION,
    settings: DEFAULT_SETTINGS,
    sessions: [{
      id: 'new-1',
      endedAt: '2026-10-20T12:00:00.000Z',
      duration: 10,
      plannedDuration: 10,
      completed: true,
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

test('migrates v3 data to the current schema without losing settings or session records', () => {
  const migrated = importData({
    schemaVersion: 3,
    settings: { duration: 15, activity: 'paint', sound: 'rain', volume: 0.2, showTimer: false, theme: 'dark', saveData: true },
    sessions: [{
      id: 'v3-1',
      endedAt: '2026-10-20T12:00:00.000Z',
      duration: 15,
      activity: 'paint',
      sound: 'rain',
      emotionBefore: null,
      emotionAfter: null,
      focusBefore: null,
      focusAfter: null,
      exitAttempts: 0,
      leaveCount: 0,
    }],
  })

  assert.equal(migrated.schemaVersion, SCHEMA_VERSION)
  assert.equal(migrated.settings.duration, 15)
  assert.equal(migrated.settings.theme, 'dark')
  assert.equal(migrated.settings.breathingNoticeAcknowledged, false)
  assert.equal(migrated.sessions[0].id, 'v3-1')
})

test('stores breathing sessions in the shared history schema', () => {
  const breathingSession = {
    id: 'breath-1',
    endedAt: '2026-10-20T12:00:00.000Z',
    duration: 3,
    plannedDuration: 3,
    completed: true,
    kind: 'breathing',
    activity: 'gentle',
    sound: 'breath-tone',
    breathingPattern: 'gentle',
    breathingRhythm: 'inhale:4,exhale:6',
    cyclesCompleted: 18,
    elapsedSeconds: 180,
    emotionBefore: null,
    emotionAfter: null,
    focusBefore: null,
    focusAfter: null,
    exitAttempts: 0,
    leaveCount: 0,
    note: '',
    nextTask: '',
  }
  const data = { schemaVersion: SCHEMA_VERSION, settings: DEFAULT_SETTINGS, sessions: [breathingSession] }

  assert.equal(writeData(data), true)
  assert.deepEqual(readData().sessions[0], breathingSession)
})

test('migrates v4 data without changing previous settings or session history', () => {
  const migrated = importData({
    schemaVersion: 4,
    settings: { ...DEFAULT_SETTINGS, duration: 20, theme: 'dark' },
    sessions: [{
      id: 'v4-1',
      endedAt: '2026-10-20T12:00:00.000Z',
      duration: 10,
      activity: 'dot',
      sound: 'brown',
      focusAfter: 4,
      emotionBefore: null,
      emotionAfter: null,
      focusBefore: null,
      exitAttempts: 0,
      leaveCount: 0,
    }],
  })

  assert.equal(migrated.schemaVersion, SCHEMA_VERSION)
  assert.equal(migrated.settings.duration, 20)
  assert.equal(migrated.settings.theme, 'dark')
  assert.equal(migrated.sessions[0].id, 'v4-1')
  assert.equal(migrated.reset.habits.length, 7)
  assert.equal(migrated.reset.delayMinutes, 10)
})

test('round-trips reset habits, urge records, plans, and alternative activity logs', () => {
  const reset = {
    habits: [{ id: 'habit-custom', name: 'Xem tin liên tục', impact: 4, custom: true }],
    urgeEntries: [{
      id: 'urge-1',
      createdAt: '2026-10-20T12:00:00.000Z',
      habitId: 'habit-custom',
      habitName: 'Xem tin liên tục',
      emotion: 'Căng',
      note: 'Gần hạn chót',
      delayMinutes: 5,
      outcome: 'Vẫn muốn nhưng ổn',
      decision: 'Làm việc khác',
      exitedEarly: false,
    }],
    plans: [{ id: 'plan-1', situation: 'căng thẳng', action: 'đi rót nước', habitId: 'habit-custom', emotion: 'Căng' }],
    alternatives: [{ id: 'walk', name: 'Đi bộ', minutes: 15, energy: 'low', custom: false }],
    alternativeEntries: [{ id: 'alt-1', createdAt: '2026-10-20T12:30:00.000Z', activityId: 'walk', activityName: 'Đi bộ', note: 'Không vội' }],
    delayMinutes: 5,
    gradualDelay: true,
  }
  const data = { schemaVersion: SCHEMA_VERSION, settings: DEFAULT_SETTINGS, sessions: [], reset }

  assert.equal(writeData(data), true)
  assert.deepEqual(readData().reset, { ...reset, activeDelay: null })
  assert.deepEqual(importData(exportData(DEFAULT_SETTINGS, [], reset)).reset, { ...reset, activeDelay: null })
})

test('retains old urge log snapshots if a habit is later removed', () => {
  const data = {
    schemaVersion: SCHEMA_VERSION,
    settings: DEFAULT_SETTINGS,
    sessions: [],
    reset: {
      habits: [],
      urgeEntries: [{
        id: 'urge-old',
        createdAt: '2026-10-20T12:00:00.000Z',
        habitId: 'removed-habit',
        habitName: 'Thói quen đã xóa',
        emotion: 'Mệt',
        delayMinutes: 10,
        outcome: null,
        decision: null,
        exitedEarly: false,
      }],
      alternatives: [],
      plans: [],
      alternativeEntries: [],
      delayMinutes: 10,
    },
  }

  assert.equal(writeData(data), true)
  assert.equal(readData().reset.urgeEntries[0].habitName, 'Thói quen đã xóa')
})

test('restores an in-progress delay from its saved timestamp', () => {
  const activeDelay = {
    id: 'urge-active',
    createdAt: '2026-10-20T12:00:00.000Z',
    deadline: 1792497900000,
    habitId: 'social',
    habitName: 'Lướt mạng xã hội',
    emotion: 'Chán',
    note: '',
    delayMinutes: 10,
  }
  const data = importData({
    schemaVersion: SCHEMA_VERSION,
    settings: DEFAULT_SETTINGS,
    sessions: [],
    reset: { activeDelay },
  })

  assert.deepEqual(data.reset.activeDelay, activeDelay)
})
