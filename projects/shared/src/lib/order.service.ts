import { Injectable, computed, signal } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, isSupabaseConfigured } from './supabase.config';
import type { CartLine, Order, OrderStatus } from './models';

const DEMO_KEY = 'zest.orders.v1';
const CHANNEL_NAME = 'zest-orders';

type RemoteRow = {
  id: string;
  table_number: string;
  lines: CartLine[];
  total: number;
  status: OrderStatus;
  comment: string | null;
  created_at: string;
};

/**
 * Приём заказов со стола.
 *
 * Если Supabase настроен — заказы уходят в базу и мгновенно появляются на экране кухни
 * у любого устройства. Если ключей нет — работает демонстрационный режим: заказ виден
 * на экране кухни в соседней вкладке того же браузера. Это позволяет показывать
 * механику клиенту до подключения базы.
 *
 * Библиотека Supabase подгружается динамически (ленивый импорт), поэтому её 226 кБ
 * не попадают в стартовый бандл сайта: они докачиваются только когда страница
 * заказа или кухни действительно обращается к базе.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  readonly mode: 'supabase' | 'demo' = isSupabaseConfigured() ? 'supabase' : 'demo';

  private client: SupabaseClient | null = null;
  private channel: BroadcastChannel | null = null;
  private started = false;

  private readonly _orders = signal<Order[]>([]);
  private readonly _error = signal<string | null>(null);

  readonly orders = this._orders.asReadonly();
  readonly error = this._error.asReadonly();

  /** Заказы, которые кухне ещё нужно отработать. */
  readonly active = computed(() =>
    this._orders()
      .filter((o) => o.status === 'new' || o.status === 'cooking')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );

  readonly served = computed(() =>
    this._orders()
      .filter((o) => o.status === 'served' || o.status === 'paid')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );

  readonly todayRevenue = computed(() =>
    this._orders().filter((o) => o.status !== 'new').reduce((sum, o) => sum + o.total, 0)
  );

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent) => {
        const payload = event.data as { type?: string; orders?: Order[] } | null;
        if (payload?.type === 'orders' && Array.isArray(payload.orders)) {
          this._orders.set(payload.orders);
        }
      };
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === DEMO_KEY) this.readDemo();
      });
    }
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    if (this.mode === 'supabase') {
      await this.loadRemote();
      const client = await this.supabase();
      client
        ?.channel('orders-stream')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: SUPABASE_CONFIG.table },
          () => void this.loadRemote()
        )
        .subscribe();
    } else {
      this.readDemo();
    }
  }

  async submit(table: string, lines: CartLine[], comment?: string): Promise<Order> {
    const order: Order = {
      id: newId(),
      table,
      lines,
      total: lines.reduce((sum, l) => sum + l.qty * l.item.price, 0),
      status: 'new',
      comment: comment?.trim() ? comment.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    if (this.mode === 'supabase') {
      const client = await this.supabase();
      if (!client) throw new Error('Supabase не настроен');

      const { error } = await client.from(SUPABASE_CONFIG.table).insert({
        id: order.id,
        table_number: order.table,
        lines: order.lines,
        total: order.total,
        status: order.status,
        comment: order.comment ?? null,
        created_at: order.createdAt,
      });
      if (error) {
        this._error.set(error.message);
        throw new Error(error.message);
      }
      await this.loadRemote();
      return order;
    }

    const next = [order, ...this._orders()];
    this.writeDemo(next);
    this._orders.set(next);
    this.channel?.postMessage({ type: 'orders', orders: next });
    return order;
  }

  async setStatus(id: string, status: OrderStatus): Promise<void> {
    if (this.mode === 'supabase') {
      const client = await this.supabase();
      if (!client) return;
      const { error } = await client.from(SUPABASE_CONFIG.table).update({ status }).eq('id', id);
      if (error) {
        this._error.set(error.message);
        return;
      }
      await this.loadRemote();
      return;
    }

    const next = this._orders().map((o) => (o.id === id ? { ...o, status } : o));
    this.writeDemo(next);
    this._orders.set(next);
    this.channel?.postMessage({ type: 'orders', orders: next });
  }

  /** Клиент создаётся один раз и только когда он действительно нужен. */
  private async supabase(): Promise<SupabaseClient | null> {
    if (this.client) return this.client;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      this.client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      return this.client;
    } catch (e) {
      this._error.set(e instanceof Error ? e.message : 'Не удалось загрузить Supabase');
      return null;
    }
  }

  private async loadRemote(): Promise<void> {
    const client = await this.supabase();
    if (!client) return;

    const { data, error } = await client
      .from(SUPABASE_CONFIG.table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      this._error.set(error.message);
      return;
    }
    this._orders.set((data as RemoteRow[]).map(toOrder));
  }

  private readDemo(): void {
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      this._orders.set(raw ? (JSON.parse(raw) as Order[]) : []);
    } catch {
      this._orders.set([]);
    }
  }

  private writeDemo(orders: Order[]): void {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(orders));
    } catch {
      /* игнорируем */
    }
  }
}

function toOrder(row: RemoteRow): Order {
  return {
    id: row.id,
    table: row.table_number,
    lines: row.lines ?? [],
    total: row.total,
    status: row.status,
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
  };
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `o-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
