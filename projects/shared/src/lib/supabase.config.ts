/**
 * Подключение Supabase для приёма заказов с QR-кодов на столах.
 *
 * Пока ключи пустые, приложение работает в демонстрационном режиме:
 * заказы сохраняются в браузере и мгновенно видны на экране кухни
 * в соседней вкладке того же устройства (BroadcastChannel).
 *
 * Чтобы включить настоящий приём заказов:
 * 1. Создайте проект на supabase.com.
 * 2. Выполните SQL из папки supabase/schema.sql.
 * 3. Впишите значения ниже (Project URL и anon public key).
 * 4. Включите Realtime для таблицы orders.
 */
export const SUPABASE_CONFIG = {
  url: '',
  anonKey: '',
  table: 'orders',
};

export const isSupabaseConfigured = (): boolean =>
  SUPABASE_CONFIG.url.trim().length > 0 && SUPABASE_CONFIG.anonKey.trim().length > 0;
