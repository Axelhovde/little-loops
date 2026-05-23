import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState } from "react";
import { supabase } from "../helper/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import VerificationPopup from "../components/verificationPopup.tsx";
import heroImage from "@/assets/beads-background.jpg";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setShowVerificationPopup(true);
      } else {
        setMessage(error.message);
      }
      setLoading(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setMessage("No user returned. Something went wrong.");
      setLoading(false);
      return;
    }

    if (!user.email_confirmed_at) {
      setShowVerificationPopup(true);
      setLoading(false);
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="grid md:grid-cols-2 min-h-[calc(100vh-4rem)]">
        {/* Left: background image panel */}
        <div
          className="hidden md:block bg-cover bg-center relative"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-background/50" />
          <div className="relative z-10 flex flex-col justify-end p-12 h-full">
            <h2 className="text-4xl font-serif font-bold text-primary mb-3">
              Little Loops
            </h2>
            <p className="text-muted-foreground max-w-xs leading-relaxed">
              Handcrafted beaded jewellery made with love, one bead at a time.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-3xl font-serif font-bold text-primary mb-2">
                Welcome back
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in to your Little Loops account
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>

              {message && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />

      {showVerificationPopup && (
        <VerificationPopup
          email={email}
          onClose={() => setShowVerificationPopup(false)}
        />
      )}
    </div>
  );
};

export default LoginPage;
