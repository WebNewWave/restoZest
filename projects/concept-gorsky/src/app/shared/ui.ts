import { Injectable, signal } from '@angular/core';

/** Мелкое состояние интерфейса: открытые панели и всплывающие подсказки. */
@Injectable({ providedIn: 'root' })
export class UiService {
  readonly cartOpen = signal(false);
  readonly navOpen = signal(false);
  readonly toast = signal<string | null>(null);

  private toastTimer?: ReturnType<typeof setTimeout>;

  openCart(): void {
    this.cartOpen.set(true);
    this.navOpen.set(false);
    this.lockScroll(true);
  }

  closeCart(): void {
    this.cartOpen.set(false);
    this.lockScroll(this.navOpen());
  }

  toggleNav(): void {
    const next = !this.navOpen();
    this.navOpen.set(next);
    if (next) this.cartOpen.set(false);
    this.lockScroll(next || this.cartOpen());
  }

  closeNav(): void {
    this.navOpen.set(false);
    this.lockScroll(this.cartOpen());
  }

  showToast(message: string): void {
    this.toast.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }

  private lockScroll(locked: boolean): void {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = locked ? 'hidden' : '';
  }
}
