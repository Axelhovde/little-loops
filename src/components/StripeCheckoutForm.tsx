import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Lock } from "lucide-react";

interface Props {
  totalPrice: number;
  onSuccess: () => void;
  onBack: () => void;
}

const StripeCheckoutForm = ({ totalPrice, onSuccess, onBack }: Props) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Payment failed. Please try again.");
      setPaying(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
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
        {paying ? "Processing..." : `Pay ${totalPrice} NOK`}
      </Button>

      <button
        type="button"
        onClick={onBack}
        disabled={paying}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        ← Back to cart
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Payments secured and processed by Stripe</span>
      </div>
    </form>
  );
};

export default StripeCheckoutForm;
