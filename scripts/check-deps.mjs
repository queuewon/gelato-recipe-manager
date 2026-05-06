// scripts/check-deps.mjs
// 동일 누락-의존성 에러 재발 방지용 정적 + 동적 검사
//
// 검사 항목:
//   1) babel.config.js에서 참조하는 preset/plugin 패키지가
//      package.json (dependencies/devDependencies/peerDependencies) 에 선언돼 있는가
//   2) 모든 *.ts/*.tsx/*.js/*.jsx/*.mjs 소스의 외부 import 가
//      package.json 에 선언돼 있는가
//   3) 선언된 모든 의존성이 node_modules 에 실제로 설치돼 있는가
//   4) babel.config.js 의 preset/plugin 체인을 실제로 로드해보고
//      전이적으로 필요한 plugin (예: nativewind → react-native-css-interop →
//      "react-native-worklets/plugin") 까지 모두 resolve 되는가
//
// 실패 시 exit 1 → npm/yarn 의 prestart/postinstall 같은 스크립트 체인을
// 자동으로 끊어주므로 Metro 번들링 단계 전에 즉시 알림.

import { createRequire } from 'node:module'
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

// ---------- 4-5) expo-router 필수 peer dependency 설치 검사 ----------
// expo-router 의 peerDependencies 중 optional 이 아닌 것은 npm이 자동 설치하지 않으므로
// package.json 에 명시적으로 선언 + node_modules 에 설치돼 있어야 한다.
// (expo-linking 누락으로 Metro 500 에러가 발생했던 사례 재발 방지)
const CRITICAL_PEER_HOSTS = ['expo-router']
for (const hostPkg of CRITICAL_PEER_HOSTS) {
  const hostPkgPath = join(ROOT, 'node_modules', hostPkg, 'package.json')
  if (!existsSync(hostPkgPath)) continue
  const hostMeta = JSON.parse(readFileSync(hostPkgPath, 'utf8'))
  const peerDeps = hostMeta.peerDependencies ?? {}
  const optionalMeta = (hostMeta.peerDependenciesMeta ?? {})
  for (const [peer] of Object.entries(peerDeps)) {
    if (optionalMeta[peer]?.optional) continue
    if (!existsSync(join(ROOT, 'node_modules', peer.split('/').slice(0, peer.startsWith('@') ? 2 : 1).join('/'), 'package.json'))) {
      failed = true
      console.error(c.red(`\n[check-deps] ${hostPkg} 의 필수 peer dependency 가 미설치:`))
      console.error('  - ' + c.yel(peer))
      console.error(c.dim(`  (${hostPkg}/package.json peerDependencies 에 선언됨)`))
      console.error('\n' + c.yel('해결:'))
      console.error('  npx expo install ' + peer)
    }
  }
}

// ---------- 4) babel preset/plugin 체인 실제 resolve ----------
// preset 이 내부에서 require/string-reference 로 끌어오는 plugin (예: nativewind →
// react-native-css-interop → "react-native-worklets/plugin") 은 정적 grep 으로
// 잡히지 않는다. @babel/core 로 실제 로드해서 MODULE_NOT_FOUND 를 잡는다.
const babelMissing = new Set()
if (existsSync(join(ROOT, 'node_modules', '@babel', 'core', 'package.json'))) {
  try {
    const requireFromRoot = createRequire(join(ROOT, 'package.json'))
    const babel = requireFromRoot('@babel/core')
    babel.transformSync('const __probe = 1', {
      filename: join(ROOT, '__check-deps-probe__.ts'),
      configFile: existsSync(babelPath) ? babelPath : false,
      babelrc: false,
      presets: [],
      plugins: [],
      // configFile 의 preset 만으로 resolve 검증
    })
  } catch (err) {
    const code = err && err.code
    const msg = (err && err.message) || String(err)
    if (code === 'MODULE_NOT_FOUND' || /Cannot find module/.test(msg)) {
      const m = msg.match(/Cannot find module ['"]([^'"]+)['"]/)
      if (m) babelMissing.add(rootPkg(m[1]))
      else babelMissing.add('(unknown)')
    } else {
      // 다른 babel 에러는 부수효과로 무시 (probe 파일 transform 실패 등)
      // 단, 미설치 module 에러가 아니면 그대로 던져 알린다
      throw err
    }
  }
}
if (babelMissing.size > 0) {
  failed = true
  console.error(c.red('\n[check-deps] babel preset/plugin 체인이 요구하는 미설치 패키지:'))
  for (const m of [...babelMissing].sort()) {
    console.error('  - ' + c.yel(m))
    console.error(c.dim('    (preset/plugin 이 transitive 하게 require)'))
  }
  console.error('\n' + c.yel('해결:'))
  console.error('  npx expo install ' + [...babelMissing].join(' '))
}

if (failed) process.exit(1)
console.log(c.grn('[check-deps] OK') + c.dim(` (의존성 ${declared.size}개, source 참조 ${sourceRefs.size}개, babel resolve OK)`))
