import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { MenuService, RestaurantService } from '@zest/shared';
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { CartDrawer } from './ui/cart-drawer/cart-drawer';

@Component({
  selector: 'zest-root',
  imports: [RouterOutlet, Header, Footer, CartDrawer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly menu = inject(MenuService);
  private readonly restaurant = inject(RestaurantService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** На странице стола и на экране кухни свой интерфейс — общая шапка там мешает. */
  protected readonly chrome = computed(() => {
    const url = this.url();
    return !url.startsWith('/t/') && !url.startsWith('/kitchen');
  });

  ngOnInit(): void {
    void this.menu.load();
    void this.restaurant.load();
  }
}
