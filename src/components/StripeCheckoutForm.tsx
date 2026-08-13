import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Lock } from "lucide-react";
import { useLang } from "@/contexts/languageContext";
import type { ShippingAddress } from "@/interfaces/types";

interface Props {
  totalPrice: number;
  shippingAddress: ShippingAddress;
  onSuccess: () => void;
  onBack: () => void;
}

const StripeCheckoutForm = ({ totalPrice, shippingAddress, onSuccess, onBack }: Props) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLang();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? t.cart.stripeProcessing);
      setPaying(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
        payment_method_data: {
          billing_details: {
            name: shippingAddress.fullName,
            phone: shippingAddress.phone,
            address: {
              line1: shippingAddress.addressLine,
              postal_code: shippingAddress.postalCode,
              city: shippingAddress.city,
              country: "NO",
            },
          },
        },
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? t.cart.stripeProcessing);
      setPaying(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full h-14 text-base font-semibold rounded-xl"
        disabled={!stripe || !elements || paying}
      >
        {paying ? t.cart.stripeProcessing : t.cart.stripePayButton(totalPrice)}
      </Button>

      <button
        type="button"
        onClick={onBack}
        disabled={paying}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        ← {t.cart.backToCart}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>{t.cart.stripeSecured}</span>
      </div>
    </form>
  );
};

export default StripeCheckoutForm;
