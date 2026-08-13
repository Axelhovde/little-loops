import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import SiteNavigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StripeCheckoutForm from "@/components/StripeCheckoutForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2, CheckCircle, XCircle, Lock, Sparkles, Truck, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/cartContext";
import { useLang } from "@/contexts/languageContext";
import { createPaymentIntent, clearCartFromDB } from "@/services/payment.service";
import { validatePostalCode } from "@/services/address.service";
import { supabase } from "@/helper/supabaseClient";
import { toast } from "sonner";
import { formatSize } from "@/lib/sizeUtils";
import postenLogo from "@/assets/330px-Posten-Norge-Logo.png";
import type { ShippingAddress } from "@/interfaces/types";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

type Step = "cart" | "shipping" | "payment" | "confirmed";

const FREE_SHIPPING_THRESHOLD = 1000; // NOK — must match create-payment-intent edge function
const LITEN_PAKKE_MAX_QTY = 20;
const LITEN_PAKKE_PRICE = 76;
const STOR_PAKKE_PRICE = 76; //Might change later if we want to charge more for larger orders, but Posten's "Liten Pakke" should be good for now

type ShippingTier = "free" | "standard" | "large";

function getShippingTier(totalQty: number, itemsTotalNOK: number): ShippingTier {
  if (itemsTotalNOK >= FREE_SHIPPING_THRESHOLD) return "free";
  if (totalQty <= LITEN_PAKKE_MAX_QTY) return "standard";
  return "large";
}

function shippingCostForTier(tier: ShippingTier): number {
  if (tier === "free") return 0;
  if (tier === "standard") return LITEN_PAKKE_PRICE;
  return STOR_PAKKE_PRICE;
}

const EMPTY_ADDRESS: ShippingAddress = {
  fullName: "", addressLine: "", postalCode: "", city: "", phone: "",
};

const inputClass =
  "w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none " +
  "focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/50";


