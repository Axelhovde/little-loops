import { Link } from "react-router-dom";
import { Heart, Instagram } from "lucide-react";
import { useState } from "react";
import { supabase } from "../helper/supabaseClient";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const isError =
    message === "Something went wrong. Please try again." ||
    message === "Please enter a valid email address." ||
    message === "This email is already signed up.";

  const handleNewsletterSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setMessage("Please enter a valid email address.");
      return;
    }
    try {
      const { error } = await supabase.from("newslettersignup").insert({ email });
      if (error) {
        setMessage(
          error.code === "23505"
            ? "This email is already signed up."
            : "Something went wrong. Please try again."
        );
      } else {
        setMessage("Thank you for signing up!");
        setEmail("");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <footer className="bg-secondary/20 border-t border-border">
      <div className="container mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-serif font-bold text-primary mb-3">
              Little Loops
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              Handcrafted beaded jewellery made with love in Norway. Each piece is unique,
              made one bead at a time.
            </p>
            <a
              href="https://www.instagram.com/shoplittleloopsstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-4 w-4" />
              @shoplittleloopsstudio
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-primary mb-4 text-sm uppercase tracking-wide">
              Navigate
            </h4>
            <nav className="space-y-2.5">
              {[
                { to: "/", label: "Home" },
                { to: "/store", label: "Shop" },
                { to: "/about", label: "About" },
                { to: "/profile", label: "My Account" },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-primary mb-2 text-sm uppercase tracking-wide">
              Stay in the Loop
            </h4>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              New pieces, market dates, and restocks — straight to your inbox.
            </p>
            <form onSubmit={handleNewsletterSignup} className="space-y-2">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
            {message && (
              <p className={`mt-2 text-xs ${isError ? "text-red-600" : "text-primary"}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            Made with <Heart className="h-3.5 w-3.5 text-rose-400 fill-current" /> by Little Loops
          </p>
          <p>© {new Date().getFullYear()} Little Loops. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
