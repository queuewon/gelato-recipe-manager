# Indigo Gelato — 레시피 관리 앱

젤라또 가게 사장님 1인 사용용 iOS 앱. 데이터는 폰 내부 SQLite에만 저장되고 외부 서버로 나가지 않음.

---

## 주요 기능
- 레시피 등록 / 상세 / 수정 / 수정이력
- 재료 관리 (g 단위, 통가격/통용량 → g당 가격 자동 계산)
- 오늘 생산 체크리스트
- 원가 계산 + 배치량 환산
- JSON 백업 / 복원

---

## 폰에 설치하는 방법

설치 방식은 두 가지. 본인 상황에 맞게 골라서 따라 하면 됨.

| 방식 | 장점 | 단점 | 추천 |
|------|------|------|------|
| **A. Expo Go** | 빠르게 시작. 코드 수정하면 바로 반영. | 매번 개발자 컴퓨터를 켜놓고 같은 Wi-Fi에 있어야 함. | 개발/테스트용 |
| **B. EAS Build (TestFlight)** | 컴퓨터 없이 폰 단독 사용. App Store처럼 설치됨. | 처음 빌드에 30분~1시간. 90일마다 갱신. | **실사용자(누나)용** |

---

# 방식 A · Expo Go로 임시 실행

> 개발자(나)가 컴퓨터에서 서버를 켜두고, 폰에서 Expo Go로 접속하는 방식.

## 1단계 — 컴퓨터 준비 (개발자, Mac 기준)

### 1-1. Node.js 설치
1. https://nodejs.org 접속
2. **LTS** 버튼 눌러서 설치 파일 다운로드
3. 받은 파일을 더블클릭해서 안내대로 설치 (계속 → 동의 → 설치)
4. 터미널(Spotlight에서 "터미널" 검색)을 열고 아래 입력해서 버전이 나오면 설치 성공:
   ```bash
   node -v
   npm -v
   ```

### 1-2. 프로젝트 폴더로 이동
터미널에서:
```bash
cd ~/Desktop/side/gelato-app
```
(폴더 위치가 다르면 본인 경로로 바꿔서 입력)

### 1-3. 필요한 라이브러리 설치 (최초 1회만)
```bash
npm install --legacy-peer-deps
```
5~10분 정도 걸림. `node_modules` 폴더가 만들어지면 끝.

### 1-4. 개발 서버 실행
```bash
npm start
```
터미널에 QR 코드와 `exp://192.168.x.x:8081` 같은 주소가 뜸. 이 창은 그대로 켜둬야 함.

> ⚠️ 컴퓨터와 폰이 **같은 Wi-Fi**에 있어야 함. 다른 네트워크면 안 됨.
> 다른 네트워크에서 써야 하면 `npm start` 대신 `npx expo start --tunnel` 입력 (느리지만 됨).

## 2단계 — 폰 준비

### 2-1. Expo Go 앱 설치
1. iPhone 앱스토어 열기
2. **Expo Go** 검색
3. 설치 (무료, 흰 바탕에 파란 동그라미 아이콘)

### 2-2. QR 코드 스캔
1. iPhone 기본 **카메라** 앱 열기
2. 컴퓨터 터미널에 뜬 QR 코드를 비춤
3. 위에 뜨는 노란 알림 "Expo Go에서 열기" 탭
4. Expo Go가 열리면서 번들 다운로드 (1~2분)
5. 끝나면 앱이 실행됨

✅ 완료. 이제 사용 가능.

> 컴퓨터에서 `npm start`를 끄면 폰에서도 앱이 멈춤. 다음에 다시 쓰려면 1-2 → 1-4 단계만 반복.

---

# 방식 B · EAS Build로 정식 설치 (App Store처럼)

> 한 번 빌드해두면 컴퓨터 안 켜도 폰에서 단독 실행됨. **누나가 매일 쓰려면 이 방식.**

## 1단계 — 개발자 계정 준비 (개발자가 한 번만)

### 1-1. Apple 개발자 계정
- https://developer.apple.com 에서 가입
- **연 $99** 결제 필요 (TestFlight나 정식 설치에 필수)
- 개인 계정도 됨

### 1-2. Expo 계정 만들기 (이미 있으면 패스)
- https://expo.dev 회원가입 (무료)
- 이 프로젝트의 `app.json` owner는 `oneiricxel` 로 되어있음 — 이 계정으로 로그인해야 빌드 가능

### 1-3. EAS CLI 설치
터미널에서:
```bash
npm install -g eas-cli
eas login
```
방금 만든 Expo 계정으로 로그인.

## 2단계 — 빌드 (개발자, 한 번)

