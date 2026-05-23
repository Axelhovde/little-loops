import { createContext, useContext, useEffect, useState } from "react";
import { getCartItems, upsertCartItem, removeCartItem } from "@/services/cart.service";
import type { CartItem } from "@/interfaces/types";
import { supabase } from "@/helper/supabaseClient";

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  updateQuantity: (itemId: number, qty: number, selectedSize?: string) => Promise<void>;
  removeItem: (itemId: number, selectedSize?: string) => Promise<void>;
  clearCart: () => void;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadCart = async () => {
      const data = await getCartItems(userId);
      const mapped: CartItem[] = (data ?? []).map((row: any) => ({
        itemId: row.item_id,
        title: row.items?.item_name ?? "",
        price: row.items?.price ?? 0,
        quantity: row.quantity,
        photo: row.items?.item_photos
          ?.sort((a: any, b: any) => a.display_order - b.display_order)[0]
          ?.photo_url ?? "",
        selectedSize: row.selected_size || undefined,
      }));
      setItems(mapped);
    };

    loadCart();
  }, [userId]);

  // DB only tracks total quantity per item (not per size).
  // In-memory state tracks per (itemId + selectedSize).
  const getTotalQtyForItem = (
    currentItems: CartItem[],
    itemId: number,
    excludeSize: string | undefined,
    addQty: number
  ) =>
    currentItems
      .filter((i) => i.itemId === itemId && i.selectedSize !== excludeSize)
      .reduce((sum, i) => sum + i.quantity, 0) + addQty;

  const addItem = async (item: CartItem) => {
    const existing = items.find(
      (i) => i.itemId === item.itemId && i.selectedSize === item.selectedSize
    );
    const newQty = existing ? existing.quantity + item.quantity : item.quantity;
    const dbQty = getTotalQtyForItem(items, item.itemId, item.selectedSize, newQty);

    if (userId) {
      await upsertCartItem(userId, item.itemId, dbQty);
    }

    setItems((prev) => {
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.itemId && i.selectedSize === item.selectedSize
            ? { ...i, quantity: newQty }
            : i
        );
      }
      return [...prev, { ...item, quantity: newQty }];
    });
  };

  const updateQuantity = async (
    itemId: number,
    qty: number,
    selectedSize?: string
  ) => {
    if (qty <= 0) return removeItem(itemId, selectedSize);

    const dbQty = getTotalQtyForItem(items, itemId, selectedSize, qty);

    if (userId) {
      await upsertCartItem(userId, itemId, dbQty);
    }

    setItems((prev) =>
      prev.map((i) =>
        i.itemId === itemId && i.selectedSize === selectedSize
          ? { ...i, quantity: qty }
          : i
      )
    );
  };

  const removeItem = async (itemId: number, selectedSize?: string) => {
    const remaining = items.filter(
      (i) => !(i.itemId === itemId && i.selectedSize === selectedSize)
    );
    const remainingQty = remaining
      .filter((i) => i.itemId === itemId)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (userId) {
      if (remainingQty > 0) {
        await upsertCartItem(userId, itemId, remainingQty);
      } else {
        await removeCartItem(userId, itemId);
      }
    }

    setItems(remaining);
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
