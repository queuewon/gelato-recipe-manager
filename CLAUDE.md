# 🍨 Gelato Recipe Manager

## Claude Code 행동 규칙 (최우선)
- 작업 시작 전 반드시 이 파일 전체를 읽는다
- 모든 작업은 아래 "현재 진행 상태"를 확인하고 시작한다
- 지시하지 않은 파일은 절대 수정하지 않는다
- 한 번에 하나의 기능만 구현한다
- 기능 완성 후 반드시 git commit 한다
- 커밋 전 TypeScript 에러가 없는지 확인한다 (tsc --noEmit)
- 작업 완료 후 "현재 진행 상태" 체크박스를 업데이트한다
- 모르거나 애매한 부분은 구현 전에 반드시 질문한다

## 프로젝트 개요
젤라또 자영업자(1인)를 위한 레시피 관리 앱.
판매 목적 없음. 지인 한 명만 사용. Expo Go로 iOS 설치.

## 기술 스택 (변경 금지)
| 항목 | 기술 | 비고 |
|------|------|------|
| Framework | Expo (React Native) | managed workflow |
| Navigation | expo-router v3 | 파일 기반 라우팅 |
| Database | expo-sqlite | 로컬, 클라우드 없음 |
| Styling | NativeWind v4 + Tailwind | className 방식 |
| State | Zustand | 전역 상태 |
| Backup | expo-file-system + expo-sharing | JSON 파일 |
| VCS | git + GitHub | |
| CI | GitHub Actions | lint + tsc 체크 |

## 폴더 구조 (변경 금지)
```
gelato-app/
├── CLAUDE.md                      ← 이 파일
├── app/
│   ├── _layout.tsx                ← 루트 레이아웃, DB 초기화
│   └── (tabs)/
│       ├── _layout.tsx            ← 탭바 설정
│       ├── index.tsx              ← 홈 대시보드
│       ├── recipes/
│       │   ├── index.tsx          ← 레시피 목록
│       │   ├── [id].tsx           ← 레시피 상세
│       │   ├── new.tsx            ← 레시피 등록
│       │   ├── edit/[id].tsx      ← 레시피 수정
│       │   └── history/[id].tsx   ← 수정이력
│       ├── ingredients/
│       │   ├── index.tsx          ← 재료 목록
│       │   ├── [id].tsx           ← 재료 상세
│       │   └── new.tsx            ← 재료 등록/수정
│       ├── checklist/
│       │   └── index.tsx          ← 오늘 생산 체크리스트
│       └── settings/
│           └── index.tsx          ← 설정 (백업/복원)
├── components/
│   ├── common/
│   │   ├── Badge.tsx              ← 카테고리 뱃지
│   │   ├── FilterChip.tsx         ← 필터 칩
│   │   ├── EmptyState.tsx         ← 빈 목록 상태
│   │   └── SearchBar.tsx          ← 검색바
│   ├── recipe/                    ← 레시피 전용 컴포넌트
│   ├── ingredient/                ← 재료 전용 컴포넌트
│   └── checklist/                 ← 체크리스트 전용 컴포넌트
├── db/
│   ├── schema.ts                  ← 테이블 생성 + DB 초기화
│   ├── seed.ts                    ← 개발용 더미데이터
│   └── queries/
│       ├── recipes.ts             ← 레시피 CRUD 쿼리
│       ├── ingredients.ts         ← 재료 CRUD 쿼리
│       └── checklist.ts           ← 체크리스트 쿼리
├── store/
│   ├── recipeStore.ts
│   ├── ingredientStore.ts
│   └── checklistStore.ts
├── utils/
│   ├── costCalculator.ts          ← 원가 계산
│   ├── unitConverter.ts           ← 단위 변환
│   ├── batchScaler.ts             ← 배치량 환산
│   └── backup.ts                  ← 백업/복원
├── constants/
│   ├── colors.ts                  ← 컬러 시스템
│   └── categories.ts              ← 카테고리 목록
└── types/
    └── index.ts                   ← 전체 TypeScript 타입 정의
```

## TypeScript 타입 (types/index.ts 기준)
```typescript
export type BaseCategory = '과일' | '차' | '곡물' | '견과' | '술' | '기타'
export type IngredientCategory = '유제품' | '과일' | '견과' | '당류' | '차' | '기타'
export type ChecklistStatus = 'pending' | 'in_progress' | 'done'
export type Unit = 'kg' | 'g' | 'L' | 'ml' | '개'

export interface Recipe {
  id: number
  name: string
  base_category: BaseCategory
  batch_size: number
  batch_unit: string
  memo?: string
  is_deleted: number
  created_at: string
  updated_at: string
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredientDetail[]
}

export interface RecipeIngredientDetail {
  id: number
  recipe_id: number
  ingredient_id: number
  amount: number
  unit: Unit
  ingredient: Ingredient
}

export interface RecipeVersion {
  id: number
  recipe_id: number
  version_no: number
  snapshot_json: string
  created_at: string
}

export interface Ingredient {
  id: number
  name: string
  category: IngredientCategory
  price: number
  price_unit: string
  purchase_unit: Unit
  recipe_unit: Unit
  conversion_rate: number
  loss_rate: number
  stock: number
  stock_unit?: string
  min_stock: number
  created_at: string
}

export interface IngredientPriceHistory {
  id: number
  ingredient_id: number
  price: number
  recorded_at: string
}

export interface Supplier {
  id: number
  ingredient_id: number
  name: string
  contact?: string
  order_cycle?: string
}

export interface DailyChecklist {
  id: number
  recipe_id: number
  date: string
  batch_size: number
  batch_unit: string
  status: ChecklistStatus
  completed_at?: string
  recipe?: Recipe
}
```

