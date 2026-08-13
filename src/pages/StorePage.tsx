import SiteNavigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Item } from "../interfaces/types";
import ProductCard from "@/components/ProductCard";
import { getStoreItems } from "@/services/store.service";
import { JEWELRY_TYPES, KNITTING_TYPES } from "@/interfaces/types";
import { useNav } from "@/contexts/navContext";
import { useLang } from "@/contexts/languageContext";
import { ChevronDown } from "lucide-react";

type SortOption = "newest" | "price-asc" | "price-desc";

const SkeletonCard = () => (
  <div className="overflow-hidden">
    <Skeleton className="aspect-[3/4] w-full" />
    <div className="pt-2 space-y-1.5">
      <Skeleton className="h-3 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/4 rounded" />
    </div>
  </div>
);

interface Props {
  category?: "jewelry" | "knitting";
}

const StorePage = ({ category }: Props) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase().trim() ?? "";
  const { navVisible } = useNav();
  const { t } = useLang();

  const isKnitting = category === "knitting";
  const isJewelry = !isKnitting;

  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const JEWELRY_FILTERS = [
    { value: "", label: t.store.allJewelry },
    { value: "necklace", label: t.store.necklaces },
    { value: "bracelet", label: t.store.bracelets },
    { value: "earring", label: t.store.earrings },
    { value: "other", label: t.store.other },
  ];

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: t.store.newest },
    { value: "price-asc", label: t.store.priceAsc },
    { value: "price-desc", label: t.store.priceDesc },
  ];

  useEffect(() => {
    setTypeFilter("");
    setSortBy("newest");
    setLoading(true);
    getStoreItems()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const visible = useMemo(() =>
    items
      .filter((item) => item.ishidden !== true)
      .filter((item) =>
        isKnitting
          ? KNITTING_TYPES.includes(item.item_type as any)
          : JEWELRY_TYPES.includes(item.item_type as any)
      )
      .filter((item) => (typeFilter ? item.item_type === typeFilter : true))
      .filter((item) =>
        query
          ? item.title.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
          : true
      )
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      }),
    [items, typeFilter, query, sortBy, isKnitting]
  );

  const heroTitle = isKnitting ? t.store.knittingTitle : t.store.jewelryTitle;
  const heroSubtitle = isKnitting ? t.store.knittingSubtitle : t.store.jewelrySubtitle;

  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />

      {/* Hero */}
      <section className="py-16 px-4 bg-gradient-warm">
        <div className="container mx-auto text-center">
          {query ? (
            <>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-4">
                {t.store.resultsFor(searchParams.get("q") ?? "")}
              </h1>
              {!loading && (
                <p className="text-muted-foreground">
                  {t.store.itemsFound(visible.length)}
                </p>
              )}
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-4">
                {heroTitle}
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                {heroSubtitle}
              </p>
            </>
          )}
        </div>
      </section>

      {/* Filter / sort bar — follows nav when sticky, never jumps up */}
      {!query && (
        <div
          className={`sticky z-30 bg-neutral-200 border-b border-neutral-300 transition-[top] duration-300 ${
            navVisible ? "top-16" : "top-0"
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center py-2 gap-2">
              {/* Scrollable type tabs */}
              {isJewelry && (
                <div className="flex gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
                  {JEWELRY_FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setTypeFilter(value)}
                      className={`shrink-0 px-4 py-1 rounded-full text-sm font-medium transition-all ${
                        typeFilter === value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-neutral-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Sort dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowSortMenu(p => !p)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-neutral-300 transition-colors whitespace-nowrap"
                >
                  {SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? t.store.sortLabel}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border z-50 py-1 min-w-[180px]">
                    {SORT_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => { setSortBy(value); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-muted ${sortBy === value ? "text-primary font-medium" : "text-foreground"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products grid */}
      <section className="py-10 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">
                {query
                  ? t.store.noItemsFound(searchParams.get("q") ?? "")
                  : t.store.noItemsAvailable}
              </p>
              {(typeFilter || sortBy !== "newest") && (
                <button
                  onClick={() => { setTypeFilter(""); setSortBy("newest"); }}
                  className="text-primary underline text-sm"
                >
                  {t.store.clearFilters}
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-6">
                {visible.length} {visible.length === 1 ? t.store.item : t.store.items}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {visible.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onItemPressed={(id) => navigate(`/item/${id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StorePage;
