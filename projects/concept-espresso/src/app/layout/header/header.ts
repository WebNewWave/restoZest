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

  protected readonly links: NavLink[] = [
    { label: 'Меню', link: '/menu' },
    { label: 'Атмосфера', link: '/', fragment: 'atmosphere' },
    { label: 'Торжества', link: '/events' },
    { label: 'Заказ со стола', link: '/', fragment: 'qr' },
    { label: 'Контакты', link: '/', fragment: 'contacts' },
  ];

  ngOnInit(): void {
    const onScroll = () => this.solid.set(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
  }
}
