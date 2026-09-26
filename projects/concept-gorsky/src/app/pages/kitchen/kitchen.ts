import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ORDER_STATUS_LABEL,
  OrderService,
  RestaurantService,
  formatPrice,
  formatTime,
  plural,
  type Order,
  type OrderStatus,
} from '@zest/shared';

@Component({
  selector: 'zest-kitchen-page',
  imports: [RouterLink],
  templateUrl: './kitchen.html',
  styleUrl: './kitchen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenPage implements OnInit {
  protected readonly orders = inject(OrderService);
  private readonly restaurant = inject(RestaurantService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly now = signal(Date.now());
  protected readonly statusLabel = ORDER_STATUS_LABEL;
  protected readonly price = computed(() => (v: number) => formatPrice(v, '₽'));

  protected readonly columns = computed(() => {
    const all = this.orders.orders();
    return [
      { id: 'new' as OrderStatus, title: 'Новые', hint: 'нужно принять', items: all.filter((o) => o.status === 'new') },
      {
        id: 'cooking' as OrderStatus,
        title: 'На угле и плите',
        hint: 'готовятся сейчас',
        items: all.filter((o) => o.status === 'cooking'),
      },
      {
        id: 'served' as OrderStatus,
        title: 'Поданы',
        hint: 'сегодня',
        items: all.filter((o) => o.status === 'served' || o.status === 'paid').slice(0, 12),
      },
    ];
  });

  protected readonly activeCount = computed(
    () => this.orders.orders().filter((o) => o.status === 'new' || o.status === 'cooking').length
  );

  protected readonly totalToday = computed(() => this.orders.orders().length);
  protected readonly restaurantName = this.restaurant.name;

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 20_000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  ngOnInit(): void {
    void this.restaurant.load();
    void this.orders.start();
  }

  protected itemsCount(order: Order): number {
    return order.lines.reduce((sum, l) => sum + l.qty, 0);
  }

  protected itemsLabel(order: Order): string {
    const n = this.itemsCount(order);
    return `${n} ${plural(n, 'порция', 'порции', 'порций')}`;
  }

  protected elapsed(order: Order): string {
    const minutes = Math.max(0, Math.floor((this.now() - new Date(order.createdAt).getTime()) / 60000));
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ч ${minutes % 60} мин`;
  }

  protected isLate(order: Order): boolean {
    return order.status === 'new' && this.now() - new Date(order.createdAt).getTime() > 5 * 60_000;
  }

  /** Есть ли в заказе горская классика — кухня видит это до открытия состава. */
  protected hasNational(order: Order): boolean {
    return order.lines.some((l) => l.item.tags?.includes('национальное'));
  }

  protected time(iso: string): string {
    return formatTime(iso);
  }

  protected next(status: OrderStatus): OrderStatus | null {
    if (status === 'new') return 'cooking';
    if (status === 'cooking') return 'served';
    return null;
  }

  protected advance(order: Order): void {
    const target = this.next(order.status);
    if (target) void this.orders.setStatus(order.id, target);
  }

  protected markPaid(order: Order): void {
    void this.orders.setStatus(order.id, 'paid');
  }
}
