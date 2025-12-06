export interface ItemPhoto {
  photo_id: number;
  photo_url: string;
  display_order: number;
}

export interface ItemColor {
  id: number;
  name: string;
  hex?: string;
  photos: ItemPhoto[];   // <-- FIXED
}

export interface Item {
  id: number;
  title: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  colors: ItemColor[];
  ishidden?: boolean;
}
