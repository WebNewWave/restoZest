export interface MenuItem {
  id: string;
  name: string;
  price: number;
  hit?: boolean;
  tags?: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  note?: string;
  items: MenuItem[];
}

export interface Menu {
  source: string;
  currency: string;
  categories: MenuCategory[];
}

export interface CartLine {
  item: MenuItem;
  qty: number;
}

export type OrderStatus = 'new' | 'cooking' | 'served' | 'paid';

export interface Order {
  id: string;
  table: string;
  lines: CartLine[];
  total: number;
  status: OrderStatus;
  comment?: string;
  createdAt: string;
}

export interface RestaurantEvent {
  id: string;
  title: string;
  text: string;
}

export interface VisualAsset {
  file: string;
  what: string;
}

export interface Restaurant {
  brand: {
    name: string;
    nameShort: string;
    handle: string;
    tagline: string;
    positioning: string;
    logoFontNote: string;
  };
  contacts: {
    phone: string;
    phoneHref: string;
    instagram: string;
    address: string;
    addressFull: string;
    district: string;
    landmark: string;
    coords: { lat: number; lng: number };
    mapNote: string;
  };
  hours: { everyday: string; breakfast: string; note: string };
  metrics: { instagramFollowers: number; instagramPosts: number; averageBill: string };
  features: string[];
  events: RestaurantEvent[];
  signatureDishes: { name: string; price: number; note?: string }[];
  visualAssets: { instagram: VisualAsset[]; limitation: string };
  brandPalette: Record<string, string>;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Новый',
  cooking: 'Готовится',
  served: 'Подан',
  paid: 'Оплачен',
};
