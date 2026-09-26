/**
 * Подключение Supabase для приёма заказов с QR-кодов на столах.
 *
 * Если ключи пустые, приложение работает в демонстрационном режиме:
 * заказы сохраняются в браузере и мгновенно видны на экране кухни
 * в соседней вкладке того же устройства (BroadcastChannel).
 *
 * Сейчас ключи заполнены — заказы уходят в базу и видны на кухне
 * с любого устройства.
 *
 * Про ключ: здесь лежит новый публичный ключ Supabase вида
 * `sb_publishable_...`. Он заменяет прежний `anon` и, как и тот,
 * предназначен для показа в браузере — это не секрет.
 * Ключ `service_role` / `sb_secret_...` сюда класть НЕЛЬЗЯ: он
 * обходит все политики доступа.
 */
export const SUPABASE_CONFIG = {
  url: 'https://xzghhvizdfqorcjklhqn.supabase.co',
  anonKey: 'sb_publishable_f9B94NkY6oQJTR7yFoRiUA_gKTfJ4NF',
  table: 'orders',
};

export const isSupabaseConfigured = (): boolean =>
  SUPABASE_CONFIG.url.trim().length > 0 && SUPABASE_CONFIG.anonKey.trim().length > 0;
