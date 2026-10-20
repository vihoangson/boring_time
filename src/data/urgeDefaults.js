export const DEFAULT_HABITS = [
  { id: 'social', name: 'Lướt mạng xã hội', impact: 4, custom: false },
  { id: 'short-video', name: 'Xem video ngắn', impact: 5, custom: false },
  { id: 'games', name: 'Chơi game', impact: 3, custom: false },
  { id: 'news', name: 'Đọc tin tức', impact: 3, custom: false },
  { id: 'snacks', name: 'Ăn đồ ăn vặt', impact: 2, custom: false },
  { id: 'shopping', name: 'Mua sắm online', impact: 3, custom: false },
  { id: 'messages', name: 'Kiểm tra tin nhắn liên tục', impact: 3, custom: false },
]

export const DEFAULT_ALTERNATIVES = [
  { id: 'walk', name: 'Đi bộ không tai nghe', minutes: 15, energy: 'low', custom: false },
  { id: 'handwriting', name: 'Viết tay vài dòng', minutes: 5, energy: 'low', custom: false },
  { id: 'cook', name: 'Nấu một món đơn giản', minutes: 30, energy: 'medium', custom: false },
  { id: 'album', name: 'Nghe trọn một album', minutes: 30, energy: 'low', custom: false },
  { id: 'plants', name: 'Tưới cây', minutes: 5, energy: 'low', custom: false },
  { id: 'doodle', name: 'Vẽ nguệch ngoạc', minutes: 15, energy: 'low', custom: false },
  { id: 'stretch', name: 'Giãn cơ nhẹ', minutes: 5, energy: 'low', custom: false },
  { id: 'friend', name: 'Gọi một người bạn', minutes: 15, energy: 'medium', custom: false },
  { id: 'tidy', name: 'Dọn một góc nhỏ', minutes: 15, energy: 'medium', custom: false },
]

export const URGE_EMOTIONS = ['Chán', 'Căng', 'Mệt', 'Trốn việc', 'Cô đơn', 'Tò mò', 'Khác']
export const URGE_OUTCOMES = ['Cơn muốn đã giảm', 'Vẫn muốn nhưng ổn', 'Vẫn muốn mạnh']
export const URGE_DECISIONS = ['Làm việc khác', 'Vẫn làm', 'Chưa biết']
export const DEFAULT_RESET_DATA = {
  habits: DEFAULT_HABITS,
  urgeEntries: [],
  plans: [],
  alternatives: DEFAULT_ALTERNATIVES,
  alternativeEntries: [],
  delayMinutes: 10,
  gradualDelay: false,
}
