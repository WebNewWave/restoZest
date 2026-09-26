import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  CartService,
  MenuService,
  ORDER_STATUS_LABEL,
  OrderService,
  RestaurantService,
  formatPrice,
  formatTime,
} from '@zest/shared';
import { UiService } from '../../shared/ui';
import { DishCard } from '../../ui/dish-card/dish-card';

/**
 * Экран гостя, открывшийся по QR-коду со стола.
 * Номер стола берётся из адреса (/t/7), поэтому заказ всегда уходит с правильным столом.
 */
@Component({
  selector: 'zest-table-page',
  imports: [FormsModule, RouterLink, DishCard],
  templateUrl: './table.html',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly menu = inject(MenuService);
  private readonly restaurant = inject(RestaurantService);

  protected readonly cart = inject(CartService);
  protected readonly ui = inject(UiService);
  protected readonly orders = inject(OrderService);

  protected readonly table = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('table') ?? '1')),
    { initialValue: '1' }
  );

  protected readonly query = signal('');
  protected readonly active = signal<string>('all');
  protected readonly nationalOnly = signal(false);

  protected readonly categories = this.menu.categories;
  protected readonly loading = this.menu.loading;
  protected readonly currency = this.menu.currency;
  protected readonly restaurantName = this.restaurant.name;
  protected readonly phone = this.restaurant.phone;
  protected readonly phoneHref = this.restaurant.phoneHref;

  protected readonly price = computed(() => (v: number) => formatPrice(v, this.currency()));

  protected readonly nationalCount = computed(
    () => this.menu.allItems().filter((i) => i.tags?.includes('национальное')).length
  );

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const onlyNational = this.nationalOnly();
    const cats = this.menu.categories();
    const scoped = this.active() === 'all' ? cats : cats.filter((c) => c.id === this.active());

    return scoped
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => {
          if (onlyNational && !i.tags?.includes('национальное')) return false;
          if (q && !i.name.toLowerCase().includes(q)) return false;
          return true;
        }),
      }))
      .filter((c) => c.items.length > 0);
  });

  /** Заказы, отправленные именно с этого стола — гость видит их статус. */
  protected readonly myOrders = computed(() =>
    this.orders
      .orders()
      .filter((o) => o.table === this.table())
      .slice(0, 4)
  );

  protected readonly statusLabel = ORDER_STATUS_LABEL;
  protected readonly formatTime = formatTime;

  constructor() {
    effect(() => {
      const table = this.table();
      if (table) this.cart.setTable(table);
    });
  }

  ngOnInit(): void {
    void this.menu.load();
    void this.restaurant.load();
    void this.orders.start();
  }

  protected pick(id: string): void {
    this.active.set(id);
    this.query.set('');
  }

  protected toggleNational(): void {
    this.nationalOnly.update((v) => !v);
    this.active.set('all');
  }
}
