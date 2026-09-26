-- ============================================================================
--  Zest Resto — схема базы для приёма заказов со столов
--  Выполнить целиком в Supabase: Project → SQL Editor → New query → Run.
-- ============================================================================

-- ---------- Заказы ----------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  table_number  text        not null,
  lines         jsonb       not null default '[]'::jsonb,
  total         integer     not null default 0,
  status        text        not null default 'new'
                            check (status in ('new', 'cooking', 'served', 'paid')),
  comment       text,
  created_at    timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_table_idx      on public.orders (table_number);

-- ---------- Столы (необязательно, но удобно для QR) ----------
create table if not exists public.restaurant_tables (
  number      text primary key,
  seats       integer,
  zone        text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- Меню (необязательно: сайт читает data/menu.json) ----------
create table if not exists public.menu_items (
  id           text primary key,
  category_id  text not null,
  name         text not null,
  price        integer not null,
  is_hit       boolean not null default false,
  tags         text[]  not null default '{}',
  is_available boolean not null default true
);

-- ============================================================================
--  Доступ
--  Внимание: политики ниже открытые — это осознанный компромисс для демо,
--  чтобы заказ с телефона гостя уходил без регистрации.
--  Для продакшена: закрыть чтение и обновление статуса, оставив их только
--  авторизованному персоналу (Supabase Auth + роль kitchen), а анонимному
--  ключу оставить только INSERT в orders.
-- ============================================================================
alter table public.orders enable row level security;

drop policy if exists "guest can create order" on public.orders;
create policy "guest can create order"
  on public.orders for insert to anon, authenticated
  with check (true);

-- Гость читает статус своих заказов (сайт фильтрует по номеру стола).
drop policy if exists "guest can read orders" on public.orders;
create policy "guest can read orders"
  on public.orders for select to anon, authenticated
  using (true);

-- Кухня меняет статус.
drop policy if exists "kitchen can update status" on public.orders;
create policy "kitchen can update status"
  on public.orders for update to anon, authenticated
  using (true) with check (true);

-- ============================================================================
--  Realtime: чтобы экран кухни обновлялся сам, без перезагрузки
-- ============================================================================
alter publication supabase_realtime add table public.orders;

-- ============================================================================
--  Проверка: после подключения заказа с сайта выполните
--  select * from public.orders order by created_at desc limit 10;
-- ============================================================================
