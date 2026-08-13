import { supabase } from "@/helper/supabaseClient";
import type { CartItem, Order } from "@/interfaces/types";

export async function placeOrder(
  profileId: string,
  userEmail: string,
  items: CartItem[],
  totalPrice: number
): Promise<number> {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      profile_id: profileId,
      user_email: userEmail,
      status: "pending",
      total_price: totalPrice,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = items.map((item) => ({
    order_id: order.order_id,
    item_id: item.itemId,
    quantity: item.quantity,
    price_per_item: item.price,
    selected_size: item.selectedSize ?? null,
    item_name: item.title,
    item_photo: item.photo ?? null,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) throw itemsError;

  await supabase
    .from("shopping_cart_items")
    .delete()
    .eq("cart_id", profileId);

  return order.order_id as number;
}

export async function getUserOrders(profileId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function getAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function updateOrderStatus(
  orderId: number,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("order_id", orderId);

  if (error) throw error;
}

export async function getOrderStats() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("status, total_price, created_at, order_items(quantity, price_per_item, item_name)");

  if (error) throw error;

  const totalOrders = orders?.length ?? 0;
  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_price), 0) ?? 0;

  const byStatus: Record<string, number> = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  orders?.forEach((o) => {
    if (byStatus[o.status] !== undefined) byStatus[o.status]++;
  });

  const itemsSold =
    orders?.reduce((sum, o) => {
      return (
        sum +
        ((o.order_items as any[]) ?? []).reduce(
          (s: number, i: any) => s + i.quantity,
          0
        )
      );
    }, 0) ?? 0;

  const revenueByMonth: Record<string, number> = {};
  orders?.forEach((o) => {
    const month = o.created_at.slice(0, 7); // YYYY-MM
    revenueByMonth[month] = (revenueByMonth[month] ?? 0) + Number(o.total_price);
  });

  return { totalOrders, totalRevenue, byStatus, itemsSold, revenueByMonth };
}
