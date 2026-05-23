import SiteNavigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Item } from "../interfaces/types";
import ProductCard from "@/components/ProductCard";
import { getStoreItems } from "@/services/store.service";

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "necklace", label: "Necklaces" },
  { value: "bracelet", label: "Bracelets" },
  { value: "earring", label: "Earrings" },
  { value: "other", label: "Other" },
];

const SkeletonCard = () => (
  <div className="aspect-[3/5] overflow-hidden flex flex-col">
    <Skeleton className="flex-[0_0_85%] w-full rounded-none" />
    <div className="flex-[0_0_15%] flex flex-col items-center justify-center gap-2 px-3 bg-background">
      <Skeleton className="h-3 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/3 rounded" />
    </div>
  </div>
);

const StorePage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [typeFilter, setTypeFilter] = useState("");
  const query = searchParams.get("q")?.toLowerCase().trim() ?? "";

  useEffect(() => {
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
  }, []);

  const onItemPressed = (itemId: number) => {
    navigate(`/item/${itemId}`);
  };

  const visible = items
    .filter((item) => item.ishidden !== true)
    .filter((item) => (typeFilter ? item.item_type === typeFilter : true))
    .filter((item) =>
      query
        ? item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
        : true
    );

  const isFiltered = !!query || !!typeFilter;

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
                Shop Our Collection
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Handcrafted beaded jewellery, made with love one piece at a time.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Type filter tabs */}
      {!query && (
        <div className="sticky top-16 z-30 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
              {TYPE_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  className={`shrink-0 px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    typeFilter === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products grid */}
      <section className="py-12 px-2">
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
                {isFiltered
                  ? `No items found${query ? ` for "${searchParams.get("q")}"` : ""}.`
                  : "No items available yet."}
              </p>
              {isFiltered && (
                <button
                  onClick={() => { setTypeFilter(""); navigate("/store"); }}
                  className="text-primary underline text-sm"
                >
                  View all products
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onItemPressed={onItemPressed}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StorePage;
