import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService, MenuService, OrderService, formatPrice, type Order } from '@zest/shared';
import { UiService } from '../../shared/ui';

@Component({
  selector: 'zest-cart-drawer',
  imports: [FormsModule],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartDrawer {
  protected readonly cart = inject(CartService);
  protected readonly ui = inject(UiService);
  private readonly orders = inject(OrderService);
  private readonly menu = inject(MenuService);

  protected readonly submitting = signal(false);
  protected readonly placed = signal<Order | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly comment = signal('');
  protected readonly tableDraft = signal('');

  protected readonly currency = computed(() => this.menu.currency());
  protected readonly price = computed(() => (v: number) => formatPrice(v, this.currency()));

  protected readonly tableLabel = computed(() => {
    const t = this.cart.table() || this.tableDraft();
    return t ? `Стол №${t}` : '';
  });

  protected readonly canSubmit = computed(
    () => !this.cart.isEmpty() && (!!this.cart.table() || this.tableDraft().trim().length > 0)
  );

  protected readonly deliveryNote = computed(() =>
    this.orders.mode === 'supabase'
      ? 'Заказ уходит на кухню ресторана сразу после подтверждения.'
      : 'Демонстрационный режим: заказ появится на экране кухни в соседней вкладке.'
  );

  protected close(): void {
    this.ui.closeCart();
    this.error.set(null);
    if (this.placed()) {
      setTimeout(() => {
        this.placed.set(null);
        this.comment.set('');
      }, 250);
    }
  }

  protected add(itemId: string): void {
    const item = this.menu.itemById(itemId);
    if (item) this.cart.add(item);
  }

  protected async submit(): Promise<void> {
    if (!this.canSubmit() || this.submitting()) return;
    const table = this.cart.table() || this.tableDraft().trim();
    this.submitting.set(true);
    this.error.set(null);
    try {
      const order = await this.orders.submit(table, this.cart.lines(), this.comment());
      this.cart.setTable(table);
      this.placed.set(order);
      this.cart.clear();
      this.ui.showToast('Заказ отправлен на кухню');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Не удалось отправить заказ');
    } finally {
      this.submitting.set(false);
    }
  }

  protected reset(): void {
    this.placed.set(null);
    this.comment.set('');
  }
}