### 2-1. 프로젝트 폴더로 이동
```bash
cd ~/Desktop/side/gelato-app
```

### 2-2. iOS용 빌드 실행
```bash
eas build --platform ios --profile preview
```
- Apple 계정 정보 물어보면 입력
- 인증서/프로비저닝 프로파일은 EAS가 자동 생성 (질문 나오면 모두 yes)
- 빌드 시작되면 **30분~1시간 대기**. 진행상황은 `https://expo.dev/accounts/oneiricxel/projects/gelato-app/builds` 에서 확인

### 2-3. 빌드 완료
- 완료되면 터미널과 위 URL에 `.ipa` 다운로드 링크와 QR 코드가 나옴

## 3단계 — 폰에 설치 (사용자 = 누나)

### 옵션 ①: TestFlight (가장 깔끔, 추천)

**개발자 작업:**
1. https://appstoreconnect.apple.com 접속 (Apple 계정으로 로그인)
2. "내 앱" → "+" → 새 앱 등록 (이름: Indigo Gelato, 번들 ID: com.queuewon.gelatoapp)
3. 터미널에서:
   ```bash
   eas submit --platform ios --profile preview
   ```
4. 업로드 완료 후 App Store Connect → 해당 앱 → TestFlight 탭 → "내부 테스터" 또는 "외부 테스터"에 누나 이메일 추가
5. 누나 이메일로 초대 메일 도착

**누나 작업:**
1. iPhone 앱스토어에서 **TestFlight** 앱 설치
2. 이메일로 받은 초대 링크 탭
3. TestFlight 안에서 Indigo Gelato 옆 **설치** 버튼
4. 홈 화면에 아이콘 생김 → 평소처럼 탭해서 사용

> TestFlight 빌드는 **90일마다 만료**. 만료되면 개발자가 위 2-2 단계부터 다시.

### 옵션 ②: 직접 설치 (개발자 폰에 본인이 깔 때)

EAS 빌드 결과 페이지에 뜨는 **QR 코드**를 폰 카메라로 스캔 → 프로파일 설치 안내 따라가면 `.ipa` 직접 설치됨.
(단, 개발자 본인 폰만 가능. 누나 폰에는 TestFlight 경로 권장)

---

## 평소 사용법 (앱 설치 후)

1. **재료 탭**에서 우유, 설탕 등 재료 먼저 등록
   - 구매 가격(원), 한 통 용량(g), 한 통 개수 입력
   - g당 가격이 자동 계산됨
2. **레시피 탭**에서 우상단 + 버튼으로 레시피 등록
   - 레시피명, 카테고리, 기본 배치량(g), 재료별 사용량(g)
3. **레시피 상세**에서 ± 버튼으로 배치량 조절 → 재료 사용량/원가 자동 환산
4. **오늘생산 탭**에서 오늘 만들 메뉴 추가 → 만들면서 탭해서 진행중/완료 표시
5. **설정 탭**에서 가끔 백업하기 → JSON 파일을 카카오톡 나에게 보내기/iCloud에 저장

> 데이터는 폰 안에만 있음. 폰을 새로 사거나 앱을 삭제하면 데이터도 사라지니 **주기적으로 백업 권장**.

---

## 문제 생기면

| 증상 | 해결 |
|------|------|
| 앱이 안 켜짐, 흰 화면 | 앱 완전 종료 후 다시 실행 |
| Expo Go에서 "Network response timed out" | 컴퓨터와 폰 같은 Wi-Fi 확인. 안 되면 `npx expo start --tunnel` 사용 |
| `npm install` 에러 | `npm install --legacy-peer-deps` 로 다시 |
| 백업 파일 복원 안 됨 | 파일 확장자가 `.json`인지 확인 |
| TestFlight 만료 | 개발자에게 재빌드 요청 |

문제 생기면 개발자 (queuewon@gmail.com) 에게 연락.

---

## 개발자용 명령어 모음

```bash
npm install --legacy-peer-deps    # 최초 1회
npm start                          # 개발 서버 (Expo Go용)
npm run typecheck                  # 타입 체크
npm run lint                       # 코드 스타일 체크
npm run ios                        # iOS 시뮬레이터로 실행 (Xcode 필요)

eas build --platform ios --profile preview   # 폰용 빌드
eas submit --platform ios --profile preview  # TestFlight 업로드
```

## 기술 스택

| 항목 | 기술 |
|------|------|
| Framework | Expo SDK 54 (React Native, managed workflow) |
| Navigation | expo-router |
| Database | expo-sqlite (로컬) |
| Styling | NativeWind + StyleSheet |
| State | Zustand |
| Backup | expo-file-system + expo-sharing |
| Build | EAS Build |
