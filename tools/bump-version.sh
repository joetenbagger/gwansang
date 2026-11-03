#!/bin/sh
# macOS/BSD sed와 GNU sed 차이 없이 런타임·검사 도구의 캐시 버전을 함께 바꿉니다.
# 사용법: sh tools/bump-version.sh 17
set -eu
V=${1:?버전 번호를 넣어 주세요}
case "$V" in ''|*[!0-9]*) echo "숫자 버전을 넣어 주세요." >&2; exit 1;; esac
cd "$(dirname "$0")/.."
python3 - "$V" <<'PY'
from pathlib import Path
import re
import sys

version = sys.argv[1]
files = [Path('index.html'), *Path('js').rglob('*.js'), *Path('tools').glob('*.mjs')]
changed = 0
for path in files:
    original = path.read_text()
    text = re.sub(r'\.(m?js|css)\?v=\d+', lambda m: '.' + m[1] + '?v=' + version, original)
    text = re.sub(r"""((?:from\s*|import\(\s*)['"]\.\.?/[^'"?]+\.m?js)(['"])""",
                  lambda m: m[1] + '?v=' + version + m[2], text)
    if text != original:
        path.write_text(text)
        changed += 1
print(f'v={version}: {changed} files updated')
PY
