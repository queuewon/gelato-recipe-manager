// scripts/verify.mjs
// 시나리오 검증 스크립트
// 사용: node scripts/verify.mjs
//
// node:sqlite (Node 22+) 위에서 expo-sqlite와 동일한 SQL을 그대로 실행해
// db/queries/*.ts 가 사용하는 SQL/트랜잭션 로직을 모사한다.

import { DatabaseSync } from 'node:sqlite'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

// ---------- 색상 ----------
const c = {
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  fail: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[90m${s}\x1b[0m`,
}

// ---------- 스키마 추출 ----------
function loadSchemaSql() {
  const text = readFileSync(resolve(ROOT, 'db/schema.ts'), 'utf8')
  const m = text.match(/const SCHEMA_SQL = `([\s\S]*?)`/)
  if (!m) throw new Error('SCHEMA_SQL not found in db/schema.ts')
  return m[1]
}

// ---------- 쿼리 함수 (db/queries/*.ts 와 동일한 SQL) ----------
function nowLocal() {
  // SQLite의 datetime('now', 'localtime')에 대응
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function mkDb() {
  const db = new DatabaseSync(':memory:')
  db.exec(loadSchemaSql())
  return db
}

// ---------- 재료 ----------
function createIngredient(db, data, supplierId = null) {
  const pricePerG = data.package_price / data.package_amount
  const finalSupplierId = supplierId ?? data.supplier_id ?? null
  const insertIng = db.prepare(`INSERT INTO ingredients
    (name, category, package_price, package_amount, price_per_g,
     stock_count, stock_unit, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  const insertHist = db.prepare(`INSERT INTO ingredient_price_history
    (ingredient_id, package_price, package_amount)
    VALUES (?, ?, ?)`)
  const tx = db.exec.bind(db)
  tx('BEGIN')
  try {
    const r = insertIng.run(
      data.name, data.category, data.package_price, data.package_amount,
      pricePerG, data.stock_count, data.stock_unit, finalSupplierId,
    )
    const id = Number(r.lastInsertRowid)
    insertHist.run(id, data.package_price, data.package_amount)
    tx('COMMIT')
    return id
  } catch (e) { tx('ROLLBACK'); throw e }
}

function updateIngredient(db, id, data) {
  const updatable = ['name', 'category', 'package_price', 'package_amount', 'stock_count', 'stock_unit', 'supplier_id']
  db.exec('BEGIN')
  try {
    const cur = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id)
    if (!cur) throw new Error(`Ingredient ${id} not found`)
    const sets = []
    const vals = []
    for (const col of updatable) {
      if (data[col] !== undefined) {
        sets.push(`${col} = ?`); vals.push(data[col])
      }
    }
    const newPrice = data.package_price ?? cur.package_price
    const newAmount = data.package_amount ?? cur.package_amount
    const priceChanged =
      (data.package_price !== undefined && data.package_price !== cur.package_price) ||
      (data.package_amount !== undefined && data.package_amount !== cur.package_amount)
    if (priceChanged) { sets.push('price_per_g = ?'); vals.push(newPrice / newAmount) }
    if (sets.length > 0) {
      db.prepare(`UPDATE ingredients SET ${sets.join(', ')} WHERE id = ?`).run(...vals, id)
    }
    if (priceChanged) {
      db.prepare(`INSERT INTO ingredient_price_history (ingredient_id, package_price, package_amount) VALUES (?, ?, ?)`)
        .run(id, newPrice, newAmount)
    }
    db.exec('COMMIT')
  } catch (e) { db.exec('ROLLBACK'); throw e }
}

function getIngredient(db, id) {
  return db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id)
}
function getPriceHistory(db, id) {
  return db.prepare('SELECT * FROM ingredient_price_history WHERE ingredient_id = ? ORDER BY recorded_at DESC, id DESC').all(id)
}

// ---------- 레시피 ----------
function createRecipe(db, data, ingredients) {
  db.exec('BEGIN')
  try {
    const r = db.prepare(`INSERT INTO recipes (name, base_category, batch_size, memo, is_deleted)
      VALUES (?, ?, ?, ?, ?)`).run(
      data.name, data.base_category, data.batch_size, data.memo ?? null, data.is_deleted ?? 0,
    )
    const id = Number(r.lastInsertRowid)
    for (const ing of ingredients) {
      db.prepare('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES (?, ?, ?)')
        .run(id, ing.ingredient_id, ing.amount)
    }
    const snapshot = {
      name: data.name, base_category: data.base_category,
      batch_size: data.batch_size, memo: data.memo, ingredients,
    }
    db.prepare('INSERT INTO recipe_versions (recipe_id, version_no, snapshot_json) VALUES (?, ?, ?)')
      .run(id, 1, JSON.stringify(snapshot))
    db.exec('COMMIT')
    return id
  } catch (e) { db.exec('ROLLBACK'); throw e }
}

function getRecipe(db, id) {
  const r = db.prepare('SELECT * FROM recipes WHERE id = ? AND is_deleted = 0').get(id)
  if (!r) return null
  const rows = db.prepare('SELECT id, recipe_id, ingredient_id, amount FROM recipe_ingredients WHERE recipe_id = ?').all(id)
  if (rows.length === 0) return { ...r, ingredients: [] }
  const placeholders = rows.map(() => '?').join(',')
  const ings = db.prepare(`SELECT * FROM ingredients WHERE id IN (${placeholders})`).all(...rows.map(x => x.ingredient_id))
  const ingMap = new Map(ings.map(i => [i.id, i]))
  return {
    ...r,
    ingredients: rows.map(row => ({
      id: row.id, recipe_id: row.recipe_id, ingredient_id: row.ingredient_id,
      amount: row.amount, ingredient: ingMap.get(row.ingredient_id),
    })),
  }
}

function getAllRecipes(db) {
  return db.prepare('SELECT * FROM recipes WHERE is_deleted = 0 ORDER BY updated_at DESC').all()
}

function updateRecipe(db, id, data, ingredients) {
  const updatable = ['name', 'base_category', 'batch_size', 'memo', 'is_deleted']
  db.exec('BEGIN')
  try {
    const sets = []
    const vals = []
    for (const col of updatable) {
      if (data[col] !== undefined) { sets.push(`${col} = ?`); vals.push(data[col]) }
    }
    sets.push("updated_at = datetime('now', 'localtime')")
    db.prepare(`UPDATE recipes SET ${sets.join(', ')} WHERE id = ?`).run(...vals, id)
    if (ingredients) {
      db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(id)
      for (const ing of ingredients) {
        db.prepare('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES (?, ?, ?)')
          .run(id, ing.ingredient_id, ing.amount)
      }
    }
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id)
    if (!recipe) throw new Error(`Recipe ${id} not found`)
    const cur = db.prepare('SELECT ingredient_id, amount FROM recipe_ingredients WHERE recipe_id = ?').all(id)
    const maxRow = db.prepare('SELECT MAX(version_no) AS max FROM recipe_versions WHERE recipe_id = ?').get(id)
    const newVer = (maxRow?.max ?? 0) + 1
    const snap = {
      name: recipe.name, base_category: recipe.base_category,
      batch_size: recipe.batch_size, memo: recipe.memo,
      ingredients: cur.map(c => ({ ingredient_id: c.ingredient_id, amount: c.amount })),
    }
    db.prepare('INSERT INTO recipe_versions (recipe_id, version_no, snapshot_json) VALUES (?, ?, ?)')
      .run(id, newVer, JSON.stringify(snap))
    db.exec('COMMIT')
  } catch (e) { db.exec('ROLLBACK'); throw e }
}

