import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState } from "react";
import { supabase } from "../helper/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import heroImage from "@/assets/beads-background.jpg";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isError = message !== "User account created successfully!";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("User account created successfully!");
      setTimeout(() => navigate("/login"), 1500);
    }

    setLoading(false);
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
              Join our community and be the first to discover new handcrafted pieces.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-3xl font-serif font-bold text-primary mb-2">
                Create an account
              </h1>
              <p className="text-muted-foreground text-sm">
                Join Little Loops to track your orders and more.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>

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

              <div>
                <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>

              {message && (
                <p
                  className={`text-sm rounded-lg px-3 py-2 ${
                    isError
                      ? "text-red-600 bg-red-50"
                      : "text-green-700 bg-green-50"
                  }`}
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RegisterPage;
