import type { BaseCategory, IngredientCategory } from '../types'

export const BASE_CATEGORIES: readonly BaseCategory[] = [
  '과일',
  '차',
  '곡물',
  '견과',
  '술',
  '초콜릿',
  '기타',
] as const

export const INGREDIENT_CATEGORIES: readonly IngredientCategory[] = [
  '유제품',
  '과일',
  '견과',
  '당류',
  '차',
  '기타',
] as const
