export const COLORS = {
  primary: '#1E90FF',
  primaryLight: '#E8F4FF',
  primaryBg: '#F0F7FF',

  text: {
    primary: '#1A1A2E',
    secondary: '#6B7280',
    muted: '#9CA3AF',
  },
  border: '#E5E7EB',
  white: '#FFFFFF',
  bg: '#F8FAFC',

  status: {
    done: '#10B981',
    inProgress: '#F59E0B',
    pending: '#9CA3AF',
    danger: '#EF4444',
  },
} as const

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  과일: { bg: '#FDE8F0', text: '#BE185D' },
  차: { bg: '#E0F2FE', text: '#0369A1' },
  곡물: { bg: '#F0FDF4', text: '#166534' },
  견과: { bg: '#FEF9C3', text: '#854D0E' },
  술: { bg: '#EDE9FE', text: '#6D28D9' },
  초콜릿: { bg: '#FDF2E9', text: '#78350F' },
  기타: { bg: '#F3F4F6', text: '#374151' },
  유제품: { bg: '#E0F2FE', text: '#0369A1' },
  당류: { bg: '#FEF9C3', text: '#854D0E' },
}
