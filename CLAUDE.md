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

## 핵심 결정사항 (변경 금지)
- 단위: 모든 재료 사용량은 g 단위로 통일
- 로스율: 제거 (사용하지 않음)
- 단위 변환 UI: 제거 (g 통일로 불필요)
- 재고현황 페이지: 제거
- 배치량 변경 전용 페이지: 제거 (레시피 상세에서 직접 조절)
- 엑셀 등록: 제거
- 아이콘/이미지: 사용하지 않음 (텍스트 + 색상만)
- 레시피 목록: 가격 표시 없음, 카테고리 배지 우측 배치

## 폴더 구조 (변경 금지)
```
gelato-recipe-manager/
├── CLAUDE.md
├── app/
│   ├── _layout.tsx                ← 루트 레이아웃, DB 초기화
│   └── (tabs)/
│       ├── _layout.tsx            ← 탭바 설정
│       ├── index.tsx              ← 홈 대시보드
│       ├── recipes/
│       │   ├── index.tsx          ← 레시피 목록
│       │   ├── [id].tsx           ← 레시피 상세 (배치량 조절 포함)
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
│   │   ├── Badge.tsx
│   │   ├── FilterChip.tsx
│   │   ├── EmptyState.tsx
│   │   └── SearchBar.tsx
│   ├── recipe/
│   └── ingredient/
├── db/
│   ├── schema.ts
│   ├── seed.ts
│   └── queries/
│       ├── recipes.ts
│       ├── ingredients.ts
│       └── checklist.ts
├── store/
│   ├── recipeStore.ts
│   ├── ingredientStore.ts
│   └── checklistStore.ts
├── utils/
│   ├── costCalculator.ts
│   ├── batchScaler.ts
│   └── backup.ts
├── constants/
│   ├── colors.ts
│   └── categories.ts
└── types/
    └── index.ts
```

## TypeScript 타입 (types/index.ts 기준)
```typescript
export type BaseCategory = '과일' | '차' | '곡물' | '견과' | '술' | '초콜릿' | '기타'
export type IngredientCategory = '유제품' | '과일' | '견과' | '당류' | '차' | '기타'
export type ChecklistStatus = 'pending' | 'in_progress' | 'done'

export interface Recipe {
  id: number
  name: string
  base_category: BaseCategory
  batch_size: number       // g 단위
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
  amount: number           // g 단위
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
  package_price: number    // 한 통 가격 (원)
  package_amount: number   // 한 통 용량 (g)
  price_per_g: number      // g당 가격 (자동 계산: package_price / package_amount)
  stock_count: number      // 재고 개수 (통 단위)
  stock_unit: string       // 단위 표시 (예: "개", "봉", "통")
  supplier_id?: number
  created_at: string
}

export interface IngredientPriceHistory {
  id: number
  ingredient_id: number
  package_price: number
  package_amount: number
  recorded_at: string
}

export interface Supplier {
  id: number
  name: string
  contact?: string
  memo?: string
}

export interface IngredientSupplier {
  id: number
  ingredient_id: number
  supplier_id: number
}

export interface DailyChecklist {
  id: number
  recipe_id: number
  date: string
  batch_size: number       // g 단위
  status: ChecklistStatus
  completed_at?: string
  recipe?: Recipe
}
```

## DB 스키마
```sql
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  base_category TEXT NOT NULL,
  batch_size REAL NOT NULL,
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

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  memo TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  package_price REAL NOT NULL,   -- 한 통 가격 (원)
  package_amount REAL NOT NULL,  -- 한 통 용량 (g)
  price_per_g REAL NOT NULL,     -- g당 가격 (자동 계산)
  stock_count REAL DEFAULT 0,    -- 재고 개수
  stock_unit TEXT DEFAULT '개',  -- 단위
  supplier_id INTEGER,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS ingredient_price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL,
  package_price REAL NOT NULL,
  package_amount REAL NOT NULL,
  recorded_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  amount REAL NOT NULL,          -- g 단위
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS daily_checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  batch_size REAL NOT NULL,      -- g 단위
  status TEXT DEFAULT 'pending',
  completed_at TEXT,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);
```

