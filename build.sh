#!/usr/bin/env bash
# Dream Sandwich — Business Manager : single-file build
# Usage: bash build.sh
set -euo pipefail
cd "$(dirname "$0")"

PARTS=(
  src/01_head.html
  src/02_util.js
  src/03_seed.js
  src/04_calc.js
  src/05_ui.js
  src/06_dashboard.js
  src/07_bakery.js
  src/08_store.js
  src/09_reports.js
  src/10_settings.js
  src/12_bahikhata.js
  src/13_extras.js
  src/14_daily.js
  src/15_extra2.js
  src/16_more.js
  src/17_backup_po.js
  src/18_scan.js
  src/19_business.js
  src/20_round1.js
  src/21_final_a.js
  src/22_final_b.js
  src/23_final_c.js
  src/11_boot.js
  src/99_tail.html
)

for f in "${PARTS[@]}"; do
  [ -f "$f" ] || { echo "missing: $f" >&2; exit 1; }
done

cat "${PARTS[@]}" > index.html

# basic syntax gate (optional, agar node ho)
if command -v node >/dev/null 2>&1; then
  python3 - <<'PY' > /tmp/_ds_app.js 2>/dev/null || true
s=open('index.html',encoding='utf-8').read()
i=s.index('<script>')+8; j=s.index('</script>',i)
print(s[i:j])
PY
  if [ -s /tmp/_ds_app.js ]; then node --check /tmp/_ds_app.js && echo "JS syntax OK"; fi
fi

echo "✅ index.html built — $(wc -c < index.html) bytes, $(grep -c '' index.html) lines"
