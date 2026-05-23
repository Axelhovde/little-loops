// src/interfaces/types.ts

export const NECKLACE_SIZES = ['14"', '16"', '18"', '20"', '22"', '24"'];
export const ITEM_TYPES = ['necklace', 'bracelet', 'earring', 'other'] as const;
export type ItemType = typeof ITEM_TYPES[number];

export interface ItemPhoto {
  photo_id: number;
  photo_url: string;
  display_order: number;
}

export interface ItemColor {
  id: number;
  name: string;
  hex?: string;
  photos: ItemPhoto[];
}

export interface Item {
  id: number;
  title: string;
  description: string;
  price: number;
  colors: ItemColor[];
  photos: ItemPhoto[];
  sizes: string[];
  item_type: string;

  rating?: number;
  reviews?: number;

  ishidden?: boolean;
  createdAt?: string;
  isNew: boolean;

  material_care_id?: number;
  material_care?: MaterialCareGuide;
}

export type AdminItem = {
  item_id: number;
  item_name: string;
  description: string;
  price: number;
  quantity: number;
  sizes: string[];
  item_type: string;
  created_at?: string;
};

export type AdminItemColor = {
  item_color_id: number;
  color_id: number;
};

export type AdminPhoto = {
  photo_id: number;
  item_color_id: number;
  photo_url: string;
};

export interface CartItem {
  itemId: number;
  title: string;
  price: number;
  quantity: number;
  photo: string;
  selectedSize?: string;
}

export interface CartItemDB {
  cart_id: string;
  item_id: number;
  quantity: number;
  added_at: string;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;        // serial integer in DB
  item_id?: number;
  quantity: number;
  price_per_item: number;  // existing column name in DB
  selected_size?: string;
  item_name: string;
  item_photo?: string;
}

export interface MaterialCareGuide {
  guide_id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface Order {
  order_id: number;        // serial integer in DB
  profile_id: string;      // references profiles.id (= auth.users.id)
  user_email: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_price: number;
  order_date: string;      // existing column name in DB
  created_at: string;
  order_items?: OrderItem[];
}
