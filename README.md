# Gelato Recipe Manager

젤라또 자영업자(1인)를 위한 레시피 관리 앱.
판매 목적 없음, 지인 한 명만 사용. iOS Expo Go로 설치하여 사용.

## 주요 기능
- 레시피 관리 (등록 / 상세 / 수정 / 수정이력)
- 재료 관리 (g 단위 통일, 통가격/통용량 → g당 가격 자동 계산)
- 오늘 생산 체크리스트 (pending → in_progress → done)
- 원가 계산 및 배치량 환산
- 로컬 데이터 백업/복원 (JSON 파일)

## 기술 스택
| 항목 | 기술 |
|------|------|
| Framework | Expo (React Native, managed workflow) |
| Navigation | expo-router |
| Database | expo-sqlite (로컬, 클라우드 없음) |
| Styling | NativeWind v4 + Tailwind |
| State | Zustand |
| Backup | expo-file-system + expo-sharing |
| CI | GitHub Actions (lint + tsc) |

## 개발 환경 실행

```bash
npm install --legacy-peer-deps
npm start
```

Metro Bundler가 시작되면 터미널의 QR 코드를 iPhone Expo Go 앱으로 스캔.

자주 사용하는 스크립트:
```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run ios         # iOS 시뮬레이터로 실행 (Xcode 필요)
```

## Expo Go로 설치 (사용자용)

1. iPhone App Store에서 **Expo Go** 앱 설치
2. 개발자가 보내준 QR 코드 또는 링크(`exp://…`)를 카메라/Expo Go에서 열기
3. 번들 다운로드가 끝나면 앱이 자동 실행됨
4. 처음 실행 시 SQLite DB가 자동 생성됨 — 빈 상태로 시작하니 재료부터 등록

> 같은 Wi-Fi 네트워크에 있어야 개발 서버에 연결됩니다.
> 오프라인 사용을 원할 경우 EAS Build로 standalone 빌드를 만들어 설치 (현 프로젝트 범위 외).

## 데이터
- 모든 데이터는 기기 로컬 SQLite에 저장 (외부 서버 없음)
- 백업: 설정 화면 → JSON 파일로 내보내기 → 클라우드 드라이브 등에 보관
- 복원: 백업 파일을 앱에 다시 불러오기
