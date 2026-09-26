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

/** Метка, которой в меню отмечена дагестанская классика. */
const NATIONAL = 'национальное';

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

  /** Запрос и метку можно передать ссылкой: /menu?q=чуду или /menu?tag=national. */
  private readonly params = toSignal(
    this.route.queryParamMap.pipe(
      map((p) => ({ q: p.get('q') ?? '', tag: p.get('tag') ?? '' }))
    ),
    { initialValue: { q: '', tag: '' } }
  );

  protected readonly query = linkedSignal(() => this.params().q);
  protected readonly nationalOnly = linkedSignal(() => this.params().tag === 'national');
  protected readonly active = linkedSignal(() => 'all' as string);

  protected readonly loading = this.menu.loading;
  protected readonly currency = this.menu.currency;
  protected readonly categories = this.menu.categories;
  protected readonly positions = computed(() => this.menu.totalPositions());

  protected readonly nationalCount = computed(
    () => this.menu.allItems().filter((i) => i.tags?.includes(NATIONAL)).length
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
          if (onlyNational && !i.tags?.includes(NATIONAL)) return false;
          if (q && !i.name.toLowerCase().includes(q)) return false;
          return true;
        }),
      }))
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
     * Ссылки вида /menu#cat-mangal ведут на якорь внутри списка, который появляется
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

  protected toggleNational(): void {
    this.nationalOnly.update((v) => !v);
    this.active.set('all');
    this.query.set('');
  }

  protected clearSearch(): void {
    this.query.set('');
    this.active.set('all');
    this.nationalOnly.set(false);
  }

  protected scrollTo(id: string): void {
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
