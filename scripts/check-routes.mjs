// scripts/check-routes.mjs
// 동일 라우트 불일치 에러 재발 방지용 정적 검사
//
// 검사 항목:
//   모든 app/**/_layout.tsx 파일에서 <Tabs.Screen name="X">,
//   <Stack.Screen name="X"> 으로 선언된 X 가 같은 디렉토리 안에서
//   실제 라우트 (파일 또는 _layout.tsx 가 있는 하위 폴더) 로 존재하는가
//
//   expo-router 는 _layout.tsx 가 없는 하위 폴더의 파일들을 개별 라우트
//   세그먼트 ("foo/index", "foo/[id]") 로 평탄화한다. 따라서 부모 layout
//   에서 "foo" 단일 이름으로 참조하려면 foo/_layout.tsx 가 필요하다.
//
//   실패 시 exit 1.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const APP_DIR = join(ROOT, 'app')

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yel: (s) => `\x1b[33m${s}\x1b[0m`,
  grn: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[90m${s}\x1b[0m`,
}

if (!existsSync(APP_DIR)) {
  console.log(c.dim('[check-routes] app/ 디렉토리 없음 — skip'))
  process.exit(0)
}

function findLayouts(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.expo') continue
    const p = join(dir, e)
    const s = statSync(p)
    if (s.isDirectory()) findLayouts(p, acc)
    else if (e === '_layout.tsx' || e === '_layout.ts') acc.push(p)
  }
  return acc
}

// 같은 디렉토리 안에서 라우트 이름 X 가 실재하는가
//   "index"      → index.tsx 또는 index.ts
//   "foo"        → foo.tsx, foo.ts, 또는 foo/ 폴더 (foo/_layout 또는 foo/index 존재)
//   "foo/bar"    → foo/bar.tsx 또는 foo/bar/ 폴더
//   "foo/[id]"   → foo/[id].tsx 또는 foo/[id]/
//   "(group)"    → (group)/ 폴더 (route group)
function hasRoute(layoutDir, name) {
  // expo-router 는 /로 구분된 다층 이름도 허용
  const parts = name.split('/')
  let cur = layoutDir
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const isLast = i === parts.length - 1
    if (isLast) {
      // 파일 또는 폴더 어느 쪽이든 OK
      const fileTsx = join(cur, part + '.tsx')
      const fileTs = join(cur, part + '.ts')
      const folder = join(cur, part)
      if (existsSync(fileTsx) || existsSync(fileTs)) return true
      if (existsSync(folder) && statSync(folder).isDirectory()) {
        // 폴더가 있어도 비어있거나 layout/index 없으면 invalid
        const hasLayout =
          existsSync(join(folder, '_layout.tsx')) ||
          existsSync(join(folder, '_layout.ts'))
        const hasIndex =
          existsSync(join(folder, 'index.tsx')) ||
          existsSync(join(folder, 'index.ts'))
        const hasAnyTsx = readdirSync(folder).some((f) => /\.tsx?$/.test(f))
        return hasLayout || hasIndex || hasAnyTsx
      }
      return false
    } else {
      const folder = join(cur, part)
      if (!existsSync(folder) || !statSync(folder).isDirectory()) return false
      cur = folder
    }
  }
  return false
}

// <Tabs.Screen name="X">, <Stack.Screen name="X"> 를 정규식으로 추출
function extractScreenNames(text) {
  const names = []
  const re =
    /<\s*(?:Tabs|Stack|Drawer)\.Screen\b[^>]*\bname\s*=\s*["'`]([^"'`]+)["'`]/g
  for (const m of text.matchAll(re)) names.push(m[1])
  return names
}

// 부모 layout 이 Tabs 인 경우, 자식 폴더 (예: recipes/) 가 단일 탭으로 묶이려면
// 해당 폴더에 _layout.tsx 가 필요하다. 누락되면 "recipes/index", "recipes/[id]"
// 가 모두 별개 세그먼트가 돼서 Tabs.Screen name="recipes" 매칭 실패.
function detectTabsLayoutFolderIssues(layoutPath, text) {
  const issues = []
  if (!/\bTabs\b/.test(text)) return issues
  const names = extractScreenNames(text)
  const dir = dirname(layoutPath)
  for (const name of names) {
    if (name.includes('/')) continue
    if (name === 'index') continue
    if (name.startsWith('(') && name.endsWith(')')) continue
    const folder = join(dir, name)
    if (existsSync(folder) && statSync(folder).isDirectory()) {
      const hasInnerLayout =
        existsSync(join(folder, '_layout.tsx')) ||
        existsSync(join(folder, '_layout.ts'))
      if (!hasInnerLayout) {
        issues.push({ name, folder })
      }
    }
  }
  return issues
}

const layouts = findLayouts(APP_DIR)
let failed = false

for (const layoutPath of layouts) {
  const rel = layoutPath.replace(ROOT + '/', '')
  const text = readFileSync(layoutPath, 'utf8')
  const names = extractScreenNames(text)
  const dir = dirname(layoutPath)

  const missing = []
  for (const name of names) {
    if (!hasRoute(dir, name)) missing.push(name)
  }
  if (missing.length > 0) {
    failed = true
    console.error(c.red(`\n[check-routes] ${rel}: 존재하지 않는 라우트 이름:`))
    for (const n of missing) console.error('  - ' + c.yel(`name="${n}"`))
  }

  const folderIssues = detectTabsLayoutFolderIssues(layoutPath, text)
  if (folderIssues.length > 0) {
    failed = true
    console.error(
      c.red(
        `\n[check-routes] ${rel}: Tabs.Screen 이 폴더를 단일 탭으로 참조하지만 _layout.tsx 가 없음:`,
      ),
    )
    for (const it of folderIssues) {
      console.error(
        '  - ' +
          c.yel(`name="${it.name}"`) +
          c.dim(` → ${it.folder.replace(ROOT + '/', '')}/_layout.tsx 누락`),
      )
    }
    console.error('\n' + c.yel('해결:'))
    console.error(
      c.dim('  각 폴더에 다음 내용으로 _layout.tsx 생성:\n') +
        c.dim(
          "    import { Stack } from 'expo-router'\n" +
            "    export default function Layout() {\n" +
            '      return <Stack screenOptions={{ headerShown: false }} />\n' +
            '    }',
        ),
    )
  }
}

if (failed) process.exit(1)
console.log(
  c.grn('[check-routes] OK') + c.dim(` (layout ${layouts.length}개 검사)`),
)
