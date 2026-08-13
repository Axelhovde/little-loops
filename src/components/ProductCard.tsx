import { useState } from "react";
import { Item, ItemColor } from "../interfaces/types";
import ColorSwatches from "@/components/colorSwatches";
import { useCart } from "@/contexts/cartContext";
import { toast } from "sonner";
import { formatSize } from "@/lib/sizeUtils";

const ProductCard = ({ item, onItemPressed }: { item: Item; onItemPressed: (id: number) => void }) => {
  const hasMultipleColors = item.colors.length > 1;
  const hasSizes = item.sizes && item.sizes.length > 0;

  const [selectedColor, setSelectedColor] = useState<ItemColor | null>(
    hasMultipleColors ? null : (item.colors[0] ?? null)
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const { addItem, items: cartItems } = useCart();

  const displayColor = selectedColor ?? item.colors[0];
  const photos = (displayColor?.photos ?? [])
    .sort((a, b) => a.display_order - b.display_order)
    .map(p => p.photo_url)
    .slice(0, 2);

  const stock = item.quantity ?? 0;
  const outOfStock = stock === 0;

  const getStockForSize = (size: string): number => {
    if (item.sizeQuantities && item.sizeQuantities[size] !== undefined) {
      return item.sizeQuantities[size];
    }
    return stock;
  };

  const cartQtyForSize = (size: string) =>
    cartItems
      .filter(i => i.itemId === item.id && i.selectedSize === size)
      .reduce((s, i) => s + i.quantity, 0);

  const colorReady = !hasMultipleColors || selectedColor !== null;
  const sizeReady = !hasSizes || selectedSize !== null;
  const canAdd = colorReady && sizeReady && !outOfStock;

  const effectiveStock = hasSizes && selectedSize
    ? getStockForSize(selectedSize)
    : stock;

  const addLabel = !colorReady
    ? "Select a color"
    : !sizeReady
    ? "Select a size"
    : outOfStock
    ? "Out of stock"
    : "Add to Cart";

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canAdd) return;
    const alreadyInCart = selectedSize ? cartQtyForSize(selectedSize) : 0;
    if (selectedSize && alreadyInCart >= effectiveStock) {
      toast.error("Max quantity reached");
      return;
    }
    addItem({
      itemId: Number(item.id),
      title: item.title,
      price: item.price,
      quantity: 1,
      photo: photos[0] ?? "",
      selectedSize: selectedSize ?? undefined,
      stockQuantity: effectiveStock,
    });
    toast.success(`${item.title} added to cart!`);
  };

  return (
    <div
      className="group cursor-pointer"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button")) {
          onItemPressed(Number(item.id));
        }
      }}
    >
      {/* Photo */}
      <div className="relative overflow-hidden aspect-[3/4] bg-neutral-100">
        {/* Badges */}
        {outOfStock ? (
          <div className="absolute top-3 left-3 z-10 bg-neutral-800 text-white text-xs font-medium px-3 py-1 rounded-full">
            Out of stock
          </div>
        ) : item.isNew ? (
          <div className="absolute top-3 left-3 z-10 bg-white text-neutral-800 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
            New
          </div>
        ) : null}

        {/* Photos with crossfade on hover */}
        {photos[0] && (
          <img
            src={photos[0]}
            alt={item.title}
            className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
          />
        )}
        {photos[1] && (
          <img
            src={photos[1]}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}

        {/* Quick-add overlay — always visible on mobile, slides up on hover for desktop */}
        <div
          className={`
            absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-3 space-y-2
            translate-y-0 md:translate-y-full md:group-hover:translate-y-0
            transition-transform duration-300 ease-out
          `}
          onClick={e => e.stopPropagation()}
        >
          {/* Color picker — first if multiple colors */}
          {hasMultipleColors && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Color</span>
              <ColorSwatches
                colors={item.colors}
                selectedColor={selectedColor}
                onSelect={(c) => { setSelectedColor(c); setSelectedSize(null); }}
              />
            </div>
          )}

          {/* Size buttons */}
          {hasSizes && (
            <div className="flex flex-wrap gap-1">
              {item.sizes.map((size) => {
                const sizeStock = getStockForSize(size);
                const noStock = sizeStock === 0;
                const disabledByColor = hasMultipleColors && !selectedColor;
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      if (!noStock && !disabledByColor) {
                        setSelectedSize(isSelected ? null : size);
                      }
                    }}
                    disabled={noStock || disabledByColor}
                    title={noStock ? "Out of stock" : undefined}
                    className={`px-2 py-0.5 text-[10px] rounded border transition-all
                      disabled:opacity-30 disabled:cursor-not-allowed
                      ${noStock ? "line-through" : ""}
                      ${isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-white hover:border-primary hover:text-primary"
                      }`}
                  >
                    {formatSize(size)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="w-full py-1.5 text-xs font-medium rounded-lg transition-colors
              bg-primary text-primary-foreground hover:bg-primary/90
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {addLabel}
          </button>
        </div>
      </div>

      {/* Content below photo */}
      <div className="pt-2 pb-1 text-center">
        <h3 className="text-sm font-medium leading-snug">{item.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{item.price} NOK</p>
      </div>
    </div>
  );
};

export default ProductCard;
