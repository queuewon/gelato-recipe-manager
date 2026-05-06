// scripts/check-bool-props.mjs
// "java.lang.String cannot be cast to java.lang.Boolean" 부류의 native cast
// crash 재발 방지용 정적 검사. (newArchEnabled=true 인 Fabric 환경은 prop 타입이
// 엄격해서 boolean 자리에 string 이 오면 view 생성 단계에서 즉시 크래시.)
//
// 검사 항목:
//   소스 *.tsx/*.ts 의 JSX 요소 중, 알려진 boolean-typed RN prop 자리에
//   문자열 리터럴 ("true", "false", "any-string") 또는 ternary string 이
//   온 경우를 보고한다.
//
//   허용:  boolProp           (shorthand → true)
//          boolProp={true}    boolProp={false}
//          boolProp={expr}    (식, 함수 호출, 변수 — 타입은 TS 가 검증)
//   금지:  boolProp="..."     boolProp={'...'}   boolProp={a ? 'x' : 'y'}
//
//   className/style/title/label 등은 검사 대상 아님. 아래 BOOL_PROPS 목록만
//   검사. 새 native boolean prop 발견 시 목록에 추가.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yel: (s) => `\x1b[33m${s}\x1b[0m`,
  grn: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[90m${s}\x1b[0m`,
}

// React Native + 주요 라이브러리에서 boolean 으로 받는 prop 모음.
// 이 prop 자리에 string 이 오면 Android Fabric 에서 ClassCastException.
const BOOL_PROPS = new Set([
  // Pressable / Touchable
  'disabled',
  'accessible',
  'hasTVPreferredFocus',
  'isTVSelectable',
  // TextInput
  'editable',
  'multiline',
  'secureTextEntry',
  'autoFocus',
  'autoCorrect',
  'spellCheck',
  'selectTextOnFocus',
  'caretHidden',
  'contextMenuHidden',
  'blurOnSubmit',
  'clearTextOnFocus',
  'enablesReturnKeyAutomatically',
  'showSoftInputOnFocus',
  // ScrollView / FlatList
  'horizontal',
  'bounces',
  'pagingEnabled',
  'nestedScrollEnabled',
  'showsHorizontalScrollIndicator',
  'showsVerticalScrollIndicator',
  'scrollEnabled',
  'directionalLockEnabled',
  'alwaysBounceHorizontal',
  'alwaysBounceVertical',
  'automaticallyAdjustContentInsets',
  'persistentScrollbar',
  'disableIntervalMomentum',
  'overScrollMode', // string in some, but commonly bool-checked
  // Modal
  'transparent',
  'visible',
  'statusBarTranslucent',
  'hardwareAccelerated',
  // View
  'collapsable',
  'focusable',
  'removeClippedSubviews',
  'needsOffscreenAlphaCompositing',
  'renderToHardwareTextureAndroid',
  'shouldRasterizeIOS',
  // Image
  'progressiveRenderingEnabled',
  'fadeDuration', // 실제는 number 지만 string 들어오면 동일 부류 crash
  // Switch
  'value',
  // Navigation (react-navigation / expo-router)
  'headerShown',
  'gestureEnabled',
  'animationEnabled',
  'freezeOnBlur',
  'lazy',
  'unmountOnBlur',
  'detachInactiveScreens',
  // SafeAreaView
  'emulateUnlessSupported',
])

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.expo', 'android', 'ios', 'build', 'dist', 'scripts',
])
function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e)) continue
    const p = join(dir, e)
    const s = statSync(p)
    if (s.isDirectory()) walk(p, acc)
    else if (/\.(tsx|ts|jsx|js)$/.test(e)) acc.push(p)
  }
  return acc
}

// JSX 안에서 prop="literal" 또는 prop={'literal'} 또는
// prop={cond ? 'a' : 'b'} 형태를 잡는다.
// 단순 정규식이라 false-positive 가 있을 수 있으므로, 매칭 후 prop 이름이
// BOOL_PROPS 에 있을 때만 보고.
function findIssues(text, file) {
  const issues = []
  const lines = text.split('\n')
  const propRe =
    /(?<![A-Za-z0-9_$])([a-z][A-Za-z0-9_]*)\s*=\s*("[^"]*"|'[^']*'|\{\s*("[^"]*"|'[^']*'|[^{}]*\?\s*("[^"]*"|'[^']*')\s*:\s*("[^"]*"|'[^']*'))[^{}]*\})/g

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const m of line.matchAll(propRe)) {
      const propName = m[1]
      if (!BOOL_PROPS.has(propName)) continue
      const rhs = m[2]
      // 안전한 RHS 패턴은 미리 제외:
      //   ={true}, ={false}, ={undefined}, ={null}, ={varName}, ={!x}, ={x && y}
      // 이미 위 정규식이 그런 패턴을 잡지 않게 작성됐지만, 한 번 더 거른다.
      const inner = rhs.startsWith('{') ? rhs.slice(1, -1).trim() : rhs
      if (
        inner === 'true' ||
        inner === 'false' ||
        inner === 'undefined' ||
        inner === 'null'
      ) {
        continue
      }
      // 정확히 string literal 또는 ternary returning strings 만 보고
      const isStringLiteral = /^(["']).*\1$/.test(inner)
      const isTernaryStrings =
        /\?\s*(["']).*\1\s*:\s*(["']).*\2\s*$/.test(inner)
      if (!isStringLiteral && !isTernaryStrings) continue
      issues.push({
        file: file.replace(ROOT + '/', ''),
        line: i + 1,
        col: m.index + 1,
        prop: propName,
        rhs: rhs.length > 60 ? rhs.slice(0, 57) + '...' : rhs,
      })
    }
  }
  return issues
}

const files = walk(ROOT)
const allIssues = []
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  // 빠른 스킵: BOOL_PROPS 어느 것도 등장 안하면 패스
  let any = false
  for (const p of BOOL_PROPS) {
    if (text.includes(p)) {
      any = true
      break
    }
  }
  if (!any) continue
  for (const it of findIssues(text, f)) allIssues.push(it)
}

if (allIssues.length > 0) {
  console.error(
    c.red(
      '\n[check-bool-props] boolean prop 자리에 string 이 들어간 위치:',
    ),
  )
  for (const it of allIssues) {
    console.error(
      '  - ' +
        c.yel(`${it.file}:${it.line}`) +
        c.dim(`  ${it.prop}=${it.rhs}`),
    )
  }
  console.error(
    '\n' +
      c.yel('해결:') +
      c.dim(
        ' boolean prop 에는 {true}/{false}/{변수} 만 전달.\n' +
          '       Fabric (newArchEnabled=true) 에서 string → Boolean 캐스팅 시\n' +
          '       view 생성 단계에서 ClassCastException 발생.',
      ),
  )
  process.exit(1)
}

console.log(
  c.grn('[check-bool-props] OK') +
    c.dim(` (${BOOL_PROPS.size}개 prop 검사, 위반 0건)`),
)
