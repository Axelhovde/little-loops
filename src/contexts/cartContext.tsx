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

    getCartItems(userId).then((data) => {
      const mapped: CartItem[] = (data ?? []).map((row: any) => {
        const sizes: string[] = row.items?.sizes ?? [];
        const selectedSize: string | undefined = row.selected_size || undefined;
        const hasSizes = sizes.length > 0;

        // Resolve stock from DB so the cart page + button can enforce limits
        let stockQuantity: number | undefined;
        if (hasSizes && selectedSize) {
          const sizeRow = (row.items?.item_size_quantities ?? []).find(
            (sq: any) => sq.size === selectedSize
          );
          stockQuantity = sizeRow?.quantity;
        } else if (!hasSizes) {
          stockQuantity = row.items?.quantity;
        }

        return {
          itemId: row.item_id,
          title: row.items?.item_name ?? "",
          price: row.items?.price ?? 0,
          quantity: row.quantity,
          photo: row.items?.item_photos
            ?.sort((a: any, b: any) => a.display_order - b.display_order)[0]
            ?.photo_url ?? "",
          selectedSize,
          hasSizes,
          stockQuantity,
        };
      });
      setItems(mapped);
    }).catch(console.error);
  }, [userId]);

  const addItem = async (item: CartItem) => {
    const sizeKey = item.selectedSize ?? "";
    const existing = items.find(
      (i) => i.itemId === item.itemId && i.selectedSize === item.selectedSize
    );
    const newQty = existing ? existing.quantity + item.quantity : item.quantity;

    if (item.stockQuantity !== undefined && newQty > item.stockQuantity) {
      throw new Error(`Max available quantity is ${item.stockQuantity}`);
    }

    if (userId) {
      await upsertCartItem(userId, item.itemId, newQty, sizeKey);
    }

    setItems((prev) => {
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.itemId && i.selectedSize === item.selectedSize
            ? { ...i, quantity: newQty, stockQuantity: item.stockQuantity ?? i.stockQuantity }
            : i
        );
      }
      return [...prev, { ...item, quantity: newQty }];
    });
  };

  const updateQuantity = async (itemId: number, qty: number, selectedSize?: string) => {
    if (qty <= 0) return removeItem(itemId, selectedSize);

    const current = items.find(
      (i) => i.itemId === itemId && i.selectedSize === selectedSize
    );
    const cappedQty =
      current?.stockQuantity !== undefined
        ? Math.min(qty, current.stockQuantity)
        : qty;

    if (userId) {
      await upsertCartItem(userId, itemId, cappedQty, selectedSize ?? "");
    }

    setItems((prev) =>
      prev.map((i) =>
        i.itemId === itemId && i.selectedSize === selectedSize
          ? { ...i, quantity: cappedQty }
          : i
      )
    );
  };

  const removeItem = async (itemId: number, selectedSize?: string) => {
    if (userId) {
      await removeCartItem(userId, itemId, selectedSize ?? "");
    }
    setItems((prev) =>
      prev.filter(
        (i) => !(i.itemId === itemId && i.selectedSize === selectedSize)
      )
    );
  };

  const clearCart = () => setItems([]);

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
