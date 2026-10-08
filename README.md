# 관상 풀이 (gwansang)

정면 얼굴 사진 한 장으로 얼굴 비율을 재고, 고전 상법 기준으로 풀이하는 웹앱입니다.
사진은 브라우저 안에서만 처리되며 서버로 보내지 않습니다.

## 구조

| 파일 | 역할 | 앱으로 옮길 때 |
|---|---|---|
| `index.html` | 화면 마크업·스타일 | 그대로 쓰거나 앱 UI로 교체 |
| `js/app.js` | 업로드·동의·그리기 | 플랫폼 UI로 교체 |
| `js/detector.js` | 사진 → 랜드마크 68점 (face-api) | 필요하면 iOS Vision / ML Kit 등으로 교체 |
| `js/metrics.js` | 랜드마크 → 측정값 (순수 함수) | 그대로 재사용 |
| `js/rules.js` | 측정값 → 풀이 (기준값·문구 데이터) | 그대로 재사용 |
| `js/sample-face.js` | 예시 화면용 평균 얼굴 윤곽 | 선택 |
| `vendor/face-api.esm.js`, `models/` | 얼굴 인식 엔진과 모델 (MIT) | 웹뷰 방식이면 그대로 |

## 로컬 실행

ES 모듈이라 파일을 더블클릭하면 안 되고 간단한 서버가 필요합니다.

    cd gwansang
    python3 -m http.server 8000
    # 브라우저에서 http://localhost:8000

## 앱으로 만드는 가장 빠른 길: Capacitor

웹 코드를 그대로 iOS/Android 앱으로 감쌉니다.

    npm init -y
    npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
    npx cap init "관상 풀이" com.example.gwansang --web-dir .
    npx cap add ios && npx cap add android
    npx cap open ios

카메라 촬영을 넣으려면 `@capacitor/camera` 플러그인을 추가하고 `app.js`의 파일 입력 옆에 연결하면 됩니다.

## 기준값 조정

`rules.js`의 `below` 값이 구간 경계입니다. 초기값은 소수의 샘플 사진으로 잡은 것이라,
실제 사용자 사진(동의 받은 것)의 측정값 분포를 보고 각 구간에 사람이 고르게 나뉘도록 다시 맞추는 게 좋습니다.
화면 맨 아래 "측정값 전체 보기"에서 원시 값을 볼 수 있습니다.

## 배포 시 주의

GitHub Pages는 JS 파일을 약 10분간 캐시합니다. 코드를 고친 뒤에는 `index.html`과 `js/app.js`의 `?v=숫자`를 함께 올려야 사용자 화면에 바로 반영됩니다.
