import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService, RestaurantService } from '@zest/shared';
import { UiService } from '../../shared/ui';

interface NavLink {
  label: string;
  link: string;
  fragment?: string;
  query?: Record<string, string>;
}

@Component({
  selector: 'zest-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header implements OnInit {
  protected readonly cart = inject(CartService);
  protected readonly ui = inject(UiService);
  private readonly restaurant = inject(RestaurantService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly phone = computed(() => this.restaurant.phone());
  protected readonly phoneHref = computed(() => this.restaurant.phoneHref());
  protected readonly solid = signal(false);

  /** «Горская кухня» — отдельный вход в меню по метке: то, чего нет у сетевых. */
  protected readonly links: NavLink[] = [
    { label: 'Горская кухня', link: '/menu', query: { tag: 'national' } },
    { label: 'Меню и цены', link: '/menu' },
    { label: 'Мангал', link: '/menu', fragment: 'cat-mangal' },
    { label: 'Свадьбы', link: '/events' },
    { label: 'Заказ со стола', link: '/', fragment: 'qr' },
  ];

  ngOnInit(): void {
    const onScroll = () => this.solid.set(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
  }
}
