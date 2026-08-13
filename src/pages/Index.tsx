import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getStoreItems } from "@/services/store.service";
import type { Item } from "@/interfaces/types";
import beadsPhoto from "@/assets/beadsPhoto.jpg";
import beadsCollection from "@/assets/necklaceInUse.jpg";
import aboutMeBeads from "@/assets/about-me-beads.jpg";
import { Sparkles, Truck, RefreshCw, ShieldCheck } from "lucide-react";
import { useLang } from "@/contexts/languageContext";

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

const SkeletonGrid = ({ count }: { count: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="aspect-[3/4] bg-muted/50 animate-pulse rounded-lg" />
    ))}
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const newArrivalsReveal = useReveal();
  const storyReveal = useReveal();
  const valuesReveal = useReveal();

  useEffect(() => {
    getStoreItems()
      .then((result) => setItems(result.filter((item: Item) => !item.ishidden)))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...items].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const newArrivals = sorted.slice(0, 6);

  const valueItems = [
    { icon: Sparkles, ...t.home.values.handmade },
    { icon: Truck, ...t.home.values.freeShipping },
    { icon: RefreshCw, ...t.home.values.easyReturns },
    { icon: ShieldCheck, ...t.home.values.secureCheckout },
  ];

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
                {t.home.justDropped}
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">{t.home.newArrivals}</h2>
            </div>
            <Link to="/store" className="text-sm text-primary hover:underline font-medium hidden sm:inline">
              {t.home.viewAll}
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid count={6} />
          ) : newArrivals.length === 0 ? (
            <p className="text-center text-muted-foreground py-14">{t.home.noItems}</p>
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
              <Link to="/store">{t.home.viewAllButton}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Our Story — editorial split ── */}
      <section className="py-0" ref={storyReveal.ref}>
        <div className="grid md:grid-cols-2 min-h-[520px]">
          {/* Photo side */}
          <div className="overflow-hidden">
            <img
              src={aboutMeBeads}
              alt="Making jewelry by hand"
              className="w-full h-full object-cover"
              style={{ minHeight: 360 }}
            />
          </div>

          {/* Text side */}
          <div
            className="flex flex-col justify-center px-10 py-16 bg-stone-50"
            style={{
              opacity: storyReveal.visible ? 1 : 0,
              transform: storyReveal.visible ? "translateX(0)" : "translateX(30px)",
              transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
            }}
          >
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-4 font-medium">
              {t.home.ourStory}
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-5 leading-snug">
              {t.home.storyTitle}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {t.home.storyP1}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t.home.storyP2}
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              {t.home.readOurStory}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Shop the collection banner ── */}
      <section className="relative overflow-hidden h-[480px] md:h-[560px]">
        <img
          src={beadsCollection}
          alt="Jewelry collection"
          className="w-full h-full object-cover object-[30%_top]"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p className="text-white/70 text-xs uppercase tracking-[0.2em] mb-4 font-medium">
            {t.home.handcraftedInNorway}
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight">
            {t.home.shopTheCollection}
          </h2>
          <p className="text-white/80 text-base max-w-sm mb-10">
            {t.home.collectionSubtitle}
          </p>
          <Button
            asChild
            size="lg"
            className="rounded-full px-10 bg-white text-primary hover:bg-white/90 font-semibold text-sm"
          >
            <Link to="/jewelry">{t.home.browseJewelry}</Link>
          </Button>
        </div>
      </section>

      {/* ── Values row ── */}
      <section className="py-16 px-4 bg-stone-50" ref={valuesReveal.ref}>
        <div className="container mx-auto max-w-5xl">
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            style={{
              opacity: valuesReveal.visible ? 1 : 0,
              transform: valuesReveal.visible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            {valueItems.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full-width photo with quote ── */}
      <section className="relative overflow-hidden h-64 md:h-80">
        <img
          src={beadsPhoto}
          alt="Beaded jewelry"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-xl md:text-3xl font-serif text-white leading-snug max-w-2xl">
            {t.home.quote}
          </p>
          <p className="mt-4 text-white/60 text-xs uppercase tracking-widest font-medium">
            {t.home.quoteSig}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
