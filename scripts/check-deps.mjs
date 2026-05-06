// scripts/check-deps.mjs
// 동일 누락-의존성 에러 재발 방지용 정적 검사
//
// 검사 항목:
//   1) babel.config.js에서 참조하는 preset/plugin 패키지가
//      package.json (dependencies/devDependencies/peerDependencies) 에 선언돼 있는가
//   2) 모든 *.ts/*.tsx/*.js/*.jsx/*.mjs 소스의 외부 import 가
//      package.json 에 선언돼 있는가
//   3) 선언된 모든 의존성이 node_modules 에 실제로 설치돼 있는가
//
// 실패 시 exit 1 → npm/yarn 의 prestart/postinstall 같은 스크립트 체인을
// 자동으로 끊어주므로 Metro 번들링 단계 전에 즉시 알림.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yel: (s) => `\x1b[33m${s}\x1b[0m`,
  grn: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[90m${s}\x1b[0m`,
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
])

function isExternal(spec) {
  if (!spec) return false
  if (spec.startsWith('.') || spec.startsWith('/')) return false
  if (spec.startsWith('node:')) return false
  return true
}

function rootPkg(spec) {
  // '@scope/name/sub' → '@scope/name'
  // 'name/sub'        → 'name'
  const parts = spec.split('/')
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

// ---------- 1) babel.config.js ----------
const babelRefs = new Set()
const babelPath = join(ROOT, 'babel.config.js')
if (existsSync(babelPath)) {
  const text = readFileSync(babelPath, 'utf8')
  // string literal 중 패키지명 형태만 추출 (영문/숫자/-/_/@//. 만 허용)
  for (const m of text.matchAll(/['"`]([@A-Za-z0-9][\w@/.-]*)['"`]/g)) {
    const v = m[1]
    if (!isExternal(v)) continue
    if (v.includes('.') && !v.startsWith('@')) continue // 옵션값(.css 등) 배제
    if (v === 'transform' || v === 'env' || v === 'production') continue
    babelRefs.add(rootPkg(v))
  }
}

// ---------- 2) 소스 import ----------
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.expo', 'android', 'ios', 'build', 'dist', 'scripts',
])
function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e)) continue
    const p = join(dir, e)
    const s = statSync(p)
    if (s.isDirectory()) walk(p, acc)
    else if (/\.(ts|tsx|mjs|js|jsx)$/.test(e)) acc.push(p)
  }
  return acc
}
const files = walk(ROOT)

const sourceRefs = new Set()
const refLocations = new Map() // pkg → [files]
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  // import ... from 'x'  /  import 'x'  /  require('x')  /  import('x')
  const patterns = [
    /(?:^|\s)import\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const spec = m[1]
      if (!isExternal(spec)) continue
      const root = rootPkg(spec)
      sourceRefs.add(root)
      if (!refLocations.has(root)) refLocations.set(root, [])
      refLocations.get(root).push(f.replace(ROOT + '/', ''))
    }
  }
}

// ---------- 3) 누락 검사 ----------
const allRefs = new Set([...babelRefs, ...sourceRefs])
const missing = []
for (const ref of allRefs) {
  if (!declared.has(ref)) missing.push(ref)
}

const notInstalled = []
for (const ref of declared) {
  if (!existsSync(join(ROOT, 'node_modules', ref, 'package.json'))) {
    notInstalled.push(ref)
  }
}

let failed = false
if (missing.length > 0) {
  failed = true
  console.error(c.red('\n[check-deps] package.json 에 선언되지 않은 외부 의존성:'))
  for (const m of missing.sort()) {
    console.error('  - ' + c.yel(m))
    if (babelRefs.has(m)) console.error(c.dim('    (babel.config.js 에서 참조)'))
    const locs = refLocations.get(m)
    if (locs) {
      for (const loc of locs.slice(0, 3)) console.error(c.dim('    ' + loc))
      if (locs.length > 3) console.error(c.dim(`    ... 외 ${locs.length - 3}개 파일`))
    }
  }
  console.error('\n' + c.yel('해결:'))
  console.error('  npx expo install ' + missing.join(' '))
}

if (notInstalled.length > 0) {
  failed = true
  console.error(c.red('\n[check-deps] 선언됐지만 node_modules 에 미설치:'))
  for (const n of notInstalled.sort()) console.error('  - ' + c.yel(n))
  console.error('\n' + c.yel('해결:'))
  console.error('  npm install --legacy-peer-deps')
}

if (failed) process.exit(1)
console.log(c.grn('[check-deps] OK') + c.dim(` (의존성 ${declared.size}개, source 참조 ${sourceRefs.size}개)`))
