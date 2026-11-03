# 얼굴팔자

궁금한 것 → 이름 → 성별 → 생년월일 → 시각 → 출생지 → MBTI → 사진 순서로 하나씩 묻고, 분석 연출을 거쳐 결과를 카드로 보여 주는 사주·관상 앱입니다.
입력한 정보와 사진은 브라우저 안에서만 처리되며 서버로 보내지 않습니다.

사이트: https://joetenbagger.github.io/gwansang/

## 구조

| 파일 | 역할 |
|---|---|
| `index.html` · `css/app.css` | 화면 구성과 디자인(부적 종이 모티프) |
| `js/app.js` | 질문 단계 흐름, 사진·촬영, 뒤로가기 |
| `js/loading.js` | 분석 중 연출(여덟 글자 맞추기, 오행, 얼굴 선, 합치기) |
| `js/deck.js` | 결과 카드 묶음 |
| `js/topic.js` | 고른 질문 심층 카드 4장(연애·돈·일·올해·나)과 시기 비교 |
| `js/saju/reading.js` | 월주·일지·시주, 기운 조합·강약, 합충, 원국별 세운을 엮는 개인별 풀이 |
| `js/content/reading-texts.js` · `js/view-reading.js` | 위치별 생활 장면·행동 제안·읽은 근거와 카드/전체 풀이 공통 표시 |
| `js/mbti.js` | 사주로 MBTI 추정, 실제 MBTI 비교, 간이 테스트 |
| `js/gunghap.js` · `gh-deck.js` | 친구·연인·동료 궁합 계산과 결과 카드 |
| `js/celebs.js` · `celeb-match.js` | 공개 생년월일 기반 유명인 목록과 같은 일주·비슷한 기운 매칭 |
| `js/share.js` | 공유용 이미지 만들기(내 결과, 궁합) |
| `js/invite.js` | 궁합 초대 링크(보내는 사람 정보를 주소 # 뒤에 담음, 서버로 가지 않음) |
| `og.png` | 카톡 등 링크 미리보기 이미지 |
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
| `tools/` | 분포 점검(`calibrate-saju.mjs`), 무작위 검사(`fuzz.mjs`), MBTI 보정(`calibrate-mbti.mjs`), 궁합 분포(`calibrate-gunghap.mjs`), 캐시 버전 올리기(`bump-version.sh`) |

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
    node tools/check-readings.mjs     # 월주·시주에 따른 본문 차이와 전체 주제 회귀 검사
    node tools/check-readings.mjs --examples  # 같은 생일·다른 시각의 풀이 예시
    node tools/check-life-flow.mjs    # 현재 만나이, 가까운 대운, 5년 범위 및 경계 검사

## 지금부터 읽는 큰 흐름 (v18)

‘인생의 큰 흐름’은 한국 시간의 현재 연도와 양력으로 변환한 실제 생일로 만나이를 계산하고, 현재 대운부터 설명합니다. 기본 그래프와 전환 안내는 앞으로 5년을 대상으로 하며, 그 안에 다음 대운이 시작되면 연도와 ‘내년/몇 년 뒤’를 함께 표시합니다. 평생의 최고·최저 점수를 제목으로 고르지 않습니다. 전체 인생 그래프와 전체 대운표는 펼쳐서 볼 수 있고, 축과 표는 대운식 나이 대신 연도를 표시합니다.

첫 대운 전이거나 계산 범위를 지난 경우는 현재 운을 임의로 대신 고르지 않습니다. 같은 대운 안의 선은 일정하게 유지하고, 생일 전후 만나이·음력 변환·한국 새해 경계도 검사합니다.

## 개인별 풀이 (v17)

일간만으로 성격 문장을 고르던 부분을 월간의 사회적 역할, 월지의 환경, 일지의 가까운 관계, 시간·시지의 장기 목표로 나눠 읽습니다. 가장 큰 두 십신 묶음과 실제 비중, 강약, 기둥 사이 합·충·반복도 함께 반영합니다. 결과에는 태어난 달·시간 카드와 ‘읽은 자리’를 표시하고, 고른 질문의 4장 및 전체 풀이·공유 이미지에 연결합니다.

요일·이름·난수로 사주 문구를 바꾸지 않습니다. 같은 사주 구성이면 분이 달라도 같은 핵심 풀이를 유지하고, 시각을 모르면 시주 해석을 만들지 않습니다. 월지는 양력 월 번호가 아닌 절기 기준입니다. 해석은 전통적 비유를 활용한 재미용 문구이며 예측 정확도를 검증한 모델은 아닙니다.

## 배포

`main`을 `gh-pages` 브랜치로 올리면 GitHub Pages에 반영됩니다. 코드를 고친 뒤에는 `sh tools/bump-version.sh 번호`로 스크립트 버전을 올려야 사용자 브라우저 캐시에 막히지 않습니다.

## 앱으로 만들기 (Capacitor)

    npm init -y
    npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
    npx cap init "관상과 사주" com.example.gwansang --web-dir .
    npx cap add ios && npx cap add android

## 사주로 본 MBTI

오행 비율과 십신으로 네 축(E/I, S/N, T/F, J/P) 점수를 계산합니다. 축끼리 겹치는 근거를 걷어 내고(잔차화), 무작위 생일 분포의 중앙값으로 보정해서 16유형이 고르게(약 5.6~7.3%) 나오게 맞췄습니다. 근거와 계수는 `js/mbti.js` 맨 위에 있고, 기준을 바꾸면 `node tools/calibrate-mbti.mjs 6000 check`로 다시 보정합니다.
