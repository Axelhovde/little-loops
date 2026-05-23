import SiteNavigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2, CheckCircle, Lock, Sparkles, Truck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/cartContext";
import { placeOrder } from "@/services/orders.service";
import { supabase } from "@/helper/supabaseClient";
import { toast } from "sonner";

const CartPage = () => {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    setPlacing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to place an order.");
        navigate("/login");
        return;
      }

      await placeOrder(user.id, user.email ?? "", items, totalPrice);
      clearCart();
      setPlaced(true);
      toast.success("Order placed! Redirecting to your profile...");
      setTimeout(() => navigate("/profile"), 2000);
    } catch (err: any) {
      console.error("Order failed:", err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNavigation />
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <CheckCircle className="h-16 w-16 text-primary" />
          <h1 className="text-3xl font-serif font-bold text-primary">Order Placed!</h1>
          <p className="text-muted-foreground">
            Thank you! Your order has been received and is being processed.
          </p>
          <Button onClick={() => navigate("/profile")}>View My Orders</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />

      {/* Header */}
      <section className="py-14 px-4 bg-gradient-warm">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-3">
            Checkout
          </h1>
          <p className="text-muted-foreground">Review your order before placing it</p>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-6">Your cart is empty.</p>
              <Button onClick={() => navigate("/store")}>Browse Shop</Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              {/* Items list — kept exactly as designed */}
              <div className="lg:col-span-3 space-y-3">
                <h2 className="font-medium text-muted-foreground mb-4">
                  {items.length} {items.length === 1 ? "item" : "items"} in your cart
                </h2>

                {items.map((cartItem) => (
                  <Card key={cartItem.itemId} variant="plain" className="rounded-none border-b">
                    <CardContent className="flex gap-4 p-4 items-center">
                      {cartItem.photo && (
                        <img
                          src={cartItem.photo}
                          alt={cartItem.title}
                          className="w-20 h-28 object-cover shrink-0"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-sans text-base">{cartItem.title}</h3>
                        {cartItem.selectedSize && (
                          <p className="text-xs text-muted-foreground">
                            Size: {cartItem.selectedSize}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {cartItem.price} NOK each
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            updateQuantity(cartItem.itemId, cartItem.quantity - 1, cartItem.selectedSize)
                          }
                          disabled={cartItem.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center">{cartItem.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            updateQuantity(cartItem.itemId, cartItem.quantity + 1, cartItem.selectedSize)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-medium">{cartItem.price * cartItem.quantity} NOK</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(cartItem.itemId, cartItem.selectedSize)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order summary — sticky sidebar */}
              <div className="lg:col-span-2">
                <div className="sticky top-24 rounded-2xl border bg-white shadow-sm p-8 space-y-6">
                  <h2 className="font-serif text-2xl font-bold text-primary">
                    Order Summary
                  </h2>

                  {/* Line items */}
                  <div className="space-y-3">
                    {items.map((i) => (
                      <div key={i.itemId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {i.title}
                          {i.quantity > 1 && (
                            <span className="ml-1 text-xs">× {i.quantity}</span>
                          )}
                        </span>
                        <span className="font-medium shrink-0 ml-3">
                          {i.price * i.quantity} NOK
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal & shipping */}
                  <div className="border-t pt-4 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{totalPrice} NOK</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <Truck className="h-3.5 w-3.5" />
                        Free
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4 flex justify-between items-baseline">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-3xl font-bold text-primary">{totalPrice} NOK</span>
                  </div>

                  {/* CTA */}
                  <Button
                    className="w-full h-14 text-base font-semibold rounded-xl"
                    onClick={handlePlaceOrder}
                    disabled={placing}
                  >
                    {placing ? "Placing Order..." : "Place Order"}
                  </Button>

                  {/* Trust signals */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      <span>Secure checkout — test order, no payment needed</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span>Handmade with love in Norway</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CartPage;
