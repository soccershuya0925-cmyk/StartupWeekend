# =====================================================================
#  deploy.ps1 — 最新の index.html を Vercel 本番へ再デプロイ
#  公開URL: https://ore-foodloss.vercel.app
#  ※ 初回デプロイ済み。index.html を更新したらこれを実行するだけ。
# =====================================================================
$ErrorActionPreference = "Stop"

# 非ASCIIフォルダ名だと Vercel 連携が壊れるため、ASCII名のステージングから配信
$stage = Join-Path (Split-Path $PSScriptRoot -Parent) "ore-foodloss"
if (-not (Test-Path $stage)) { New-Item -ItemType Directory -Force -Path $stage | Out-Null }

Copy-Item (Join-Path $PSScriptRoot "index.html") (Join-Path $stage "index.html") -Force
Write-Host "→ index.html をステージングへコピーしました。デプロイします…" -ForegroundColor Cyan

npx -y vercel deploy $stage --prod --yes