const CartPage = () => {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const { t } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("cart");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [initializingPayment, setInitializingPayment] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);

  const [postalCodeStatus, setPostalCodeStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");

  useEffect(() => {
    const code = shippingAddress.postalCode;
    if (code.length !== 4) {
      setPostalCodeStatus("idle");
      return;
    }
    setPostalCodeStatus("checking");
    const timer = setTimeout(async () => {
      const { valid, city } = await validatePostalCode(code);
      if (valid === true) {
        setPostalCodeStatus("valid");
        if (city) {
          setShippingAddress((p) => ({
            ...p,
            city: p.city.trim() ? p.city : city,
          }));
        }
      } else if (valid === false) {
        setPostalCodeStatus("invalid");
      } else {
        // null = API unreachable — don't penalise the user
        setPostalCodeStatus("idle");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [shippingAddress.postalCode]);

  const missingSizeItems = items.filter((i) => i.hasSizes && !i.selectedSize);

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const shippingTier = getShippingTier(totalQty, totalPrice);
  const shippingCost = shippingCostForTier(shippingTier);
  const grandTotal = totalPrice + shippingCost;

  const shippingAddressComplete =
    shippingAddress.fullName.trim() !== "" &&
    shippingAddress.addressLine.trim() !== "" &&
    shippingAddress.postalCode.replace(/\D/g, "").length === 4 &&
    postalCodeStatus !== "invalid" &&
    postalCodeStatus !== "checking" &&
    shippingAddress.city.trim() !== "" &&
    shippingAddress.phone.trim() !== "";

  const handleProceedToPayment = async () => {
    if (!shippingAddressComplete) return;
    setInitializingPayment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t.cart.stepTitles.cart);
        navigate("/login");
        return;
      }
      const { clientSecret: secret, orderId: id } = await createPaymentIntent(items, shippingAddress);
      setClientSecret(secret);
      setOrderId(id);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await clearCartFromDB(user.id);
    } catch { /* best-effort */ }
    clearCart();
    setStep("confirmed");
    toast.success(t.cart.confirmed.title);
  };

  if (step === "confirmed") {
    const paddedOrderId = orderId ? String(orderId).padStart(5, "0") : null;
    return (
      <div className="min-h-screen bg-background">
        <SiteNavigation />
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <CheckCircle className="h-16 w-16 text-primary" />
          <h1 className="text-3xl font-serif font-bold text-primary">{t.cart.confirmed.title}</h1>
          {paddedOrderId && (
            <p className="text-lg font-semibold text-primary/80 tracking-wide">
              {t.cart.confirmed.orderNumber(paddedOrderId)}
            </p>
          )}
          <p className="text-muted-foreground text-center max-w-sm">{t.cart.confirmed.body}</p>
          <Button onClick={() => navigate("/profile")}>{t.cart.confirmed.viewOrders}</Button>
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
            {t.cart.stepTitles[step as keyof typeof t.cart.stepTitles] ?? ""}
          </h1>
          <p className="text-muted-foreground">
            {t.cart.stepSubtitles[step as keyof typeof t.cart.stepSubtitles] ?? ""}
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {items.length === 0 && step === "cart" ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-6">{t.cart.empty}</p>
              <Button onClick={() => navigate("/store")}>{t.cart.browseShop}</Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-12 items-start">

              {/* Left column */}
              <div className="lg:col-span-3 space-y-3">

                {/* ── Cart ── */}
                {step === "cart" && (
                  <>
                    <h2 className="font-medium text-muted-foreground mb-4">
                      {t.cart.itemCount(items.length)}
                    </h2>
                    {items.map((cartItem) => (
                      <Card
                        key={`${cartItem.itemId}-${cartItem.selectedSize ?? ""}`}
                        variant="plain"
                        className="rounded-none border-b"
                      >
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
                                {t.cart.size}: {formatSize(cartItem.selectedSize)}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {cartItem.price} NOK {t.cart.each}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon" variant="ghost"
                              onClick={() => updateQuantity(cartItem.itemId, cartItem.quantity - 1, cartItem.selectedSize)}
                              disabled={cartItem.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center">{cartItem.quantity}</span>
                            <Button
                              size="icon" variant="ghost"
                              onClick={() => updateQuantity(cartItem.itemId, cartItem.quantity + 1, cartItem.selectedSize)}
                              disabled={cartItem.stockQuantity !== undefined && cartItem.quantity >= cartItem.stockQuantity}
                              title={cartItem.stockQuantity !== undefined && cartItem.quantity >= cartItem.stockQuantity
                                ? t.cart.maxAvailable(cartItem.stockQuantity) : undefined}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-medium">{cartItem.price * cartItem.quantity} NOK</p>
                            <Button
                              size="icon" variant="ghost"
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
                )}

                {/* ── Shipping ── */}
                {step === "shipping" && (
                  <div className="rounded-2xl border bg-white shadow-sm p-8 space-y-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setStep("cart")}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={t.cart.backToCart}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <h2 className="font-serif text-xl font-bold text-primary">
                        {t.cart.shippingAddressTitle}
                      </h2>
                    </div>

                    {/* Norway-only notice */}
                    <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                      {t.cart.norwayOnly}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">{t.cart.fullName}</label>
                        <input
                          className={inputClass}
                          placeholder={t.cart.fullNamePlaceholder}
                          value={shippingAddress.fullName}
                          onChange={(e) => setShippingAddress((p) => ({ ...p, fullName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t.cart.streetAddress}</label>
                        <input
                          className={inputClass}
                          placeholder={t.cart.streetAddressPlaceholder}
                          value={shippingAddress.addressLine}
                          onChange={(e) => setShippingAddress((p) => ({ ...p, addressLine: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">{t.cart.postalCode}</label>
                          <div className="relative">
                            <input
                              className={`${inputClass} pr-8`}
                              placeholder={t.cart.postalCodePlaceholder}
                              maxLength={4}
                              inputMode="numeric"
                              value={shippingAddress.postalCode}
                              onChange={(e) => {
                                setShippingAddress((p) => ({
                                  ...p,
                                  postalCode: e.target.value.replace(/\D/g, "").slice(0, 4),
                                }));
                              }}
                            />
                            {postalCodeStatus === "valid" && (
                              <CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 pointer-events-none" />
                            )}
                            {postalCodeStatus === "invalid" && (
                              <XCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive pointer-events-none" />
                            )}
                          </div>
                          {postalCodeStatus === "invalid" && (
                            <p className="text-xs text-destructive mt-1">{t.cart.postalCodeInvalid}</p>
                          )}
                          {postalCodeStatus === "checking" && (
                            <p className="text-xs text-muted-foreground mt-1">{t.cart.postalCodeChecking}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t.cart.city}</label>
                          <input
                            className={inputClass}
                            placeholder={t.cart.cityPlaceholder}
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress((p) => ({ ...p, city: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t.cart.phone}</label>
                        <input
                          className={inputClass}
                          placeholder={t.cart.phonePlaceholder}
                          type="tel"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress((p) => ({ ...p, phone: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Shipping method */}
                    <div className="space-y-3 pt-2 border-t">
                      <h3 className="font-medium text-sm pt-3">{t.cart.shippingMethod}</h3>

                      {shippingTier === "free" ? (
                        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                          <Truck className="h-5 w-5 text-green-600 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-green-800">{t.cart.freeShipping}</p>
                            <p className="text-xs text-green-700">{t.cart.freeShippingDesc}</p>
                          </div>
                          <span className="ml-auto text-sm font-bold text-green-700">{t.cart.shippingFree}</span>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{t.cart.shippingWithPosten}</p>
                                <img src={postenLogo} alt="Posten Norge" className="h-4 object-contain" />
                              </div>
                              <p className="text-xs text-muted-foreground">{t.cart.postenDelivery}</p>
                              {shippingTier === "large" && (
                                <p className="text-xs text-muted-foreground/70">{t.cart.largeOrderNote}</p>
                              )}
                            </div>
                            <span className="text-sm font-bold shrink-0">{shippingCost} NOK</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">{t.cart.privacyNote}</p>
                  </div>
                )}

                {/* ── Payment ── */}
                {step === "payment" && (
                  <div className="rounded-2xl border bg-white shadow-sm p-8">
                    <h2 className="font-serif text-xl font-bold text-primary mb-6">
                      {t.cart.enterPaymentDetails}
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
                          totalPrice={grandTotal}
                          onSuccess={handlePaymentSuccess}
                          onBack={() => { setClientSecret(null); setStep("shipping"); }}
                        />
                      </Elements>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Order summary */}
              <div className="lg:col-span-2">
                <div className="sticky top-24 rounded-2xl border bg-white shadow-sm p-8 space-y-6">
                  <h2 className="font-serif text-2xl font-bold text-primary">{t.cart.orderSummary}</h2>

                  <div className="space-y-3">
                    {items.map((i) => (
                      <div key={`${i.itemId}-${i.selectedSize ?? ""}`} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {i.title}
                          {i.quantity > 1 && <span className="ml-1 text-xs">× {i.quantity}</span>}
                          {i.selectedSize && (
                            <span className="ml-1 text-xs text-muted-foreground/70">
                              ({formatSize(i.selectedSize)})
                            </span>
                          )}
                        </span>
                        <span className="font-medium shrink-0 ml-3">{i.price * i.quantity} NOK</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t.cart.subtotal}</span>
                      <span>{totalPrice} NOK</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">{t.cart.shipping}</span>
                      {shippingTier === "free" ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <Truck className="h-3.5 w-3.5" />
                          {t.cart.shippingFree}
                        </span>
                      ) : (
                        <span>{shippingCost} NOK</span>
                      )}
                    </div>
                    {shippingTier !== "free" && step === "cart" && (
                      <p className="text-xs text-muted-foreground text-right">
                        {t.cart.freeShippingDesc}
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-4 flex justify-between items-baseline">
                    <span className="text-lg font-semibold">{t.cart.total}</span>
                    <span className="text-3xl font-bold text-primary">{grandTotal} NOK</span>
                  </div>

                  {/* Cart actions */}
                  {step === "cart" && (
                    <>
                      {missingSizeItems.length > 0 && (
                        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-1.5">
                          <p className="text-sm font-medium text-destructive">{t.cart.missingSizeTitle}</p>
                          <ul className="space-y-0.5">
                            {missingSizeItems.map((i) => (
                              <li key={i.itemId} className="text-xs text-destructive/80">• {i.title}</li>
                            ))}
                          </ul>
                          <p className="text-xs text-muted-foreground">
                            {t.cart.missingSizeBody(missingSizeItems.length)}
                          </p>
                        </div>
                      )}
                      <Button
                        className="w-full h-14 text-base font-semibold rounded-xl"
                        onClick={() => setStep("shipping")}
                        disabled={items.length === 0 || missingSizeItems.length > 0}
                      >
                        {t.cart.continueToShipping}
                      </Button>
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          <span>{t.cart.secureCheckout}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          <span>{t.cart.madeInNorway}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Shipping actions */}
                  {step === "shipping" && (
                    <>
                      <Button
                        className="w-full h-14 text-base font-semibold rounded-xl"
                        onClick={handleProceedToPayment}
                        disabled={initializingPayment || !shippingAddressComplete}
                      >
                        {initializingPayment ? t.cart.preparing : t.cart.continueToPayment}
                      </Button>
                      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>{t.cart.secureCheckout}</span>
                      </div>
                    </>
                  )}

                  {/* Payment info */}
                  {step === "payment" && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
                      <Lock className="h-3 w-3" />
                      <span>{t.cart.sslEncryption}</span>
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
