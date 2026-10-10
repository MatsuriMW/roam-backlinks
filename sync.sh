#!/bin/zsh
# 维护者用：正本是作者主库里的 .obsidian/plugins/logseq-roam-style-backlinks/。改完跑这个：
#   把 main.js、styles.css 拷进仓库；有改动就把版本号加一（manifest.json、versions.json，主库里的 manifest.json 一起改），
#   再提交、推送。推送后 GitHub Actions 按 Obsidian 的格式发 Release，并同步到 Linear。
# 用法：./sync.sh "改了什么 MAT-xx"      说明末尾写 #minor / #major 升大版本（1.0.3 → 1.1.0 / 2.0.0）
set -e
R="${0:A:h}"
SRC="${LRSB_SRC:-$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/马自立/.obsidian/plugins/logseq-roam-style-backlinks}"
MSG="${1:-同步}"
cd "$R"
cp "$SRC/main.js" "$SRC/styles.css" .
if ! git diff --quiet HEAD -- main.js styles.css 2>/dev/null || [ -n "$(git status --porcelain main.js styles.css)" ]; then
  python3 - "$MSG" "$SRC/manifest.json" <<'PY'
import json, re, sys
msg, vault_manifest = sys.argv[1], sys.argv[2]
m = json.load(open("manifest.json"))
major, minor, patch = (int(x) for x in m["version"].split("."))
if re.search(r"#major\s*$", msg): major, minor, patch = major + 1, 0, 0
elif re.search(r"#minor\s*$", msg): minor, patch = minor + 1, 0
else: patch += 1
m["version"] = f"{major}.{minor}.{patch}"
text = json.dumps(m, indent=2, ensure_ascii=False) + "\n"
open("manifest.json", "w").write(text)
open(vault_manifest, "w").write(text)
v = json.load(open("versions.json"))
v[m["version"]] = m["minAppVersion"]
open("versions.json", "w").write(json.dumps(v, indent=2) + "\n")
print("版本号 →", m["version"])
PY
fi
git add -A
git diff --cached --quiet && { echo "没有改动"; exit 0; }
git commit -q -m "$MSG"
git push -q
echo "已推送：$(git log -1 --format='%h %s')"
