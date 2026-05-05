import type { RecipeIngredientDetail } from '../types'

/**
 * 사용량 환산
 * 공식: amount × (newBatch / baseBatch)
 *
 * 테스트 케이스:
 *   scaleAmount(2500, 5000, 10000) === 5000   // 2배
 *   scaleAmount(2500, 5000, 5000)  === 2500   // 동일
 *   scaleAmount(2500, 5000, 2500)  === 1250   // 0.5배
 *   scaleAmount(0,    5000, 10000) === 0
 */
export function scaleAmount(
  amount: number,
  baseBatch: number,
  newBatch: number,
): number {
  return amount * (newBatch / baseBatch)
}

/**
 * 재료 목록 일괄 환산 (amount만 갱신, 나머지 필드는 그대로 복사)
 * 입력 배열은 변경하지 않음 (immutable).
 *
 * 테스트 케이스:
 *   scaleIngredients(
 *     [
 *       { id: 1, recipe_id: 1, ingredient_id: 1, amount: 2500, ingredient: ... },
 *       { id: 2, recipe_id: 1, ingredient_id: 2, amount: 1000, ingredient: ... },
 *     ],
 *     5000, 10000,
 *   ) === [
 *     { id: 1, recipe_id: 1, ingredient_id: 1, amount: 5000, ingredient: ... },
 *     { id: 2, recipe_id: 1, ingredient_id: 2, amount: 2000, ingredient: ... },
 *   ]
 */
export function scaleIngredients(
  ingredients: RecipeIngredientDetail[],
  baseBatch: number,
  newBatch: number,
): RecipeIngredientDetail[] {
  return ingredients.map((i) => ({
    ...i,
    amount: scaleAmount(i.amount, baseBatch, newBatch),
  }))
}
