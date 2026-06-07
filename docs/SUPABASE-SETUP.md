# Supabase セットアップ（みんなの投稿フィード・ログイン）

「みんなの投稿フィード」「ログイン」「投稿削除」を動かすための設定です。**約5分**。
※ 設定しなくてもアプリは通常どおり動きます（フィードは「準備中」表示になるだけ）。

## 1. Supabase プロジェクトを作る（無料）
1. https://supabase.com/ で Sign up → **New project** 作成（リージョンは Tokyo 推奨）。
2. 作成後、左メニュー **Project Settings → API** を開く。
3. 次の2つをメモ：
   - **Project URL**（`https://xxxx.supabase.co`）
   - **anon public** key（`eyJ...` の長い文字列）

## 2. テーブルとセキュリティを作る
1. 左メニュー **SQL Editor** → **New query**。
2. リポジトリの [`supabase/schema.sql`](../supabase/schema.sql) の中身を全部貼り付けて **Run**。
   - `posts` テーブル＋RLS（全員閲覧／自分の投稿だけ作成・削除）が作られます。

## 3. メール確認をオフにする（デモを即ログイン可能に）
1. 左メニュー **Authentication → Providers → Email**。
2. **Confirm email** を **OFF**（オフにすると、登録後すぐにログインできます。発表・テスト向け）。

## 4. 環境変数を設定する
### ローカル（`.env.local` をプロジェクト直下に作成）
```
NEXT_PUBLIC_SUPABASE_URL=（1でメモしたProject URL）
NEXT_PUBLIC_SUPABASE_ANON_KEY=（1でメモしたanon public key）
```
（`.env.local.example` をコピーして埋めればOK）

### 本番（Vercel）
- Vercel のプロジェクト → **Settings → Environment Variables** に上記2つを追加 → **Redeploy**。

## 5. 動作確認
- アプリを開く → ホーム下部に「🍚 みんなの投稿」。
- 「ログイン → 新規登録」でアカウント作成 → 料理を投稿 → 別アカウントでも見える。
- 自分の投稿にだけ「削除」ボタンが出る（他人の投稿は消せない＝RLSで保護）。

---
**仕組み**：`anon` キーは公開しても安全な設計（RLSがあるため、他人の投稿は読めても消せない）。`service_role` キーは絶対にフロントに置かないこと。
