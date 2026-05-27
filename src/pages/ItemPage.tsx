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
import { toast } from "sonner";
import type { Item, ItemColor } from "@/interfaces/types";
import { ShieldCheck, Sparkles, RefreshCw, Truck, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSize } from "@/lib/sizeUtils";

const TRUST_BADGES = [
  { icon: Sparkles, label: "Handmade with love" },
  { icon: Truck, label: "Free shipping" },
  { icon: RefreshCw, label: "Easy 14-day returns" },
  { icon: ShieldCheck, label: "Secure checkout" },
];

const ItemPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, items } = useCart();

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
        // Require explicit color selection when item has both multiple colors and sizes
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

            {/* Left: image skeleton */}
            <Skeleton className="w-full aspect-square rounded-xl" />

            {/* Right: info skeleton */}
            <div className="flex flex-col gap-6 pt-2">
              {/* Badge */}
              <Skeleton className="h-6 w-20 rounded-full" />
              {/* Title */}
              <div className="space-y-3">
                <Skeleton className="h-10 w-4/5 rounded" />
                <Skeleton className="h-10 w-3/5 rounded" />
              </div>
              {/* Price */}
              <Skeleton className="h-9 w-28 rounded" />
              {/* Separator */}
              <Skeleton className="h-px w-full rounded" />
              {/* Size buttons */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-16 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-16 rounded-lg" />
                  <Skeleton className="h-10 w-16 rounded-lg" />
                  <Skeleton className="h-10 w-16 rounded-lg" />
                </div>
              </div>
              {/* Add to cart button */}
              <Skeleton className="h-14 w-full rounded-xl" />
              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-36 rounded" />
                ))}
              </div>
              {/* Separator */}
              <Skeleton className="h-px w-full rounded" />
              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
              {/* Accordion rows */}
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

  // Per-size stock: use sizeQuantities[selectedSize] when a size is selected
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

  // No stock label when size-based item has no size selected yet
  const stockLabel: { text: string } | null = hasSizes && !selectedSize
    ? null
    : effectiveOutOfStock
    ? { text: "Out of stock" }
    : effectiveStock <= 5
    ? { text: `Only ${effectiveStock} left` }
    : { text: "In stock" };

  const handleAddToCart = async () => {
    if (hasColors && !selectedColor) {
      toast.error("Please select a color first.");
      return;
    }
    if (hasSizes && !selectedSize) {
      toast.error("Please select a size before adding to cart.");
      return;
    }
    if (effectiveOutOfStock || atStockLimit) {
      toast.error(effectiveOutOfStock ? "This item is out of stock." : `Max quantity (${effectiveStock}) already in cart.`);
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
      toast.success(`${item.title} added to cart!`);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not add to cart.");
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
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/store">Shop</Link>
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
                {item.item_type}
              </Badge>
              {item.isNew && (
                <Badge className="bg-primary text-primary-foreground text-xs font-medium px-3">
                  New Arrival
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
              <span className="text-sm text-muted-foreground">incl. VAT</span>
            </div>

            <Separator />

            {/* Color selector */}
            {hasColors && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Color:{" "}
                  {selectedColor
                    ? <span className="text-muted-foreground font-normal">{selectedColor.name}</span>
                    : <span className="text-destructive font-normal">Select a color</span>
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
            {hasSizes && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Size:{" "}
                    {selectedSize ? (
                      <span className="text-muted-foreground font-normal">{formatSize(selectedSize)}</span>
                    ) : (
                      <span className="text-destructive font-normal">
                        {hasColors && !selectedColor ? "Select color first" : "Select a size"}
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
                        {!noStock && !disabledByColor && sizeStock <= 3 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] rounded-full px-1">
                            {sizeStock}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock status — shown after size selection for sized items */}
            {stockLabel && (
              <p className="text-sm text-foreground/60">{stockLabel.text}</p>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={adding || effectiveOutOfStock || atStockLimit}
              className="w-full flex items-center justify-center gap-3 py-4 px-8 bg-primary text-primary-foreground font-semibold text-base rounded-xl hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 shadow-sm"
            >
              <ShoppingBag className="h-5 w-5" />
              {adding
                ? "Adding to Cart..."
                : effectiveOutOfStock
                ? "Out of stock"
                : atStockLimit
                ? "Max quantity in cart"
                : "Add to Cart"}
            </button>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
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
                About this piece
              </h3>
              <p className="text-base leading-relaxed text-foreground">
                {item.description}
              </p>
            </div>

            {/* Accordion: extra info */}
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="materials">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  Materials & Care
                </AccordionTrigger>
                <AccordionContent>
                  {item.material_care ? (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {item.material_care.description}
                    </p>
                  ) : (
                    <ul className="text-sm text-muted-foreground space-y-1.5 leading-relaxed">
                      <li>• Made from high-quality, hypoallergenic materials</li>
                      <li>• Avoid contact with water, perfumes, and chemicals</li>
                      <li>• Store in a dry place when not wearing</li>
                      <li>• Clean gently with a soft, dry cloth</li>
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  Shipping & Returns
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="text-sm text-muted-foreground space-y-1.5 leading-relaxed">
                    <li>• Free shipping on all orders within Norway</li>
                    <li>• Delivery within 3–7 business days</li>
                    <li>• Easy returns within 14 days of delivery</li>
                    <li>• Items must be unworn and in original packaging</li>
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
              You might also like
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              More pieces from our collection
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
