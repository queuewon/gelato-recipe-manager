export interface DefaultLabel {
  name: string
  color: string
}

export const DEFAULT_RECIPE_CATEGORIES: DefaultLabel[] = [
  { name: '과일', color: 'pink' },
  { name: '차', color: 'blue' },
  { name: '곡물', color: 'green' },
  { name: '견과', color: 'yellow' },
  { name: '술', color: 'purple' },
  { name: '초콜릿', color: 'brown' },
  { name: '기타', color: 'gray' },
]

export const DEFAULT_INGREDIENT_CATEGORIES: DefaultLabel[] = [
  { name: '유제품', color: 'blue' },
  { name: '과일', color: 'pink' },
  { name: '견과', color: 'yellow' },
  { name: '당류', color: 'yellow' },
  { name: '차', color: 'blue' },
  { name: '기타', color: 'gray' },
]

export const DEFAULT_PACKAGE_UNITS: DefaultLabel[] = [
  { name: '개', color: 'gray' },
  { name: '봉', color: 'gray' },
  { name: '통', color: 'gray' },
]
