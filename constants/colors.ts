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

export interface LabelColor {
  key: string
  bg: string
  text: string
}

export const LABEL_PALETTE: readonly LabelColor[] = [
  { key: 'pink', bg: '#FDE8F0', text: '#BE185D' },
  { key: 'blue', bg: '#E0F2FE', text: '#0369A1' },
  { key: 'green', bg: '#F0FDF4', text: '#166534' },
  { key: 'yellow', bg: '#FEF9C3', text: '#854D0E' },
  { key: 'purple', bg: '#EDE9FE', text: '#6D28D9' },
  { key: 'brown', bg: '#FDF2E9', text: '#78350F' },
  { key: 'red', bg: '#FEE2E2', text: '#991B1B' },
  { key: 'teal', bg: '#CCFBF1', text: '#115E59' },
  { key: 'indigo', bg: '#E0E7FF', text: '#3730A3' },
  { key: 'gray', bg: '#F3F4F6', text: '#374151' },
] as const

export const DEFAULT_LABEL_COLOR_KEY = 'gray'

export interface PastelTheme {
  soft: string
  softer: string
  accent: string
  deep: string
  ring: string
}

export const PASTEL_THEMES = {
  pink: {
    soft: '#FFE4EC',
    softer: '#FFF5F8',
    accent: '#F9A8C4',
    deep: '#BE185D',
    ring: '#FBCFE0',
  },
  yellow: {
    soft: '#FEF3C7',
    softer: '#FFFBEB',
    accent: '#FCD34D',
    deep: '#92400E',
    ring: '#FDE68A',
  },
  blue: {
    soft: '#DBEAFE',
    softer: '#F0F7FF',
    accent: '#93C5FD',
    deep: '#1D4ED8',
    ring: '#BFDBFE',
  },
} as const satisfies Record<string, PastelTheme>

const PALETTE_MAP: Record<string, LabelColor> = LABEL_PALETTE.reduce(
  (acc, c) => {
    acc[c.key] = c
    return acc
  },
  {} as Record<string, LabelColor>,
)

export function getLabelColor(key: string | undefined | null): LabelColor {
  if (!key) return PALETTE_MAP[DEFAULT_LABEL_COLOR_KEY]
  return PALETTE_MAP[key] ?? PALETTE_MAP[DEFAULT_LABEL_COLOR_KEY]
}
