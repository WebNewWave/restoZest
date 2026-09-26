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

  /** Сколько в меню блюд с меткой «национальное» — это и есть горская классика. */
  protected readonly nationalCount = computed(
    () => this.menu.allItems().filter((i) => i.tags?.includes('национальное')).length
  );

  protected readonly nationalList = computed(() =>
    this.menu
      .allItems()
      .filter((i) => i.tags?.includes('национальное'))
      .slice(0, 7)
  );

  protected readonly year = new Date().getFullYear();
}
