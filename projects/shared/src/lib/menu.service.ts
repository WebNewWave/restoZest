import { Injectable, computed, signal } from '@angular/core';
import type { Menu, MenuCategory, MenuItem } from './models';

/** Загружает меню из data/menu.json. Файл лежит рядом с сайтом, поэтому ресторан может править его без разработчика. */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly _menu = signal<Menu | null>(null);
  private readonly _loading = signal(true);
  private readonly _error = signal<string | null>(null);
  private started = false;

  readonly menu = this._menu.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly categories = computed<MenuCategory[]>(() => this._menu()?.categories ?? []);
  readonly currency = computed(() => this._menu()?.currency === 'RUB' ? '₽' : (this._menu()?.currency ?? '₽'));

  readonly allItems = computed<MenuItem[]>(() =>
    this.categories().flatMap((c) => c.items.map((i) => ({ ...i, category: c.name })))
  );

  readonly hits = computed<MenuItem[]>(() => this.allItems().filter((i) => i.hit));

  readonly totalPositions = computed(() => this.allItems().length);

  async load(): Promise<void> {
    if (this.started) return;
    this.started = true;
    try {
      const res = await fetch('data/menu.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Menu;
      this._menu.set(data);
    } catch (e) {
      this._error.set(e instanceof Error ? e.message : 'Не удалось загрузить меню');
    } finally {
      this._loading.set(false);
    }
  }

  itemById(id: string): MenuItem | undefined {
    return this.allItems().find((i) => i.id === id);
  }

  search(query: string, categoryId: string | 'all'): MenuItem[] {
    const q = query.trim().toLowerCase();
    const cats = this.categories();
    const pool = categoryId === 'all' ? cats : cats.filter((c) => c.id === categoryId);
    const items = pool.flatMap((c) => c.items);
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }
}
