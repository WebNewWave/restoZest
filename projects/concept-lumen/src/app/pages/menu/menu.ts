import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  linkedSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
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
  private readonly route = inject(ActivatedRoute);

  protected readonly cart = inject(CartService);
  protected readonly ui = inject(UiService);

  /** Запрос можно передать ссылкой: /menu?q=чуду — так работает поиск с главной. */
  private readonly urlQuery = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('q') ?? '')),
    { initialValue: '' }
  );

  protected readonly query = linkedSignal(() => this.urlQuery());
  protected readonly active = linkedSignal(() => 'all' as string);

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

  private scrolled = false;

  constructor() {
    /**
     * Ссылки вида /menu#cat-pizza ведут на якорь внутри списка, который появляется
     * только после загрузки данных. Поэтому прокручиваем вручную — один раз.
     */
    effect(() => {
      if (this.loading() || this.scrolled) return;
      const fragment = this.route.snapshot.fragment;
      if (!fragment) return;
      this.scrolled = true;
      requestAnimationFrame(() => {
        document.getElementById(fragment)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  ngOnInit(): void {
    void this.menu.load();
  }

  protected pick(id: string): void {
    this.active.set(id);
    this.query.set('');
  }

  protected clearSearch(): void {
    this.query.set('');
    this.active.set('all');
  }

  protected scrollTo(id: string): void {
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
