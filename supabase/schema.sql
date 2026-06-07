-- ============================================================
-- メシ活: みんなの投稿（ソーシャルフィード）
-- Supabase の SQL Editor に貼り付けて実行してください。
-- RLS（Row Level Security）で「全員閲覧 / 自分の投稿のみ作成・削除」を保証します。
-- ============================================================

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  author_name text not null,
  dish_name   text not null,
  comment     text,
  saved_grams int  default 0,
  created_at  timestamptz not null default now()
);

alter table public.posts enable row level security;

-- 誰でも閲覧できる（みんなの投稿が見える）
drop policy if exists "posts are viewable by everyone" on public.posts;
create policy "posts are viewable by everyone"
  on public.posts for select
  using (true);

-- ログインユーザーは「自分の投稿」だけ作成できる
drop policy if exists "users can insert their own posts" on public.posts;
create policy "users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

-- 「自分の投稿」だけ削除できる（＝削除機能の所有者チェック）
drop policy if exists "users can delete their own posts" on public.posts;
create policy "users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
