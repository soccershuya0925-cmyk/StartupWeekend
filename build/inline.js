/**
 * build/tw.out.css（コンパイル済みTailwind）を index.html に焼き込み、
 * Play CDN 依存を除去する（=オフラインで動く）スクリプト。
 * 何度でも実行可能：初回はCDNを置換、2回目以降は既存の焼き込みCSSを差し替える。
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const cssPath = path.join(root, 'build', 'tw.out.css');

let html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8').trim();
const styleBlock = '<style id="tw-compiled">\n' + css + '\n</style>';

const cdnScript = '<script src="https://cdn.tailwindcss.com"></script>';

if (html.includes(cdnScript)) {
  // 初回：CDN <script> を焼き込みCSSに置換 ＋ tailwind.config ブロックを削除
  html = html.replace(cdnScript, styleBlock);
  html = html.replace(/\n?\s*<script>\s*tailwind\.config[\s\S]*?<\/script>/, '');
  html = html.replace(
    '<!-- Tailwind (Play CDN) ※後でローカルCSSに焼き込みます -->',
    '<!-- Tailwind: コンパイル済みCSSを焼き込み（CDN不要・完全オフライン対応） -->'
  );
  console.log('OK(初回): ' + css.length + ' bytes を焼き込みました。');
} else if (/<style id="tw-compiled">[\s\S]*?<\/style>/.test(html)) {
  // 2回目以降：既存の焼き込みCSSを最新に差し替え
  html = html.replace(/<style id="tw-compiled">[\s\S]*?<\/style>/, styleBlock);
  console.log('OK(更新): ' + css.length + ' bytes に差し替えました。');
} else {
  console.error('焼き込み対象が見つかりません（CDNスクリプトも tw-compiled も無い）。中止します。');
  process.exit(1);
}

fs.writeFileSync(htmlPath, html, 'utf8');
