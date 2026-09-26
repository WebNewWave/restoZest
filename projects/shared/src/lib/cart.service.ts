import { Injectable, computed, effect, signal } from '@angular/core';
import type { CartLine, MenuItem } from './models';

const STORAGE_KEY = 'zest.cart.v1';

/** Корзина гостя. Живёт в сигналах, переживает перезагрузку страницы и привязана к номеру стола. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lines = signal<CartLine[]>(readInitial());
  private readonly _table = signal<string>(readTable());

  readonly lines = this._lines.asReadonly();
  readonly table = this._table.asReadonly();

  readonly count = computed(() => this._lines().reduce((sum, l) => sum + l.qty, 0));
  readonly total = computed(() => this._lines().reduce((sum, l) => sum + l.qty * l.item.price, 0));
  readonly isEmpty = computed(() => this._lines().length === 0);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: this._lines(), table: this._table() }));
      } catch {
        /* приватный режим — молча игнорируем */
      }
    });
  }

  setTable(table: string): void {
    this._table.set(table);
  }

  qtyOf(itemId: string): number {
    return this._lines().find((l) => l.item.id === itemId)?.qty ?? 0;
  }

  add(item: MenuItem, qty = 1): void {
    this._lines.update((lines) => {
      const index = lines.findIndex((l) => l.item.id === item.id);
      if (index < 0) return [...lines, { item, qty }];
      const next = [...lines];
      next[index] = { ...next[index], qty: next[index].qty + qty };
      return next;
    });
  }

  dec(itemId: string): void {
    this._lines.update((lines) => {
      const index = lines.findIndex((l) => l.item.id === itemId);
      if (index < 0) return lines;
      const next = [...lines];
      const qty = next[index].qty - 1;
      if (qty <= 0) next.splice(index, 1);
      else next[index] = { ...next[index], qty };
      return next;
    });
  }

  remove(itemId: string): void {
    this._lines.update((lines) => lines.filter((l) => l.item.id !== itemId));
  }

  clear(): void {
    this._lines.set([]);
  }
}

function readInitial(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { lines?: CartLine[] };
    return Array.isArray(parsed.lines) ? parsed.lines : [];
  } catch {
    return [];
  }
}

function readTable(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { table?: string };
    return parsed.table ?? '';
  } catch {
    return '';
  }
}
