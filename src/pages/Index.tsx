import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../helper/supabaseClient";
import { getStoreItems } from "@/services/store.service";
import type { Item } from "@/interfaces/types";
import beadsPhoto from "@/assets/beadsPhoto.jpg";
import beadsCollection from "@/assets/beads-collection.jpg";
import aboutMeBeads from "@/assets/about-me-beads.jpg";

const CATEGORIES = [
  { label: "Necklaces", image: beadsPhoto },
  { label: "Bracelets", image: beadsCollection },
  { label: "Earrings", image: aboutMeBeads },
];

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const reveal = useReveal();

  const isError =
    message === "Something went wrong. Please try again." ||
    message === "Please enter a valid email address." ||
    message === "This email is already signed up.";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setMessage("Please enter a valid email address.");
      return;
    }
    try {
      const { error } = await supabase.from("newslettersignup").insert({ email });
      if (error) {
        setMessage(error.code === "23505" ? "This email is already signed up." : "Something went wrong. Please try again.");
      } else {
        setMessage("Thank you for signing up!");
        setEmail("");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="py-24 px-4 bg-gradient-warm">
      <div
        ref={reveal.ref}
        className="container mx-auto max-w-xl text-center"
        style={{
          opacity: reveal.visible ? 1 : 0,
          transform: reveal.visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">
          Newsletter
        </p>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-3">
          Stay in the Loop
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          New pieces, restocks &amp; market dates — straight to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 max-w-xs px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
          <Button type="submit" size="lg" className="rounded-xl px-8">Subscribe</Button>
        </form>
        {message && (
          <p className={`mt-4 text-sm ${isError ? "text-red-600" : "text-primary"}`}>{message}</p>
        )}
      </div>
    </section>
  );
};

/* Animated count-in for product grid skeleton rows */
const SkeletonGrid = ({ count }: { count: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="aspect-[3/5] bg-muted/50 animate-pulse rounded-lg" />
    ))}
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const newArrivalsReveal = useReveal();
  const popularReveal = useReveal();
  const categoriesReveal = useReveal();

  useEffect(() => {
    getStoreItems()
      .then((result) => setItems(result.filter((i) => !i.ishidden)))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...items].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const newArrivals = sorted.slice(0, 6);

  const popular = [...items]
    .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
    .filter((item) => !newArrivals.find((n) => n.id === item.id))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />

      {/* ── New Arrivals ── */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl" ref={newArrivalsReveal.ref}>
          {/* Section header */}
          <div
            className="flex items-baseline justify-between mb-10"
            style={{
              opacity: newArrivalsReveal.visible ? 1 : 0,
              transform: newArrivalsReveal.visible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.55s ease, transform 0.55s ease",
            }}
          >
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5 font-medium">
                Just dropped
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">New Arrivals</h2>
            </div>
            <Link to="/store" className="text-sm text-primary hover:underline font-medium hidden sm:inline">
              View all →
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid count={6} />
          ) : newArrivals.length === 0 ? (
            <p className="text-center text-muted-foreground py-14">Check back soon for new pieces.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {newArrivals.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    opacity: newArrivalsReveal.visible ? 1 : 0,
                    transform: newArrivalsReveal.visible ? "translateY(0)" : "translateY(16px)",
                    transition: `opacity 0.55s ease ${0.05 + i * 0.07}s, transform 0.55s ease ${0.05 + i * 0.07}s`,
                  }}
                >
                  <ProductCard item={item} onItemPressed={(id) => navigate(`/item/${id}`)} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Button asChild variant="outline" className="rounded-xl px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Link to="/store">View all</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Editorial text break ── */}
      <div className="py-14 px-4 border-y border-border bg-muted/20">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-2xl md:text-3xl font-serif text-primary leading-snug">
            "Each piece is made by hand, one bead at a time. No two are exactly alike."
          </p>
          <p className="mt-4 text-sm text-muted-foreground tracking-wide uppercase font-medium">
            — Little Loops, Norway
          </p>
        </div>
      </div>

      {/* ── Popular Picks (only render if we have items not in new arrivals) ── */}
      {(loading || popular.length > 0) && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl" ref={popularReveal.ref}>
            <div
              className="flex items-baseline justify-between mb-10"
              style={{
                opacity: popularReveal.visible ? 1 : 0,
                transform: popularReveal.visible ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.55s ease, transform 0.55s ease",
              }}
            >
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5 font-medium">
                  Fan favourites
                </p>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">Popular Picks</h2>
              </div>
              <Link to="/store" className="text-sm text-primary hover:underline font-medium hidden sm:inline">
                See more →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[3/5] bg-muted/50 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {popular.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      opacity: popularReveal.visible ? 1 : 0,
                      transform: popularReveal.visible ? "translateY(0)" : "translateY(16px)",
                      transition: `opacity 0.55s ease ${0.05 + i * 0.08}s, transform 0.55s ease ${0.05 + i * 0.08}s`,
                    }}
                  >
                    <ProductCard item={item} onItemPressed={(id) => navigate(`/item/${id}`)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Shop by Category ── */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-6xl" ref={categoriesReveal.ref}>
          <div
            className="mb-10"
            style={{
              opacity: categoriesReveal.visible ? 1 : 0,
              transform: categoriesReveal.visible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.55s ease, transform 0.55s ease",
            }}
          >
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5 font-medium">
              Browse
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">Shop by Category</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CATEGORIES.map(({ label, image }, i) => (
              <Link
                key={label}
                to="/store"
                className="relative group overflow-hidden block rounded-xl"
                style={{
                  opacity: categoriesReveal.visible ? 1 : 0,
                  transform: categoriesReveal.visible ? "translateY(0)" : "translateY(16px)",
                  transition: `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`,
                }}
              >
                <div className="aspect-[3/4] overflow-hidden rounded-xl">
                  <img
                    src={image}
                    alt={label}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent rounded-xl" />
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mb-1 font-medium">Shop</p>
                  <h3 className="text-white text-2xl font-serif font-bold">{label}</h3>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                    Explore →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default Index;
