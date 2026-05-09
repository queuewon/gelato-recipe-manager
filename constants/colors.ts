export const COLORS = {
  primary: '#FF85A1',        // 파스텔 핑크 (메인)
  primaryLight: '#FFE8F0',   // 핑크 라이트
  primaryBg: '#FFF0F5',      // 핑크 배경

  secondary: '#85BBFF',      // 파스텔 블루
  secondaryLight: '#E0EFFF', // 블루 라이트
  secondaryBg: '#EDF7FF',    // 블루 배경

  accent: '#FFD166',         // 파스텔 옐로
  accentLight: '#FFF5DC',    // 옐로 라이트
  accentBg: '#FFFBEF',       // 옐로 배경

  text: {
    primary: '#2D2040',
    secondary: '#6B7280',
    muted: '#A0A8B3',
  },
  border: '#EFE0E8',
  white: '#FFFFFF',
  bg: '#FFF9FB',

  status: {
    done: '#5BC99A',
    inProgress: '#FFD166',
    pending: '#B0BAC5',
    danger: '#FF6B6B',
  },
} as const

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  '과일': { bg: '#FFE0EC', text: '#D94F7F' },
  '차': { bg: '#E0EFFF', text: '#3B7FD4' },
  '곡물': { bg: '#E8F8EE', text: '#2E7D50' },
  '견과': { bg: '#FFF4DC', text: '#C97A10' },
  '술': { bg: '#EDE8FF', text: '#6B3FB5' },
  '초콜릿': { bg: '#FDE8DC', text: '#A04025' },
  '기타': { bg: '#F5F5F8', text: '#4A5568' },
  '유제품': { bg: '#E0EFFF', text: '#3B7FD4' },
  '당류': { bg: '#FFF4DC', text: '#C97A10' },
}
