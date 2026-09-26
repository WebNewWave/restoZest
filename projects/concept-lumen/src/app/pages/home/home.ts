import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService, MenuService, RestaurantService, formatPrice, plural } from '@zest/shared';
import { Reveal } from '../../shared/reveal';
import { UiService } from '../../shared/ui';
import { DishCard } from '../../ui/dish-card/dish-card';

interface BookingForm {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  occasion: string;
}

/**
 * Главная «Lumen» начинается не с фотографии, а с меню: поиск, категории и хиты
 * с ценами и кнопкой «плюс». Гость попадает на страницу — и сразу может заказать.
 */
@Component({
  selector: 'zest-home',
  imports: [RouterLink, FormsModule, Reveal, DishCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly restaurant = inject(RestaurantService);
  private readonly menu = inject(MenuService);
  private readonly router = inject(Router);

  protected readonly cart = inject(CartService);
  protected readonly ui = inject(UiService);

  protected readonly data = this.restaurant.data;
  protected readonly categories = this.menu.categories;
  protected readonly currency = this.menu.currency;
  protected readonly positions = computed(() => this.menu.totalPositions());
  protected readonly loading = this.menu.loading;

  protected readonly price = computed(() => (v: number) => formatPrice(v, this.currency()));

  /** Поиск в первом экране ведёт на страницу меню с уже подставленным запросом. */
  protected readonly query = signal('');

  /** В хиты выносим то, что ресторан отмечает сам, но не больше восьми строк. */
  protected readonly hits = computed(() => this.menu.hits().slice(0, 8));

  /** Категории для быстрого перехода: название, число позиций и три примера. */
  protected readonly categoryCards = computed(() =>
    this.menu.categories().map((c) => ({
      id: c.id,
      name: c.name,
      count: c.items.length,
      sample: c.items.slice(0, 3).map((i) => i.name).join(' · '),
      from: c.items.length ? Math.min(...c.items.map((i) => i.price)) : 0,
    }))
  );

  protected readonly facts = computed(() => [
    { label: 'Позиций в меню', value: String(this.positions()) },
    { label: 'Ежедневно', value: this.data()?.hours?.everyday ?? '10:00 – 23:00' },
    { label: 'Завтраки', value: this.data()?.hours?.breakfast ?? '10:00 – 14:00' },
    { label: 'Средний чек', value: this.data()?.metrics?.averageBill ?? '800 – 1500 ₽' },
  ]);

  /** Немного декора — но только там, где он помогает решить, а не просто украшает. */
  protected readonly atmosphere = [
    { src: 'img/instagram/06-reel-DdPJDFOoE-U.jpg', alt: 'Гости с букетами в зале Zest Resto' },
    { src: 'img/instagram/02-reel-Ddrjx6DILDU.jpg', alt: 'Блюдо на мангале, живой уголь' },
    { src: 'img/instagram/03-reel-DdjpF0ZIAmA.jpg', alt: 'Свадебное оформление зала' },
    { src: 'img/instagram/12-photo-DcteRo6iDnw.jpg', alt: 'Судак со спаржей и томатами кимчи' },
  ];

  protected readonly deliveryShot = 'img/instagram/11-reel-DcyaobvRuRI.jpg';
  protected readonly bookingShot = 'img/instagram/09-reel-Dc6UZVOIrp0.jpg';
  protected readonly tableQr = 'img/qr/table-7.svg';

  protected readonly deliverySteps = [
    { n: '01', title: 'Выбираете блюда', text: 'Меню и цены — на сайте, без звонка и уточнений.' },
    { n: '02', title: 'Звоните или заказываете со стола', text: 'Принимаем заказ по телефону и через QR на столе.' },
    { n: '03', title: 'Забираете или ждёте курьера', text: 'Самовывоз с Красноярской, 5 либо доставка по городу.' },
  ];

  protected readonly qrSteps = [
    { n: '01', title: 'Сканируете QR на столе', text: 'Открывается меню именно этого стола — в браузере, без установки.' },
    { n: '02', title: 'Собираете заказ', text: 'Видите состав и цены, корзина сразу считает сумму.' },
    { n: '03', title: 'Кухня получает заказ', text: 'С номером стола и пожеланиями — без переспрашивания.' },
  ];

  protected readonly booking = signal<BookingForm>({
    name: '',
    phone: '',
    date: '',
    time: '19:00',
    guests: '2',
    occasion: 'Ужин',
  });
  protected readonly booked = signal(false);
  protected readonly occasions = ['Завтрак', 'Обед', 'Ужин', 'Деловая встреча', 'День рождения', 'Банкет'];

  ngOnInit(): void {
    void this.menu.load();
    void this.restaurant.load();
  }

  protected search(): void {
    const q = this.query().trim();
    void this.router.navigate(['/menu'], q ? { queryParams: { q } } : {});
  }

  protected openCategory(id: string): void {
    void this.router.navigate(['/menu'], { fragment: `cat-${id}` });
  }

  protected setField(field: keyof BookingForm, value: string): void {
    this.booking.update((b) => ({ ...b, [field]: value }));
  }

  protected submitBooking(): void {
    this.booked.set(true);
    this.ui.showToast('Заявка на бронь принята — перезвоним для подтверждения');
  }

  protected guestsLabel(): string {
    const n = Number(this.booking().guests) || 0;
    return `${n} ${plural(n, 'гость', 'гостя', 'гостей')}`;
  }
}