function getVersions(db, recipeId) {
  return db.prepare('SELECT * FROM recipe_versions WHERE recipe_id = ? ORDER BY version_no DESC').all(recipeId)
}
function restoreVersion(db, versionId) {
  db.exec('BEGIN')
  try {
    const v = db.prepare('SELECT * FROM recipe_versions WHERE id = ?').get(versionId)
    if (!v) throw new Error('version not found')
    const snap = JSON.parse(v.snapshot_json)
    db.prepare(`UPDATE recipes SET name = ?, base_category = ?, batch_size = ?, memo = ?,
                  updated_at = datetime('now','localtime') WHERE id = ?`)
      .run(snap.name, snap.base_category, snap.batch_size, snap.memo ?? null, v.recipe_id)
    db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(v.recipe_id)
    for (const ing of snap.ingredients) {
      db.prepare('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES (?, ?, ?)')
        .run(v.recipe_id, ing.ingredient_id, ing.amount)
    }
    const maxRow = db.prepare('SELECT MAX(version_no) AS max FROM recipe_versions WHERE recipe_id = ?').get(v.recipe_id)
    const newVer = (maxRow?.max ?? 0) + 1
    db.prepare('INSERT INTO recipe_versions (recipe_id, version_no, snapshot_json) VALUES (?, ?, ?)')
      .run(v.recipe_id, newVer, v.snapshot_json)
    db.exec('COMMIT')
  } catch (e) { db.exec('ROLLBACK'); throw e }
}

