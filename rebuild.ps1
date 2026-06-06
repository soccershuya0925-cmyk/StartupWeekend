# =====================================================================
#  rebuild.ps1 — Tailwind を再コンパイルして index.html に焼き込む
#  使う場面：index.html に「新しい Tailwind クラス」を足したとき
#  （色やテキストの変更だけなら実行不要。焼き込み済みCSSで動きます）
# =====================================================================
$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot
try {
  npx -y tailwindcss@3.4.17 -c build/tailwind.config.js -i build/input.css -o build/tw.out.css --minify
  node build/inline.js
  Write-Host "`n✅ 焼き込み完了：index.html を更新しました。" -ForegroundColor Green
} finally {
  Pop-Location
}
