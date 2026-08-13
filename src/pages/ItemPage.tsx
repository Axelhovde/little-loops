import SiteNavigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import CustomSwiper from "@/components/customSwiper";
import ColorSwatches from "@/components/colorSwatches";
import { getItem, getSimilarItems } from "@/services/items.service";
import { useCart } from "@/contexts/cartContext";
import { useLang } from "@/contexts/languageContext";
import { toast } from "sonner";
import type { Item, ItemColor } from "@/interfaces/types";
import { ShieldCheck, Sparkles, RefreshCw, Truck, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSize } from "@/lib/sizeUtils";

const ItemPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const { t } = useLang();

  const [item, setItem] = useState<Item | null>(null);
  const [selectedColor, setSelectedColor] = useState<ItemColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [similarItems, setSimilarItems] = useState<Item[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    setSelectedSize(null);
    setSimilarItems([]);
    setItem(null);

    getItem(Number(id))
      .then((fetched) => {
        setItem(fetched);
        const multiColor = fetched.colors.length > 1;
        const hasSz = fetched.sizes && fetched.sizes.length > 0;
        setSelectedColor(multiColor && hasSz ? null : (fetched.colors[0] ?? null));
        getSimilarItems(fetched.id, fetched.item_type).then(setSimilarItems);
      })
      .catch((err) => console.error("Error loading item:", err));
  }, [id]);

  if (!item) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteNavigation />

        {/* Breadcrumb skeleton */}
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-10 rounded" />
            <Skeleton className="h-4 w-2 rounded" />
            <Skeleton className="h-4 w-10 rounded" />
            <Skeleton className="h-4 w-2 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        </div>

        {/* Product section skeleton */}
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-start">
            <Skeleton className="w-full aspect-square rounded-xl" />
            <div className="flex flex-col gap-6 pt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-4/5 rounded" />
                <Skeleton className="h-10 w-3/5 rounded" />
              </div>
              <Skeleton className="h-9 w-28 rounded" />
              <Skeleton className="h-px w-full rounded" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-16 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-16 rounded-lg" />
                  <Skeleton className="h-10 w-16 rounded-lg" />
                  <Skeleton className="h-10 w-16 rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-14 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-36 rounded" />
                ))}
              </div>
              <Skeleton className="h-px w-full rounded" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
              <Skeleton className="h-11 w-full rounded" />
              <Skeleton className="h-11 w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayedPhotos = selectedColor?.photos ?? item.photos;
  const hasSizes = item.sizes && item.sizes.length > 0;
  const hasColors = item.colors.length > 1;
  const stock = item.quantity ?? 0;
  const outOfStock = stock === 0;

  const effectiveStock = (hasSizes && selectedSize && item.sizeQuantities)
    ? (item.sizeQuantities[selectedSize] ?? 0)
    : stock;
  const effectiveOutOfStock = hasSizes && selectedSize
    ? effectiveStock === 0
    : outOfStock;

  const alreadyInCart = items
    .filter((i) => i.itemId === item.id && (!hasSizes || i.selectedSize === selectedSize))
    .reduce((sum, i) => sum + i.quantity, 0);
  const atStockLimit = effectiveStock > 0 && alreadyInCart >= effectiveStock;

  const stockLabel: { text: string } | null = hasSizes && !selectedSize
    ? null
    : effectiveOutOfStock
    ? { text: t.item.outOfStock }
    : effectiveStock <= 5
    ? { text: t.item.onlyLeft(effectiveStock) }
    : { text: t.item.inStock };

  const trustBadges = [
    { icon: Sparkles, label: t.item.trustBadges.handmade },
    { icon: Truck, label: t.item.trustBadges.freeShipping },
    { icon: RefreshCw, label: t.item.trustBadges.easyReturns },
    { icon: ShieldCheck, label: t.item.trustBadges.secureCheckout },
  ];

  // Look up translated item type if available
  const itemTypeLabel = (t.itemTypes as Record<string, string>)[item.item_type] ?? item.item_type;

  const handleAddToCart = async () => {
    if (hasColors && !selectedColor) {
      toast.error(t.item.selectColorToast);
      return;
    }
    if (hasSizes && !selectedSize) {
      toast.error(t.item.selectSizeToast);
      return;
    }
    if (effectiveOutOfStock || atStockLimit) {
      toast.error(effectiveOutOfStock
        ? t.item.outOfStockToast
        : t.item.maxQtyToast(effectiveStock));
      return;
    }

    setAdding(true);
    try {
      await addItem({
        itemId: item.id,
        title: item.title,
        price: item.price,
        quantity: 1,
        photo: displayedPhotos[0]?.photo_url ?? "",
        selectedSize: selectedSize ?? undefined,
        stockQuantity: effectiveStock,
      });
      toast.success(t.item.addedToCart(item.title));
    } catch (err: any) {
      toast.error(err?.message ?? t.item.couldNotAdd);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavigation />

      {/* Breadcrumb */}
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">{t.item.home}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/store">{t.item.shop}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{item.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main product section */}
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-start">

          {/* Left: Sticky photo panel */}
          <div className="lg:sticky lg:top-24">
            <CustomSwiper
              photos={displayedPhotos.map((p) => p.photo_url)}
              title={item.title}
            />
          </div>

          {/* Right: Product info */}
          <div className="flex flex-col gap-7 pt-2">

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="capitalize text-xs font-medium px-3">
                {itemTypeLabel}
              </Badge>
              {item.isNew && (
                <Badge className="bg-primary text-primary-foreground text-xs font-medium px-3">
                  {t.item.newArrival}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-primary leading-tight">
              {item.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{item.price} NOK</span>
              <span className="text-sm text-muted-foreground">{t.item.inclVat}</span>
            </div>

            <Separator />

            {/* Color selector */}
            {hasColors && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  {t.item.color}{" "}
                  {selectedColor
                    ? <span className="text-muted-foreground font-normal">{selectedColor.name}</span>
                    : <span className="text-destructive font-normal">{t.item.selectColor}</span>
                  }
                </p>
                <ColorSwatches
                  colors={item.colors}
                  selectedColor={selectedColor}
                  onSelect={(c) => { setSelectedColor(c); setSelectedSize(null); }}
                />
              </div>
            )}

            {/* Size selector */}
            <div className="space-y-2">
              {hasSizes && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {t.item.size}{" "}
                      {selectedSize ? (
                        <span className="text-muted-foreground font-normal">{formatSize(selectedSize)}</span>
                      ) : (
                        <span className="text-destructive font-normal">
                          {hasColors && !selectedColor ? t.item.colorSelectFirst : t.item.selectSize}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      const sizeStock = item.sizeQuantities?.[size] ?? stock;
                      const noStock = sizeStock === 0;
                      const disabledByColor = hasColors && !selectedColor;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => !disabledByColor && setSelectedSize(isSelected ? null : size)}
                          disabled={noStock || disabledByColor}
                          className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-all relative disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-foreground border-border hover:border-primary hover:text-primary"
                          }`}
                        >
                          {formatSize(size)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock status */}
              {stockLabel && (
                <p className="text-sm text-foreground/60">{stockLabel.text}</p>
              )}
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={adding || effectiveOutOfStock || atStockLimit}
              className="w-full flex items-center justify-center gap-3 py-4 px-8 bg-primary text-primary-foreground font-semibold text-base rounded-xl hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 shadow-sm"
            >
              <ShoppingBag className="h-5 w-5" />
              {adding
                ? t.item.addingToCart
                : effectiveOutOfStock
                ? t.item.outOfStockBtn
                : atStockLimit
                ? t.item.maxQtyBtn
                : t.item.addToCart}
            </button>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary/70" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                {t.item.aboutThisPiece}
              </h3>
              <p className="text-base leading-relaxed text-foreground">
                {item.description}
              </p>
            </div>

            {/* Accordion: extra info */}
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="materials">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  {t.item.materialsTitle}
                </AccordionTrigger>
                <AccordionContent>
                  {item.material_care ? (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {item.material_care.description}
                    </p>
                  ) : (
                    <ul className="text-sm text-muted-foreground space-y-1.5 leading-relaxed">
                      {t.item.materialsList.map((line, i) => (
                        <li key={i}>• {line}</li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  {t.item.shippingTitle}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="text-sm text-muted-foreground space-y-1.5 leading-relaxed">
                    {t.item.shippingList.map((line, i) => (
                      <li key={i}>• {line}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Similar Items */}
      {similarItems.length > 0 && (
        <section className="bg-muted/30 py-20">
          <div className="container mx-auto max-w-7xl px-4 lg:px-8">
            <h2 className="text-3xl font-serif font-bold text-primary mb-2 text-center">
              {t.item.youMightLike}
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              {t.item.moreFromCollection}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarItems.map((similar) => (
                <ProductCard
                  key={similar.id}
                  item={similar}
                  onItemPressed={(itemId) => navigate(`/item/${itemId}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default ItemPage;
