import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Плавное появление блока при попадании в область просмотра.
 * Ставится как атрибут: <div zestReveal> или <div [zestReveal]="120"> (задержка в мс).
 * Работает без зон, потому что меняет только класс на элементе.
 */
@Directive({ selector: '[zestReveal]' })
export class Reveal implements OnInit, OnDestroy {
  readonly delay = input(0, { alias: 'zestReveal', transform: (v: number | string) => Number(v) || 0 });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const el = this.host.nativeElement;
    el.classList.add('reveal');
    el.style.setProperty('--reveal-delay', `${this.delay()}ms`);

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          this.observer?.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );
    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
