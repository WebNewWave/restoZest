import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuService, RestaurantService } from '@zest/shared';

@Component({
  selector: 'zest-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  private readonly restaurant = inject(RestaurantService);
  private readonly menu = inject(MenuService);

  protected readonly data = this.restaurant.data;
  protected readonly positions = computed(() => this.menu.totalPositions());

  /** В подвале — только первые категории: остальное живёт на странице меню. */
  protected readonly topCategories = computed(() => this.menu.categories().slice(0, 6));

  protected readonly year = new Date().getFullYear();
}
