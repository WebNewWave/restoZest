import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService, MenuService, RestaurantService, formatPrice, plural } from '@zest/shared';
import { Reveal } from '../../shared/reveal';
import { UiService } from '../../shared/ui';

interface GalleryShot {
  file: string;
  what: string;
  src: string;
  /** Куда сместить кадр внутри плитки, чтобы в неё попал нужный фрагмент. */
  position?: string;
}

interface BookingForm {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  occasion: string;
}

@Component({
  selector: 'zest-home',
  imports: [RouterLink, FormsModule, Reveal],
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
  protected readonly positions = computed(() => this.menu.totalPositions());

  protected readonly price = computed(() => (v: number) => formatPrice(v, this.currency()));

  /** Порядок кадров подобран вручную: сначала бренд и атмосфера, потом еда. */
  private static readonly ORDER = [
    '08-reel-DdBOqv4ojNd.jpg',
    '03-reel-DdjpF0ZIAmA.jpg',
    '05-reel-DdTGlUtIa4g.jpg',
    '07-photo-DdBugvxCB93.jpg',
    '11-reel-DcyaobvRuRI.jpg',
    '12-photo-DcteRo6iDnw.jpg',
    '04-photo-Ddek7mmCMoq.jpg',
    '06-reel-DdPJDFOoE-U.jpg',
    '02-reel-Ddrjx6DILDU.jpg',
    '09-reel-Dc6UZVOIrp0.jpg',
    '10-photo-Dcy7yBCIiBw.jpg',
    '01-reel-DaA5anRomGR.jpg',
  ];

  /**
   * Кадрирование там, где сюжет стоит не по центру кадра.
   *
   * У кадра с медальонами (05) снизу в кадр попала размытая рука — сдвигом
   * вверх (22% вместо центра) она уходит за границу плитки.
   */
  private static readonly FOCUS: Record<string, string> = {
    '10-photo-Dcy7yBCIiBw.jpg': '50% 14%',
    '04-photo-Ddek7mmCMoq.jpg': '50% 76%',
    '12-photo-DcteRo6iDnw.jpg': '50% 70%',
    '02-reel-Ddrjx6DILDU.jpg': '50% 42%',
    '05-reel-DdTGlUtIa4g.jpg': '50% 22%',
  };

  protected readonly gallery = computed<GalleryShot[]>(() => {
    const all = this.restaurant.gallery();
    const byFile = new Map(all.map((g) => [g.file, g]));
    return HomePage.ORDER.map((f) => byFile.get(f))
      .filter((g): g is { file: string; what: string } => !!g)
      .map((g) => ({
        ...g,
        src: `img/instagram/${g.file}`,
        position: HomePage.FOCUS[g.file] ?? '50% 50%',
      }));
  });

  protected readonly heroShot = 'img/instagram/01-reel-DaA5anRomGR.jpg';
  protected readonly brandShot = 'img/instagram/08-reel-DdBOqv4ojNd.jpg';
  protected readonly weddingShot = 'img/instagram/03-reel-DdjpF0ZIAmA.jpg';
  protected readonly tableQr = 'img/qr/table-7.svg';

  /**
   * Блюда-визитки.
   *
   * Здесь только те позиции, для которых в профиле нашлось настоящее фото
   * (640×640). Кадры из видео (360×640) в крупную карточку не ставим: на ней
   * 380 px по ширине, и такой кадр растягивается. Карточки «Говяжьи медальоны»
   * и «Блюда с мангала» убраны по этой причине — вернём, когда ресторан
   * пришлёт оригиналы.
   */
  protected readonly signature = [
    { name: 'Стейк Томагавк', price: 1450, note: 'Большой кусок сочного мяса на кости — то, что берут за максимумом', img: 'img/instagram/11-reel-DcyaobvRuRI.jpg' },
    { name: 'Судак со спаржей', price: 640, note: 'Хрустящая спаржа и яркий ромеско с томатами кимчи', img: 'img/instagram/12-photo-DcteRo6iDnw.jpg' },
    { name: 'Индейка с птитим', price: 690, note: 'Насыщенный грибной крем, маринованный романо, пармезан', img: 'img/instagram/07-photo-DdBugvxCB93.jpg' },
    { name: 'Авторский Наполеон', price: 480, note: 'Хрустящие коржи, нежный крем и ягодный акцент', img: 'img/instagram/04-photo-Ddek7mmCMoq.jpg' },
  ];

  protected readonly facts = computed(() => [
    { label: 'Часы', value: this.data()?.hours?.everyday ?? '10:00 – 23:00' },
    { label: 'Завтраки', value: this.data()?.hours?.breakfast ?? '10:00 – 14:00' },
    { label: 'Средний чек', value: this.data()?.metrics?.averageBill ?? '800 – 1500 ₽' },
    { label: 'Позиций в меню', value: String(this.positions()) },
  ]);

  /** Форма брони. Пока демонстрационная: данные никуда не отправляются. */
  protected readonly booking = signal<BookingForm>({
    name: '',
    phone: '',
    date: '',
    time: '19:00',
    guests: '2',
    occasion: 'Ужин',
  });
  protected readonly booked = signal(false);
  protected readonly occasions = ['Ужин', 'Завтрак', 'Деловая встреча', 'День рождения', 'Сватовство', 'Свадьба'];

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
