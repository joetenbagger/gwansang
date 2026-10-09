# 얼굴팔자

궁금한 것 → 이름 → 성별 → 생년월일 → 시각 → 출생지 → 사진 순서로 하나씩 묻고, 분석 연출을 거쳐 결과를 카드로 보여 주는 사주·관상 앱입니다.
입력한 정보와 사진은 브라우저 안에서만 처리되며 서버로 보내지 않습니다.

사이트: https://joetenbagger.github.io/gwansang/

## 구조

| 파일 | 역할 |
|---|---|
| `index.html` · `css/app.css` | 화면 구성과 디자인(부적 종이 모티프) |
| `js/app.js` | 질문 단계 흐름, 사진·촬영, 뒤로가기 |
| `js/loading.js` | 분석 중 연출(여덟 글자 맞추기, 오행, 얼굴 선, 합치기) |
| `js/deck.js` | 결과 카드 묶음 |
| `js/topic.js` · `topic-texts.js` | 고른 질문 심층 카드 4장(연애·돈·일·올해·나) |
| `js/share.js` | 공유용 이미지 만들기 |
| `js/copy.js` | 화면 문구, 시진 표 |
| `js/view-saju.js` · `view-face.js` | 전체 풀이(사주·관상 상세) |
| `js/view-total.js` | 이전 버전의 종합 화면(점검 도구에서만 사용) |
| `js/combined.js` | 사주와 관상을 엮는 종합 풀이 |
| `js/saju/calendar.js` | 생년월일시 → 사주팔자·대운 (한국 표준시 변천·서머타임·경도 보정 포함) |
| `js/saju/analyze.js` | 오행·강약·용신·십신·신살·합충·대운·세운 분석 |
| `js/saju/data.js` · `texts.js` | 천간·지지 표와 풀이 문구 |
| `js/detector.js` | 사진 → 얼굴 랜드마크 68점 (face-api) |
| `js/metrics.js` · `rules.js` | 관상 측정과 풀이 문구 |
| `vendor/` | lunar-javascript(만세력), face-api(얼굴 인식) — 모두 MIT |
| `tools/` | 분포 점검(`calibrate-saju.mjs`), 무작위 검사(`fuzz.mjs`), 캐시 버전 올리기(`bump-version.sh`) |

계산(`saju/*`, `combined.js`, `metrics.js`, `rules.js`)은 화면과 분리된 순수 함수라 앱으로 옮겨도 그대로 씁니다.

## 사주 계산 기준

- 년주·월주: 절기(입춘·경칩 …)의 정확한 시각 기준
- 일주·시주: 출생지 경도로 보정한 평균 태양시 기준 (서울 약 −32분)
- 1954~1961년 UTC+8:30, 1948~1960·1987~1988년 서머타임 반영
- 밤 11시~자정 출생: 기본은 다음 날 일주(전통), 세부 설정에서 야자시 방식 선택 가능
- 용신은 억부법 기반의 간이 판단 (조후 미반영)

## 로컬 실행

    python3 -m http.server 8000
    # http://localhost:8000

## 점검

    node tools/fuzz.mjs 3000          # 무작위 3000명 풀이에 빈 값·오류가 없는지
    node tools/calibrate-saju.mjs     # 신강·신약·용신 분포

## 배포

`main`을 `gh-pages` 브랜치로 올리면 GitHub Pages에 반영됩니다. 코드를 고친 뒤에는 `sh tools/bump-version.sh 번호`로 스크립트 버전을 올려야 사용자 브라우저 캐시에 막히지 않습니다.

## 앱으로 만들기 (Capacitor)

    npm init -y
    npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
    npx cap init "관상과 사주" com.example.gwansang --web-dir .
    npx cap add ios && npx cap add android
