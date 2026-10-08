#!/bin/sh
# 사용법: sh tools/bump-version.sh 6
# 모든 내부 import와 index.html의 스크립트 주소에 ?v=번호를 붙여 브라우저 캐시를 무효화합니다.
V=${1:?버전 번호를 넣어 주세요}
cd "$(dirname "$0")/.."
for f in index.html js/*.js js/saju/*.js; do
  # 이미 붙은 버전은 교체, 없는 상대경로 import에는 추가
  sed -i -E "s/\.(m?js)\?v=[0-9]+/.\1?v=$V/g; s/(from '\.{1,2}\/[^'?]+\.m?js)'/\1?v=$V'/g; s/(import\('\.{1,2}\/[^'?]+\.m?js)'/\1?v=$V'/g" "$f"
done
grep -rhoE "\?v=[0-9]+" index.html js | sort | uniq -c