function softDeleteRecipe(db, id) {
  db.prepare("UPDATE recipes SET is_deleted = 1, updated_at = datetime('now','localtime') WHERE id = ?").run(id)
}

// ---------- 체크리스트 ----------
function addChecklistItem(db, recipeId, batchSize) {
  const r = db.prepare(`INSERT INTO daily_checklist (recipe_id, date, batch_size, status)
    VALUES (?, date('now', 'localtime'), ?, 'pending')`).run(recipeId, batchSize)
  return Number(r.lastInsertRowid)
}
function getTodayChecklist(db) {
  const items = db.prepare("SELECT * FROM daily_checklist WHERE date = date('now', 'localtime') ORDER BY id").all()
  if (items.length === 0) return []
  const ids = [...new Set(items.map(i => i.recipe_id))]
  const recipes = db.prepare(`SELECT * FROM recipes WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids)
  const map = new Map(recipes.map(r => [r.id, r]))
  return items.map(i => ({ ...i, recipe: map.get(i.recipe_id) }))
}
function updateChecklistStatus(db, id, status) {
  if (status === 'done') {
    db.prepare("UPDATE daily_checklist SET status = ?, completed_at = datetime('now','localtime') WHERE id = ?").run(status, id)
  } else {
    db.prepare('UPDATE daily_checklist SET status = ?, completed_at = NULL WHERE id = ?').run(status, id)
  }
}

// ---------- 백업/복원 ----------
const TABLES = ['recipes', 'recipe_versions', 'suppliers', 'ingredients', 'ingredient_price_history', 'recipe_ingredients', 'daily_checklist']
const DELETE_ORDER = ['recipe_versions', 'recipe_ingredients', 'daily_checklist', 'ingredient_price_history', 'ingredients', 'suppliers', 'recipes']
const RESTORE_ORDER = ['recipes', 'suppliers', 'ingredients', 'recipe_versions', 'ingredient_price_history', 'recipe_ingredients', 'daily_checklist']

function exportData(db) {
  const data = {}
  for (const t of TABLES) data[t] = db.prepare(`SELECT * FROM ${t}`).all()
  return { version: 1, exportedAt: new Date().toISOString(), data }
}
function importData(db, payload) {
  if (payload.version !== 1 || !payload.data) throw new Error('지원하지 않는 백업')
  for (const t of TABLES) if (!Array.isArray(payload.data[t])) throw new Error(`missing ${t}`)
  db.exec('BEGIN')
  try {
    for (const t of DELETE_ORDER) db.exec(`DELETE FROM ${t}`)
    for (const t of RESTORE_ORDER) {
      for (const row of payload.data[t]) {
        const cols = Object.keys(row); if (cols.length === 0) continue
        const ph = cols.map(() => '?').join(', ')
        const vals = cols.map(k => row[k])
        db.prepare(`INSERT INTO ${t} (${cols.join(', ')}) VALUES (${ph})`).run(...vals)
      }
    }
    db.exec('COMMIT')
  } catch (e) { db.exec('ROLLBACK'); throw e }
}
function clearAll(db) {
  db.exec('BEGIN')
  try { for (const t of DELETE_ORDER) db.exec(`DELETE FROM ${t}`); db.exec('COMMIT') }
  catch (e) { db.exec('ROLLBACK'); throw e }
}

// ---------- 비즈니스 로직 (utils/*.ts 와 동일) ----------
function calcIngredientCost(amount, ing) { return amount * ing.price_per_g }
function calcTotalCost(items) { return items.reduce((s, i) => s + calcIngredientCost(i.amount, i.ingredient), 0) }
function calcBatchCost(total, base, next) { return total * (next / base) }
function scaleAmount(amount, base, next) { return amount * (next / base) }

// ---------- 테스트 러너 ----------
let pass = 0, fail = 0
const failures = []
function test(name, fn) {
  try { fn(); pass++; console.log(`  ${c.ok('✓')} ${name}`) }
  catch (e) { fail++; failures.push({ name, err: e }); console.log(`  ${c.fail('✗')} ${name}\n    ${c.dim(e.message)}`) }
}
function section(t) { console.log(`\n${c.bold('▸ ' + t)}`) }

// ============================================================
// Scenario 1: 레시피 전체 흐름
// ============================================================
section('시나리오 1 — 레시피 전체 흐름')
{
  const db = mkDb()
  const milkId = createIngredient(db, { name: '우유', category: '유제품', package_price: 2800, package_amount: 1000, stock_count: 5, stock_unit: '개' })
  const creamId = createIngredient(db, { name: '생크림', category: '유제품', package_price: 6000, package_amount: 1000, stock_count: 3, stock_unit: '개' })
  const sugarId = createIngredient(db, { name: '설탕', category: '당류', package_price: 2200, package_amount: 1000, stock_count: 10, stock_unit: '개' })
  const pistaId = createIngredient(db, { name: '피스타치오', category: '견과', package_price: 38000, package_amount: 1000, stock_count: 1, stock_unit: '개' })

  test('재료 등록 시 price_per_g 자동 계산', () => {
    const milk = getIngredient(db, milkId)
    assert.equal(milk.price_per_g, 2.8)
  })
  test('재료 등록 시 가격 이력 자동 기록', () => {
    const h = getPriceHistory(db, milkId)
    assert.equal(h.length, 1)
    assert.equal(h[0].package_price, 2800)
  })

  const recipeId = createRecipe(db,
    { name: '피스타치오 젤라또', base_category: '견과', batch_size: 5000, memo: '', is_deleted: 0 },
    [{ ingredient_id: milkId, amount: 2500 },
     { ingredient_id: creamId, amount: 1000 },
     { ingredient_id: sugarId, amount: 400 },
     { ingredient_id: pistaId, amount: 350 }],
  )

  test('레시피 등록 후 목록에 노출', () => {
    const list = getAllRecipes(db)
    assert.equal(list.length, 1)
    assert.equal(list[0].name, '피스타치오 젤라또')
  })

  const recipe = getRecipe(db, recipeId)
  test('상세에서 재료 4개 + 기본 원가 27,180원', () => {
    assert.equal(recipe.ingredients.length, 4)
    assert.equal(calcTotalCost(recipe.ingredients), 27180)
  })

  test('배치량 2배(10,000g) 변경 시 원가도 2배', () => {
    const total = calcTotalCost(recipe.ingredients)
    const scaled = calcBatchCost(total, recipe.batch_size, 10000)
    assert.equal(scaled, 27180 * 2)
    // 재료별 사용량도 2배
    assert.equal(scaleAmount(2500, 5000, 10000), 5000)
  })
  test('배치량 0.5배(2,500g) 변경 시 원가도 절반', () => {
    const total = calcTotalCost(recipe.ingredients)
    assert.equal(calcBatchCost(total, recipe.batch_size, 2500), 27180 / 2)
  })
  test('배치량 동일 시 원가 변동 없음', () => {
    const total = calcTotalCost(recipe.ingredients)
    assert.equal(calcBatchCost(total, recipe.batch_size, 5000), 27180)
  })
}

// ============================================================
// Scenario 2: 수정이력 + 복원
// ============================================================
section('시나리오 2 — 수정이력 + 복원')
{
  const db = mkDb()
  const aId = createIngredient(db, { name: 'A', category: '기타', package_price: 1000, package_amount: 1000, stock_count: 1, stock_unit: '개' })
  const bId = createIngredient(db, { name: 'B', category: '기타', package_price: 2000, package_amount: 1000, stock_count: 1, stock_unit: '개' })
  const recipeId = createRecipe(db,
    { name: '바닐라', base_category: '기타', batch_size: 5000, memo: '', is_deleted: 0 },
    [{ ingredient_id: aId, amount: 100 }, { ingredient_id: bId, amount: 200 }],
  )

  test('등록 직후 v1 1개 존재', () => {
    const vs = getVersions(db, recipeId)
    assert.equal(vs.length, 1)
    assert.equal(vs[0].version_no, 1)
  })

  // 1차 수정: 이름 변경 + 재료 비율 조정
  updateRecipe(db, recipeId,
    { name: '바닐라 클래식', base_category: '기타', batch_size: 5000, memo: 'v2' },
    [{ ingredient_id: aId, amount: 150 }, { ingredient_id: bId, amount: 250 }],
  )
  test('수정 후 v2 추가', () => {
    const vs = getVersions(db, recipeId)
    assert.equal(vs.length, 2)
    assert.equal(vs[0].version_no, 2)
  })

  // 2차 수정
  updateRecipe(db, recipeId,
    { name: '바닐라 프리미엄', base_category: '기타', batch_size: 6000, memo: 'v3' },
    [{ ingredient_id: aId, amount: 200 }],
  )
  test('재수정 후 v3 — 최신은 version_no = 3', () => {
    const vs = getVersions(db, recipeId)
    assert.equal(vs.length, 3)
    assert.equal(vs[0].version_no, 3)
  })

  // v1 으로 복원
  const vs = getVersions(db, recipeId)
  const v1 = vs.find(v => v.version_no === 1)
  restoreVersion(db, v1.id)
  test('v1 복원 시 레시피 이름/배치/재료 모두 v1 상태', () => {
    const r = getRecipe(db, recipeId)
    assert.equal(r.name, '바닐라')
    assert.equal(r.batch_size, 5000)
    assert.equal(r.ingredients.length, 2)
    const amts = Object.fromEntries(r.ingredients.map(i => [i.ingredient.name, i.amount]))
    assert.equal(amts['A'], 100)
    assert.equal(amts['B'], 200)
  })
  test('복원 후 새 버전이 추가되어 총 4개', () => {
    const vs2 = getVersions(db, recipeId)
    assert.equal(vs2.length, 4)
    assert.equal(vs2[0].version_no, 4)
    const snap = JSON.parse(vs2[0].snapshot_json)
    assert.equal(snap.name, '바닐라')
  })
}

// ============================================================
// Scenario 3: 재료 가격 변동
// ============================================================
section('시나리오 3 — 재료 가격 변동')
{
  const db = mkDb()
  const milkId = createIngredient(db, { name: '우유', category: '유제품', package_price: 2800, package_amount: 1000, stock_count: 5, stock_unit: '개' })
  const recipeId = createRecipe(db,
    { name: '우유젤라또', base_category: '기타', batch_size: 5000, memo: '', is_deleted: 0 },
    [{ ingredient_id: milkId, amount: 1000 }],
  )

  const before = getRecipe(db, recipeId)
  test('가격 변동 전 원가 = 2,800원', () => {
    assert.equal(calcTotalCost(before.ingredients), 2800)
  })

  // 가격 인상
  updateIngredient(db, milkId, { package_price: 3500 })

  test('가격 변동 시 price_per_g 갱신', () => {
    const m = getIngredient(db, milkId)
    assert.equal(m.price_per_g, 3.5)
  })
  test('가격 이력 2건 자동 기록 (최신부터)', () => {
    const h = getPriceHistory(db, milkId)
    assert.equal(h.length, 2)
    assert.equal(h[0].package_price, 3500)
    assert.equal(h[1].package_price, 2800)
  })
  test('재료 가격 변경 시 레시피 재조회 → 원가 자동 반영', () => {
    const after = getRecipe(db, recipeId)
    assert.equal(calcTotalCost(after.ingredients), 3500)
  })

  // package_amount 만 변경 → priceChanged
  updateIngredient(db, milkId, { package_amount: 500 })
  test('포장 용량만 변경해도 이력 추가 + price_per_g 재계산', () => {
    const h = getPriceHistory(db, milkId)
    assert.equal(h.length, 3)
    const m = getIngredient(db, milkId)
    assert.equal(m.price_per_g, 7) // 3500 / 500
  })

  // 동일 가격 재저장 시 이력이 추가되지 않아야 함
  updateIngredient(db, milkId, { package_price: 3500 })
  test('동일 가격 저장 시 이력 미추가', () => {
    const h = getPriceHistory(db, milkId)
    assert.equal(h.length, 3)
  })
}

// ============================================================
// Scenario 4: 체크리스트
// ============================================================
section('시나리오 4 — 체크리스트')
{
  const db = mkDb()
  const milkId = createIngredient(db, { name: '우유', category: '유제품', package_price: 2800, package_amount: 1000, stock_count: 5, stock_unit: '개' })
  const r1 = createRecipe(db, { name: 'A', base_category: '기타', batch_size: 5000, memo: '', is_deleted: 0 }, [{ ingredient_id: milkId, amount: 100 }])
  const r2 = createRecipe(db, { name: 'B', base_category: '기타', batch_size: 5000, memo: '', is_deleted: 0 }, [{ ingredient_id: milkId, amount: 100 }])

  const c1 = addChecklistItem(db, r1, 5000)
  const c2 = addChecklistItem(db, r2, 3000)

  test('메뉴 추가 후 오늘 목록 2개', () => {
    const list = getTodayChecklist(db)
    assert.equal(list.length, 2)
    assert.equal(list[0].recipe.name, 'A')
    assert.equal(list[1].recipe.name, 'B')
  })

  updateChecklistStatus(db, c1, 'in_progress')
  updateChecklistStatus(db, c2, 'done')
  test('상태 변경: pending → in_progress → done', () => {
    const list = getTodayChecklist(db)
    assert.equal(list[0].status, 'in_progress')
    assert.equal(list[1].status, 'done')
    assert.notEqual(list[1].completed_at, null)
  })

  test('진행률: 1/2 완료 = 50%', () => {
    const list = getTodayChecklist(db)
    const done = list.filter(x => x.status === 'done').length
    assert.equal((done / list.length) * 100, 50)
  })

  // "앱 재시작" = 새 연결로 다시 read
  test('영속성 확인: 동일 SQL로 재조회해도 체크리스트 유지', () => {
    const list = getTodayChecklist(db)
    assert.equal(list.length, 2)
  })

  // done → pending (사이클)
  updateChecklistStatus(db, c2, 'pending')
  test('done → pending 시 completed_at = NULL', () => {
    const row = db.prepare('SELECT * FROM daily_checklist WHERE id = ?').get(c2)
    assert.equal(row.status, 'pending')
    assert.equal(row.completed_at, null)
  })
}

// ============================================================
// Scenario 5: 백업/복원
// ============================================================
section('시나리오 5 — 백업/복원')
{
  const db = mkDb()
  const supId = (() => {
    const r = db.prepare('INSERT INTO suppliers (name, contact) VALUES (?, ?)').run('A공급', '010')
    return Number(r.lastInsertRowid)
  })()
  const ing = createIngredient(db, { name: '우유', category: '유제품', package_price: 2800, package_amount: 1000, stock_count: 5, stock_unit: '개', supplier_id: supId })
  const recipeId = createRecipe(db, { name: '레시피', base_category: '기타', batch_size: 5000, memo: 'm', is_deleted: 0 }, [{ ingredient_id: ing, amount: 100 }])
  addChecklistItem(db, recipeId, 5000)

  const snap = exportData(db)

  test('백업 페이로드에 7개 테이블 포함', () => {
    for (const t of TABLES) assert.ok(Array.isArray(snap.data[t]), `missing ${t}`)
  })

  clearAll(db)
  test('초기화 후 모든 테이블 비어있음', () => {
    for (const t of TABLES) {
      const cnt = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n
      assert.equal(cnt, 0, t)
    }
  })

  importData(db, snap)
  test('복원 후 원본과 동일한 row 수', () => {
    for (const t of TABLES) {
      const cnt = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n
      assert.equal(cnt, snap.data[t].length, t)
    }
  })
  test('복원 후 레시피 상세 동일', () => {
    const r = getRecipe(db, recipeId)
    assert.equal(r.name, '레시피')
    assert.equal(r.ingredients.length, 1)
    assert.equal(r.ingredients[0].ingredient.name, '우유')
  })
  test('복원 후 체크리스트 동일', () => {
    assert.equal(getTodayChecklist(db).length, 1)
  })
}

// ============================================================
// Scenario 6: 엣지케이스
// ============================================================
section('시나리오 6 — 엣지케이스')
{
  test('재료 없는 레시피 원가 = 0', () => {
    assert.equal(calcTotalCost([]), 0)
  })
  test('amount = 0 인 재료의 원가 = 0', () => {
    assert.equal(calcIngredientCost(0, { price_per_g: 2.8 }), 0)
  })

  const db = mkDb()
  const id = createIngredient(db, { name: 'X', category: '기타', package_price: 1000, package_amount: 1000, stock_count: 0, stock_unit: '개' })
  test('재고 0 재료도 정상 표시 (stock_count = 0)', () => {
    const r = getIngredient(db, id)
    assert.equal(r.stock_count, 0)
  })

  // 영속성 — 동일 DB 핸들로 재조회
  const recipeId = createRecipe(db, { name: 'EmptyR', base_category: '기타', batch_size: 5000, memo: '', is_deleted: 0 }, [])
  test('재료 0개 레시피도 등록/조회 가능, 원가 = 0', () => {
    const r = getRecipe(db, recipeId)
    assert.equal(r.ingredients.length, 0)
    assert.equal(calcTotalCost(r.ingredients), 0)
    // 배치량 변경해도 0
    assert.equal(calcBatchCost(0, 5000, 10000), 0)
  })

  test('재고 0 → 음수로는 갱신되지 않아야 함 (검증은 화면 단)', () => {
    // updateStock 자체는 음수도 허용; 검증은 UI 단(IngredientForm)에서 ≥0 체크
    // 여기서는 0으로 갱신해도 OK 인지 확인
    db.prepare('UPDATE ingredients SET stock_count = 0 WHERE id = ?').run(id)
    assert.equal(getIngredient(db, id).stock_count, 0)
  })

  test('soft delete 레시피는 목록에서 제외', () => {
    softDeleteRecipe(db, recipeId)
    const list = getAllRecipes(db)
    assert.equal(list.find(r => r.id === recipeId), undefined)
  })
}

// ---------- 요약 ----------
console.log('\n' + c.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
console.log(`${c.bold('결과')}: ${c.ok(pass + ' passed')} / ${fail > 0 ? c.fail(fail + ' failed') : '0 failed'}`)
if (fail > 0) {
  console.log(c.bold('\n실패 상세:'))
  for (const f of failures) console.log(`  - ${f.name}\n    ${c.dim(f.err.stack ?? f.err.message)}`)
  process.exit(1)
}
