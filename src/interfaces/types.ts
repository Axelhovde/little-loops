// src/interfaces/types.ts

export const NECKLACE_SIZES = ['14"', '16"', '18"', '20"', '22"', '24"'];
export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const ITEM_TYPES = ['necklace', 'bracelet', 'earring', 'other', 'knitting_pattern'] as const;
export type ItemType = typeof ITEM_TYPES[number];

export const JEWELRY_TYPES: ItemType[] = ['necklace', 'bracelet', 'earring', 'other'];
export const KNITTING_TYPES: ItemType[] = ['knitting_pattern'];

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

  quantity?: number;
  sizeQuantities?: Record<string, number>;
  ishidden?: boolean;
  createdAt?: string;
  isNew: boolean;

  material_care_id?: number;
  material_care?: MaterialCareGuide;
  collection_id?: number;
  collection?: Collection;
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
  ishidden?: boolean;
  collection_id?: number | null;
  material_care_id?: number | null;
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
  stockQuantity?: number;
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

export interface Collection {
  collection_id: number;
  name: string;
  description?: string;
  created_at: string;
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
  status: 'pending_payment' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status?: 'paid' | 'failed' | null;
  stripe_payment_intent_id?: string | null;
  total_price: number;
  order_date: string;      // existing column name in DB
  created_at: string;
  order_items?: OrderItem[];
}
