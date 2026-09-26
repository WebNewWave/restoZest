import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CartService, formatPrice, type MenuItem } from '@zest/shared';

/**
 * Строка меню. В этом концепте блюда идут плотным списком, а не карточками:
 * гость читает цены сверху вниз и добавляет то, что нужно, не листая галереи.
 */
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
