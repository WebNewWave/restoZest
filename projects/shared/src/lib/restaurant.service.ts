import { Injectable, computed, signal } from '@angular/core';
import type { Restaurant } from './models';

/** Загружает карточку ресторана из data/restaurant.json — контакты, часы, события, факты. */
@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly _data = signal<Restaurant | null>(null);
  private readonly _loading = signal(true);
  private started = false;

  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly name = computed(() => this._data()?.brand.name ?? 'Zest Resto');
  readonly phone = computed(() => this._data()?.contacts.phone ?? '');
  readonly phoneHref = computed(() => this._data()?.contacts.phoneHref ?? '');
  readonly address = computed(() => this._data()?.contacts.address ?? '');
  readonly instagram = computed(() => this._data()?.contacts.instagram ?? '');
  readonly hours = computed(() => this._data()?.hours.everyday ?? '10:00 – 23:00');
  readonly events = computed(() => this._data()?.events ?? []);
  readonly features = computed(() => this._data()?.features ?? []);
  readonly gallery = computed(() => this._data()?.visualAssets.instagram ?? []);

  async load(): Promise<void> {
    if (this.started) return;
    this.started = true;
    try {
      const res = await fetch('data/restaurant.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this._data.set((await res.json()) as Restaurant);
    } catch {
      this._data.set(null);
    } finally {
      this._loading.set(false);
    }
  }
}