## 디자인 시스템
```typescript
// constants/colors.ts
export const COLORS = {
  primary: '#1E90FF',        // 파랑 (메인)
  primaryLight: '#E8F4FF',
  primaryBg: '#F0F7FF',

  text: {
    primary: '#1A1A2E',
    secondary: '#6B7280',
    muted: '#9CA3AF',
  },
  border: '#E5E7EB',
  white: '#FFFFFF',
  bg: '#F8FAFC',

  status: {
    done: '#10B981',
    inProgress: '#F59E0B',
    pending: '#9CA3AF',
    danger: '#EF4444',
  },
}

// 카테고리 배지 색상
export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  '과일':   { bg: '#FDE8F0', text: '#BE185D' },
  '차':     { bg: '#E0F2FE', text: '#0369A1' },
  '곡물':   { bg: '#F0FDF4', text: '#166534' },
  '견과':   { bg: '#FEF9C3', text: '#854D0E' },
  '술':     { bg: '#EDE9FE', text: '#6D28D9' },
  '초콜릿': { bg: '#FDF2E9', text: '#78350F' },
  '기타':   { bg: '#F3F4F6', text: '#374151' },
  '유제품': { bg: '#E0F2FE', text: '#0369A1' },
  '당류':   { bg: '#FEF9C3', text: '#854D0E' },
}
```

## 핵심 비즈니스 로직
```
원가 계산:
  재료 원가 = amount(g) × price_per_g
  price_per_g = package_price / package_amount
  총 원가 = 모든 재료 원가 합산

배치량 환산:
  변경된 사용량 = 기존 사용량 × (새 배치량 / 기본 배치량)
  변경된 원가 = 총 원가 × (새 배치량 / 기본 배치량)
```

## 화면별 상세 스펙

### 홈 (디자인 시안 1번 기준)
- 상단: Gelato Recipe Manager 로고 + 알림 아이콘
- 인사말: "안녕하세요, 사장님!" + 부제목
- 오늘 생산할 메뉴 섹션: 진행률 + 체크리스트 미리보기
- 하단 메뉴 그리드: 레시피 목록 / 재료 관리 / 원가 분석 / 오늘 생산 체크리스트

### 레시피 목록 (디자인 시안 2번 기준)
- 가격 표시 없음
- 카테고리 배지: 레시피명 우측에 배치
- 재료 개수만 표시 (기준값 표시 없음)
- 검색바 + 카테고리 필터 칩

### 레시피 상세 (디자인 시안 3번 기준)
- 상단 우측: "수정" 버튼 (디자인 시안 1번 스타일)
- 배치량 조절: [-] [5,000 g] [+] 형태, 500g 단위
- 재료표: 재료명 | 사용량(g) 형태 (디자인 시안 2번)
- 총 원가: 빨강 강조 텍스트
- 수정이력: 하단 섹션으로 표시

### 재료 목록 (디자인 시안 4번 기준)
- 재료 카드: 재료명 / 현재가(원/g) / 기준(g) / 재고(개수+단위) / 공급업체
- 현재가 수정 버튼 인라인 표시
- 전부 g 단위 통일

### 재료 등록 (디자인 시안 5번 기준)
- 재료명
- 카테고리
- 구매 정보: 구매가격(원) / 단위(g) / 개수
- 공급업체: 별도 공급업체 관리에서 선택

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
- 로스율 관련 코드 작성 금지
- 단위 변환 UI 작성 금지 (g 통일)
- 재고현황 전용 페이지 작성 금지
- 배치량 전용 페이지 작성 금지
- 아이콘/이미지 사용 금지
- 클라우드 연결 코드 작성 금지
```

## 현재 진행 상태
```
- [x] Phase 0-1: 프로젝트 초기화 + 패키지 설치
- [ ] Phase 0-2: 폴더 구조 + 기본 설정 파일
- [ ] Phase 0-3: GitHub Actions CI 세팅
- [ ] Phase 1-1: TypeScript 타입 + DB 스키마
- [ ] Phase 1-2: 더미데이터
- [ ] Phase 1-3: DB 쿼리 함수
- [ ] Phase 1-4: 유틸 함수 (원가/배치)
- [ ] Phase 1-5: Zustand 스토어
- [ ] Phase 1-6: 공통 컴포넌트
- [ ] Phase 2-1: 탭바 레이아웃
- [ ] Phase 2-2: 홈 대시보드
- [ ] Phase 3-1: 레시피 목록
- [ ] Phase 3-2: 레시피 상세
- [ ] Phase 3-3: 레시피 등록/수정
- [ ] Phase 3-4: 수정이력
- [ ] Phase 4-1: 재료 목록
- [ ] Phase 4-2: 재료 상세
- [ ] Phase 4-3: 재료 등록/수정
- [ ] Phase 5-1: 체크리스트
- [ ] Phase 6-1: 백업/복원 + 설정
- [ ] Phase 7-1: 전체 UI 점검
- [ ] Phase 7-2: QA + 버그 수정
```
