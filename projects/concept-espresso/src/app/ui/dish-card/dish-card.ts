import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CartService, formatPrice, type MenuItem } from '@zest/shared';

/** Карточка блюда: название, теги, цена и быстрый шаг количества. */
@Component({
  selector: 'zest-dish',
  templateUrl: './dish-card.html',
  styleUrl: './dish-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DishCard {
  readonly item = input.required<MenuItem>();
  readonly currency = input('₽');

  protected readonly cart = inject(CartService);

  protected readonly qty = computed(() => this.cart.qtyOf(this.item().id));
  protected readonly priceText = computed(() => formatPrice(this.item().price, this.currency()));
}
