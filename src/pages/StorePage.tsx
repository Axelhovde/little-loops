import SiteNavigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Item } from "../interfaces/types";
import ProductCard from "@/components/ProductCard";
import { getStoreItems } from "@/services/store.service";
import { JEWELRY_TYPES, KNITTING_TYPES } from "@/interfaces/types";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

const JEWELRY_FILTERS = [
  { value: "", label: "All Jewelry" },
  { value: "necklace", label: "Necklaces" },
  { value: "bracelet", label: "Bracelets" },
  { value: "earring", label: "Earrings" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

type SortOption = "newest" | "price-asc" | "price-desc";

const SkeletonCard = () => (
  <div className="rounded-xl overflow-hidden border bg-white flex flex-col">
    <Skeleton className="aspect-[3/4] w-full rounded-none" />
    <div className="p-3 flex flex-col gap-2">
      <Skeleton className="h-3 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/4 rounded" />
      <Skeleton className="h-6 w-full rounded-lg" />
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

  const isKnitting = category === "knitting";
  const isJewelry = !isKnitting;

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    setTypeFilter("");
    setSortBy("newest");
    setInStockOnly(false);
    setPriceMin("");
    setPriceMax("");
    setShowFilterPanel(false);
    const load = async () => {
      try {
        const result = await getStoreItems();
        setItems(result);
      } catch (error) {
        console.error("Error fetching store items:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category]);

  const visible = useMemo(() => {
    const pMin = priceMin !== "" ? Number(priceMin) : null;
    const pMax = priceMax !== "" ? Number(priceMax) : null;

    return items
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
      .filter((item) => !inStockOnly || (item.quantity ?? 0) > 0)
      .filter((item) => pMin === null || item.price >= pMin)
      .filter((item) => pMax === null || item.price <= pMax)
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      });
  }, [items, typeFilter, query, inStockOnly, priceMin, priceMax, sortBy, isKnitting]);

  const activeFilterCount =
    (inStockOnly ? 1 : 0) +
    (priceMin !== "" || priceMax !== "" ? 1 : 0);

  const clearFilters = () => {
    setInStockOnly(false);
    setPriceMin("");
    setPriceMax("");
    setTypeFilter("");
    setSortBy("newest");
  };

  const heroTitle = isKnitting ? "Knitting Patterns" : "Jewelry Collection";
  const heroSubtitle = isKnitting
    ? "Download and knit beautiful pieces from handcrafted Norwegian patterns."
    : "Handcrafted beaded jewellery, made with love one piece at a time.";

  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />

      {/* Hero */}
      <section className="py-16 px-4 bg-gradient-warm">
        <div className="container mx-auto text-center">
          {query ? (
            <>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-4">
                Results for "{searchParams.get("q")}"
              </h1>
              {!loading && (
                <p className="text-muted-foreground">
                  {visible.length} {visible.length === 1 ? "item" : "items"} found
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

      {/* Filter / sort bar — matches nav colour so it blends in when sticky */}
      {!query && (
        <div className="sticky top-16 z-30 bg-neutral-200 border-b border-neutral-300">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 py-2">
              {/* Type tabs (jewelry only) */}
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

              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setShowSortMenu(p => !p); setShowFilterPanel(false); }}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-neutral-300 transition-colors whitespace-nowrap"
                  >
                    {SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? "Sort"}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border z-40 py-1 min-w-[180px]">
                      {SORT_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => { setSortBy(value as SortOption); setShowSortMenu(false); }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-muted ${sortBy === value ? "text-primary font-medium" : "text-foreground"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter toggle */}
                <button
                  onClick={() => { setShowFilterPanel(p => !p); setShowSortMenu(false); }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    showFilterPanel || activeFilterCount > 0
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-neutral-300"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-white/30 text-[10px] rounded-full px-1 font-semibold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Expanded filter panel */}
            {showFilterPanel && (
              <div className="border-t border-neutral-300 py-3 flex flex-wrap gap-6 items-end">
                {/* Price range */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Price (NOK)</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-20 text-xs border border-neutral-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-20 text-xs border border-neutral-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* In stock toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setInStockOnly(p => !p)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${inStockOnly ? "bg-primary" : "bg-neutral-400"}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${inStockOnly ? "left-4" : "left-0.5"}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">In stock only</span>
                </label>

                {/* Clear filters */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  >
                    <X className="h-3 w-3" /> Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close sort menu on outside click */}
      {showSortMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)} />
      )}

      {/* Products grid */}
      <section className="py-10 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">
                {query
                  ? `No items found for "${searchParams.get("q")}".`
                  : "No items match your filters."}
              </p>
              <button
                onClick={clearFilters}
                className="text-primary underline text-sm"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                {visible.length} {visible.length === 1 ? "item" : "items"}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