## DB 스키마 (db/schema.ts 기준)
```sql
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  base_category TEXT NOT NULL,
  batch_size REAL NOT NULL,
  batch_unit TEXT DEFAULT 'kg',
  memo TEXT,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS recipe_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  version_no INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  price_unit TEXT NOT NULL,
  purchase_unit TEXT NOT NULL,
  recipe_unit TEXT NOT NULL,
  conversion_rate REAL NOT NULL,
  loss_rate REAL DEFAULT 0,
  stock REAL DEFAULT 0,
  stock_unit TEXT,
  min_stock REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS ingredient_price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL,
  price REAL NOT NULL,
  recorded_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  unit TEXT NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  contact TEXT,
  order_cycle TEXT,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS daily_checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  batch_size REAL NOT NULL,
  batch_unit TEXT DEFAULT 'kg',
  status TEXT DEFAULT 'pending',
  completed_at TEXT,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);
```

## 디자인 시스템 (constants/colors.ts 기준)
```typescript
// 파스텔 컬러 테마
export const COLORS = {
  purple: { accent: '#7c5cbf', bg: '#ede8f8', light: '#f3eeff' },
  blue:   { accent: '#378add', bg: '#e3eeff', light: '#f0f5ff' },
  pink:   { accent: '#c05a8a', bg: '#fde8f0', light: '#fef4f7' },
  yellow: { accent: '#854f0b', bg: '#fff8d6', light: '#fffbec' },
  green:  { accent: '#1a9e75', bg: '#e1f5ee', light: '#f0fff8' },
  gray:   { accent: '#5f5e5a', bg: '#f1efe8', light: '#f8f7f4' },
  text: {
    primary:   '#1a3a6e',
    secondary: '#6a8fd0',
    muted:     '#a0b8e0',
  },
  border: '#dce8fb',
}

// 카테고리 → 컬러 매핑
export const CATEGORY_COLORS: Record<string, keyof typeof COLORS> = {
  '과일': 'pink',
  '차':   'blue',
  '견과': 'yellow',
  '곡물': 'green',
  '술':   'purple',
  '기타': 'gray',
  '유제품': 'blue',
  '당류': 'yellow',
}

// 카테고리 → 이모지 매핑
export const CATEGORY_EMOJI: Record<string, string> = {
  '과일': '🍓', '차': '🍵', '견과': '🌿',
  '곡물': '🌾', '술': '🍷', '기타': '🧂',
  '유제품': '🥛', '당류': '🍬',
}
```

## 핵심 비즈니스 로직
```typescript
// 원가 계산 (utils/costCalculator.ts)
재료 원가 = (사용량 / conversion_rate) * price * (1 + loss_rate / 100)
총 원가   = 모든 재료 원가의 합

// 배치량 환산 (utils/batchScaler.ts)
변경된 사용량 = 기존 사용량 * (새 배치량 / 기본 배치량)

// 단위 환산 (utils/unitConverter.ts)
kg  → g   : × 1000
g   → kg  : ÷ 1000
L   → ml  : × 1000
ml  → L   : ÷ 1000
개  → 개  : × 1 (동일)
```

## 개발 규칙
```
코드 품질:
- TypeScript strict 모드, any 타입 금지
- 모든 함수에 반환 타입 명시
- try/catch 에러 처리 필수
- 빈 목록 → EmptyState 컴포넌트
- 로딩 중 → ActivityIndicator

Git 규칙:
- feat: 새 기능
- fix: 버그 수정
- style: UI 변경
- refactor: 코드 개선
- chore: 설정, 의존성

금지 사항:
- 클라우드 연결 코드 작성 금지
- 앱스토어 배포 관련 설정 금지
- 폴더 구조 임의 변경 금지
- 기술 스택 임의 변경 금지
```

## 현재 진행 상태
```
- [x] Phase 0-1: 프로젝트 초기화 + 패키지 설치
- [ ] Phase 0-2: 폴더 구조 + 기본 설정 파일
- [ ] Phase 0-3: GitHub + Actions CI 세팅
- [ ] Phase 1-1: TypeScript 타입 정의
- [ ] Phase 1-2: DB 스키마 + 초기화
- [ ] Phase 1-3: 더미데이터
- [ ] Phase 1-4: DB 쿼리 함수 전체
- [ ] Phase 2-1: 유틸 함수 (원가/단위/배치)
- [ ] Phase 2-2: 공통 컴포넌트
- [ ] Phase 2-3: Zustand 스토어 전체
- [ ] Phase 3-1: 레시피 목록 화면
- [ ] Phase 3-2: 레시피 상세 화면
- [ ] Phase 3-3: 레시피 등록/수정 화면
- [ ] Phase 3-4: 수정이력 화면
- [ ] Phase 4-1: 재료 목록 화면
- [ ] Phase 4-2: 재료 상세 화면
- [ ] Phase 4-3: 재료 등록 화면
- [ ] Phase 5-1: 체크리스트 화면
- [ ] Phase 5-2: 홈 대시보드
- [ ] Phase 6-1: 백업/복원 + 설정 화면
- [ ] Phase 7-1: 전체 UI 점검
- [ ] Phase 7-2: QA + 버그 수정
- [ ] Phase 7-3: 지인 폰 테스트
```
