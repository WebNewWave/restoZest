import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

interface DishGroup {
  id: string;
  title: string;
  note: string;
  items: { id: string; name: string; price: number; hit?: boolean; tags?: string[] }[];
}

/**
 * Главная «Горского кода».
 *
 * В меню ресторана дагестанская классика лежит вперемешку с европейской.
 * Здесь она собрана в одно место и вынесена в первый экран — это и есть
 * отличие от сетевых ресторанов.
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

  protected readonly cart = inject(CartService);
  protected readonly ui = inject(UiService);

  protected readonly data = this.restaurant.data;
  protected readonly categories = this.menu.categories;
  protected readonly currency = this.menu.currency;
  protected readonly loading = this.menu.loading;
  protected readonly positions = computed(() => this.menu.totalPositions());

  protected readonly price = computed(() => (v: number) => formatPrice(v, this.currency()));

  /** Все блюда с меткой «национальное» — ядро концепта. */
  protected readonly national = computed(() =>
    this.menu.allItems().filter((i) => i.tags?.includes('национальное'))
  );
  protected readonly nationalCount = computed(() => this.national().length);

  private readonly cat = (id: string) =>
    this.menu.categories().find((c) => c.id === id)?.items ?? [];
  private readonly nationalIn = (id: string) =>
    this.cat(id).filter((i) => i.tags?.includes('национальное'));

  /**
   * Горская классика по группам. Все блюда с меткой «национальное» разложены
   * по этим группам — ни одно не теряется среди европейских позиций.
   */
  protected readonly groups = computed<DishGroup[]>(() => [
    {
      id: 'dough',
      title: 'Тесто: чуду, хинкал, курзе',
      note: 'Лепёшки жарим на сухой сковороде, хинкал варим под заказ',
      items: this.cat('flour'),
    },
    {
      id: 'hot',
      title: 'Горячее и супы',
      note: 'Сюзме, горский суп и лакский хинкал с томлёной телятиной',
      items: [
        ...this.nationalIn('hot'),
        ...this.nationalIn('soups'),
        ...this.nationalIn('pasta'),
      ],
    },
    {
      id: 'morning',
      title: 'Утро по-дагестански',
      note: 'Завтраки подаём с 10:00 до 14:00',
      items: this.nationalIn('breakfast'),
    },
    {
      id: 'bread',
      title: 'Хлеб и напитки',
      note: 'Фесели, рычал су и тбау — то, что не встретишь в сетевых',
      items: [...this.nationalIn('bread'), ...this.nationalIn('drinks')],
    },
    {
      id: 'sweet',
      title: 'Местные десерты',
      note: 'Мехкют, натуфа, исита — лучше попробовать, чем читать описание',
      items: this.nationalIn('desserts'),
    },
  ]);

  /** Мангал выносим отдельно: он и есть вторая половина горской кухни. */
  protected readonly grill = computed(() => this.cat('mangal'));
  protected readonly grillPreview = computed(() => this.grill().slice(0, 8));

  /** Короткий разбор названий — то, что гость хочет понять до заказа. */
  protected readonly glossary = [
    {
      term: 'Чуду',
      text: 'Тонкая лепёшка с начинкой, которую жарят на сухой сковороде. Бывает с мясом, зеленью, тыквой и творогом.',
    },
    {
      term: 'Хинкал',
      text: 'Не путать с хинкали. Это варёное тесто — тонкое или толстое, — которое едят с мясом и бульоном. У нас четыре вида: тонкий, аварский, даргинский и лакский с томлёной телятиной.',
    },
    {
      term: 'Курзе',
      text: 'Дагестанские «пельмени» с защипленным косичкой краем. В меню — с мясом и с творожным сыром и мятой.',
    },
    {
      term: 'Рычал су',
      text: 'Минеральная вода из источника Рычал-Су в Дагестане. Подаём как самостоятельный напиток.',
    },
  ];

  protected readonly heroShot = 'img/instagram/12-photo-DcteRo6iDnw.jpg';
  protected readonly grillShot = 'img/instagram/11-reel-DcyaobvRuRI.jpg';
  protected readonly weddingShot = 'img/instagram/03-reel-DdjpF0ZIAmA.jpg';
  protected readonly tableQr = 'img/qr/gorsky/table-7.svg';

  protected readonly facts = computed(() => [
    { label: 'Горских блюд', value: String(this.nationalCount()) },
    { label: 'Всего в меню', value: String(this.positions()) },
    { label: 'Ежедневно', value: this.data()?.hours?.everyday ?? '10:00 – 23:00' },
    { label: 'Средний чек', value: this.data()?.metrics?.averageBill ?? '800 – 1500 ₽' },
  ]);

  protected readonly booking = signal<BookingForm>({
    name: '',
    phone: '',
    date: '',
    time: '19:00',
    guests: '2',
    occasion: 'Ужин',
  });
  protected readonly booked = signal(false);
  protected readonly occasions = ['Ужин', 'Завтрак', 'Свадьба', 'Сватовство', 'День рождения', 'Банкет'];

  ngOnInit(): void {
    void this.menu.load();
    void this.restaurant.load();
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
