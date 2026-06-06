/**
 * Tailwind v3 ビルド設定 — オフライン用にCSSを「焼き込む」ためだけに使用します。
 * 使い方:
 *   npx -y tailwindcss@3.4.17 -c build/tailwind.config.js -i build/input.css -o build/tw.out.css --minify
 *   node build/inline.js   ← 生成CSSを index.html にインライン化
 */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: { rounded: ['"M PLUS Rounded 1c"', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { orange: '#FF7A1A', deep: '#FF6300', green: '#2FBF5B', leaf: '#1F9D55' },
        cream: '#FFF8EF',
        ink: '#3A2A1B',
      },
      boxShadow: {
        pop: '0 10px 0 rgba(0,0,0,0.06)',
        card: '0 14px 30px -12px rgba(255,122,26,0.35)',
      },
    },
  },
  plugins: [],
};
