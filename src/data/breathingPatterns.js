export const BREATHING_PATTERNS = [
  {
    id: 'gentle',
    name: 'Thở chậm nhẹ nhàng',
    description: 'Thở ra dài hơn một chút, không cần giữ hơi.',
    recommendation: 'Người mới',
    phases: [
      { id: 'inhale', label: 'Hít vào', seconds: 4 },
      { id: 'exhale', label: 'Thở ra', seconds: 6 },
    ],
  },
  {
    id: 'coherent',
    name: 'Thở nhịp đồng bộ',
    description: 'Một nhịp chậm và đều để thực hành hằng ngày.',
    recommendation: 'Mọi người',
    phases: [
      { id: 'inhale', label: 'Hít vào', seconds: 5 },
      { id: 'exhale', label: 'Thở ra', seconds: 5 },
    ],
  },
  {
    id: 'box',
    name: 'Thở vuông (box)',
    description: 'Nhịp bốn cạnh có những khoảng giữ hơi nhẹ.',
    recommendation: 'Trung cấp',
    phases: [
      { id: 'inhale', label: 'Hít vào', seconds: 4 },
      { id: 'hold-in', label: 'Giữ nhẹ', seconds: 4 },
      { id: 'exhale', label: 'Thở ra', seconds: 4 },
      { id: 'hold-out', label: 'Giữ nhẹ', seconds: 4 },
    ],
  },
]

export function getBreathingPattern(id) {
  return BREATHING_PATTERNS.find((pattern) => pattern.id === id) || BREATHING_PATTERNS[0]
}

export function getBreathingRhythm(pattern) {
  return pattern.phases.map((phase) => `${phase.id}:${phase.seconds}`).join(',')
}
