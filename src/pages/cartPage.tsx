import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import SiteNavigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StripeCheckoutForm from "@/components/StripeCheckoutForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2, CheckCircle, Lock, Sparkles, Truck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/cartContext";
import { createPaymentIntent, clearCartFromDB } from "@/services/payment.service";
import { supabase } from "@/helper/supabaseClient";
import { toast } from "sonner";
import { formatSize } from "@/lib/sizeUtils";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

type Step = "cart" | "payment" | "confirmed";

const CartPage = () => {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("cart");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initializingPayment, setInitializingPayment] = useState(false);

  const handleProceedToPayment = async () => {
    if (items.length === 0) return;

    setInitializingPayment(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to place an order.");
        navigate("/login");
        return;
      }

      const { clientSecret: secret } = await createPaymentIntent(items);
      setClientSecret(secret);
      setStep("payment");
    } catch (err: any) {
      console.error("Payment initialization failed:", err);
      toast.error(err.message ?? "Could not initialize payment. Please try again.");
    } finally {
      setInitializingPayment(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await clearCartFromDB(user.id);
    } catch {
      // cart clearing is best-effort
    }
    clearCart();
    setStep("confirmed");
    toast.success("Payment successful! Thank you for your order.");
  };

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background">
        <SiteNavigation />
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <CheckCircle className="h-16 w-16 text-primary" />
          <h1 className="text-3xl font-serif font-bold text-primary">Order Confirmed!</h1>
          <p className="text-muted-foreground text-center max-w-sm">
            Thank you! Your payment was successful and your order is being prepared.
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
            {step === "payment" ? "Payment" : "Checkout"}
          </h1>
          <p className="text-muted-foreground">
            {step === "payment"
              ? "Complete your purchase securely with Stripe"
              : "Review your order before placing it"}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {items.length === 0 && step === "cart" ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-6">Your cart is empty.</p>
              <Button onClick={() => navigate("/store")}>Browse Shop</Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              {/* Left: Items list or payment form */}
              <div className="lg:col-span-3 space-y-3">
                {step === "cart" ? (
                  <>
                    <h2 className="font-medium text-muted-foreground mb-4">
                      {items.length} {items.length === 1 ? "item" : "items"} in your cart
                    </h2>

                    {items.map((cartItem) => (
                      <Card key={`${cartItem.itemId}-${cartItem.selectedSize ?? ""}`} variant="plain" className="rounded-none border-b">
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
                                Size: {formatSize(cartItem.selectedSize)}
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
                              disabled={
                                cartItem.stockQuantity !== undefined &&
                                cartItem.quantity >= cartItem.stockQuantity
                              }
                              title={
                                cartItem.stockQuantity !== undefined &&
                                cartItem.quantity >= cartItem.stockQuantity
                                  ? `Maks ${cartItem.stockQuantity} tilgjengelig`
                                  : undefined
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
                  </>
                ) : (
                  <div className="rounded-2xl border bg-white shadow-sm p-8">
                    <h2 className="font-serif text-xl font-bold text-primary mb-6">
                      Enter Payment Details
                    </h2>
                    {clientSecret && (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: "stripe",
                            variables: {
                              colorPrimary: "#7c5c45",
                              borderRadius: "8px",
                              fontFamily: "DM Sans, system-ui, sans-serif",
                            },
                          },
                        }}
                      >
                        <StripeCheckoutForm
                          totalPrice={totalPrice}
                          onSuccess={handlePaymentSuccess}
                          onBack={() => setStep("cart")}
                        />
                      </Elements>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Order summary */}
              <div className="lg:col-span-2">
                <div className="sticky top-24 rounded-2xl border bg-white shadow-sm p-8 space-y-6">
                  <h2 className="font-serif text-2xl font-bold text-primary">
                    Order Summary
                  </h2>

                  <div className="space-y-3">
                    {items.map((i) => (
                      <div key={`${i.itemId}-${i.selectedSize ?? ""}`} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {i.title}
                          {i.quantity > 1 && (
                            <span className="ml-1 text-xs">× {i.quantity}</span>
                          )}
                          {i.selectedSize && (
                            <span className="ml-1 text-xs text-muted-foreground/70">({formatSize(i.selectedSize)})</span>
                          )}
                        </span>
                        <span className="font-medium shrink-0 ml-3">
                          {i.price * i.quantity} NOK
                        </span>
                      </div>
                    ))}
                  </div>

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

                  <div className="border-t pt-4 flex justify-between items-baseline">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-3xl font-bold text-primary">{totalPrice} NOK</span>
                  </div>

                  {step === "cart" && (
                    <>
                      <Button
                        className="w-full h-14 text-base font-semibold rounded-xl"
                        onClick={handleProceedToPayment}
                        disabled={initializingPayment || items.length === 0}
                      >
                        {initializingPayment ? "Preparing..." : "Proceed to Payment"}
                      </Button>

                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          <span>Secure checkout powered by Stripe</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          <span>Handmade with love in Norway</span>
                        </div>
                      </div>
                    </>
                  )}

                  {step === "payment" && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
                      <Lock className="h-3 w-3" />
                      <span>256-bit SSL encryption</span>
                    </div>
                  )}
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
