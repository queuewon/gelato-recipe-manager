import type { Ingredient, RecipeIngredientDetail } from '../types'

/**
 * 재료 원가 계산
 * 공식: amount(g) × price_per_g
 *
 * 테스트 케이스:
 *   calcIngredientCost(2500, { price_per_g: 2.8,  ... }) === 7000    // 우유 2500g
 *   calcIngredientCost(1000, { price_per_g: 6.0,  ... }) === 6000    // 생크림 1000g
 *   calcIngredientCost(350,  { price_per_g: 38.0, ... }) === 13300   // 피스타치오 350g
 *   calcIngredientCost(0,    { price_per_g: 2.8,  ... }) === 0
 */
export function calcIngredientCost(
  amount: number,
  ingredient: Ingredient,
): number {
  return amount * ingredient.price_per_g
}

/**
 * 총 원가 = 모든 재료 원가 합산
 *
 * 테스트 케이스:
 *   calcTotalCost([]) === 0
 *   calcTotalCost([
 *     { amount: 2500, ingredient: { price_per_g: 2.8,  ... }, ... },  //  7000
 *     { amount: 1000, ingredient: { price_per_g: 6.0,  ... }, ... },  //  6000
 *     { amount: 400,  ingredient: { price_per_g: 2.2,  ... }, ... },  //   880
 *     { amount: 350,  ingredient: { price_per_g: 38.0, ... }, ... },  // 13300
 *   ]) === 27180
 */
export function calcTotalCost(ingredients: RecipeIngredientDetail[]): number {
  return ingredients.reduce(
    (sum, i) => sum + calcIngredientCost(i.amount, i.ingredient),
    0,
  )
}

/**
 * 배치량 변경 시 원가 환산
 * 공식: totalCost × (newBatch / baseBatch)
 *
 * 테스트 케이스:
 *   calcBatchCost(10000, 5000, 10000) === 20000    // 2배 배치
 *   calcBatchCost(10000, 5000, 2500)  === 5000     // 0.5배 배치
 *   calcBatchCost(10000, 5000, 5000)  === 10000    // 동일 배치
 *   calcBatchCost(0,     5000, 10000) === 0
 */
export function calcBatchCost(
  totalCost: number,
  baseBatch: number,
  newBatch: number,
): number {
  return totalCost * (newBatch / baseBatch)
}
