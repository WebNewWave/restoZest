import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService, MenuService, formatPrice, plural } from '@zest/shared';
import { Reveal } from '../../shared/reveal';
import { UiService } from '../../shared/ui';
import { DishCard } from '../../ui/dish-card/dish-card';

@Component({
  selector: 'zest-menu-page',
  imports: [FormsModule, Reveal, DishCard],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage implements OnInit {
  private readonly menu = inject(MenuService);
  protected readonly cart = inject(CartService);
  protected readonly ui = inject(UiService);

  protected readonly query = signal('');
  protected readonly active = signal<string>('all');

  protected readonly loading = this.menu.loading;
  protected readonly currency = this.menu.currency;
  protected readonly categories = this.menu.categories;
  protected readonly positions = computed(() => this.menu.totalPositions());

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cats = this.menu.categories();
    const scoped = this.active() === 'all' ? cats : cats.filter((c) => c.id === this.active());
    if (!q) return scoped;
    return scoped
      .map((c) => ({ ...c, items: c.items.filter((i) => i.name.toLowerCase().includes(q)) }))
      .filter((c) => c.items.length > 0);
  });

  protected readonly found = computed(() =>
    this.visible().reduce((sum, c) => sum + c.items.length, 0)
  );

  protected readonly foundLabel = computed(() => {
    const n = this.found();
    return `${n} ${plural(n, 'позиция', 'позиции', 'позиций')}`;
  });

  protected readonly price = computed(() => (v: number) => formatPrice(v, this.currency()));

  ngOnInit(): void {
    void this.menu.load();
  }

  protected pick(id: string): void {
    this.active.set(id);
    this.query.set('');
  }

  protected scrollTo(id: string): void {
    const el = document.getElementById(`cat-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
