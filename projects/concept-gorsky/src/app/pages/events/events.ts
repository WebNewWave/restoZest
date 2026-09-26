import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RestaurantService } from '@zest/shared';
import { Reveal } from '../../shared/reveal';
import { UiService } from '../../shared/ui';

@Component({
  selector: 'zest-events-page',
  imports: [RouterLink, FormsModule, Reveal],
  templateUrl: './events.html',
  styleUrl: './events.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage implements OnInit {
  private readonly restaurant = inject(RestaurantService);
  protected readonly ui = inject(UiService);

  protected readonly data = this.restaurant.data;
  protected readonly events = this.restaurant.events;

  protected readonly heroShot = 'img/instagram/03-reel-DdjpF0ZIAmA.jpg';
  protected readonly guestsShot = 'img/instagram/06-reel-DdPJDFOoE-U.jpg';
  protected readonly tableShot = 'img/instagram/09-reel-Dc6UZVOIrp0.jpg';

  /** Что ресторан берёт на себя при организации торжества. */
  protected readonly included = [
    { title: 'Зал и кабины', text: 'Основной зал для большой семьи и отдельные кабины для тихого разговора.' },
    { title: 'Банкетное меню', text: 'Собираем стол из горской классики и мангала под число гостей и бюджет.' },
    { title: 'Мангал на месте', text: 'Шашлык и овощи готовим на живом угле, без разогрева и доставки.' },
    { title: 'Оформление зала', text: 'Драпировки, цветочные композиции, свечи и сервировка.' },
    { title: 'Ведущий и DJ', text: 'Подберём под формат вечера — от тихого семейного до большого.' },
    { title: 'Свадебный приём', text: 'Полный цикл: встреча гостей, подача, тайминг вечера.' },
  ];

  protected readonly steps = [
    { n: '01', title: 'Заявка', text: 'Оставляете дату, повод и примерное число гостей.' },
    { n: '02', title: 'Звонок', text: 'Уточняем детали и предлагаем варианты зала и меню.' },
    { n: '03', title: 'Дегустация', text: 'Приезжаете, пробуете блюда и утверждаете подачу.' },
    { n: '04', title: 'Праздник', text: 'Ведём вечер: кухня, официанты, оформление — наша забота.' },
  ];

  protected readonly form = signal({ name: '', phone: '', date: '', guests: '', occasion: 'Свадьба', note: '' });
  protected readonly sent = signal(false);
  protected readonly occasions = ['Свадьба', 'Сватовство', 'День рождения', 'Корпоратив', 'Банкет', 'Деловая встреча'];

  protected readonly phone = computed(() => this.data()?.contacts?.phone ?? '');
  protected readonly phoneHref = computed(() => this.data()?.contacts?.phoneHref ?? '');

  ngOnInit(): void {
    void this.restaurant.load();
  }

  protected setField(field: 'name' | 'phone' | 'date' | 'guests' | 'occasion' | 'note', value: string): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  protected submit(): void {
    this.sent.set(true);
    this.ui.showToast('Заявка на мероприятие принята');
  }
}
