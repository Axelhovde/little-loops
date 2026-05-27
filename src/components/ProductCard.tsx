import { useState } from "react";
import { Item, ItemColor } from "../interfaces/types";
import ColorSwatches from "@/components/colorSwatches";
import { useCart } from "@/contexts/cartContext";
import { toast } from "sonner";

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
  const canAdd = colorReady && sizeReady;

  const effectiveStock = hasSizes && selectedSize
    ? getStockForSize(selectedSize)
    : stock;
  const outOfStock = effectiveStock === 0;

  const addLabel = !colorReady
    ? "Select a color"
    : !sizeReady
    ? "Select a size"
    : outOfStock
    ? "Out of stock"
    : "Add to Cart";

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canAdd || outOfStock) return;
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
      className="group cursor-pointer rounded-xl overflow-hidden border bg-white flex flex-col"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button")) {
          onItemPressed(Number(item.id));
        }
      }}
    >
      {/* Photo */}
      <div className="relative overflow-hidden aspect-[3/4]">
        {item.isNew && (
          <div className="absolute top-2 left-2 z-10 bg-white/80 rounded-full text-[10px] px-2 py-0.5 text-muted-foreground">
            New
          </div>
        )}
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
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Title + price */}
        <div>
          <h3 className="text-sm font-medium leading-snug line-clamp-1">{item.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{item.price} NOK</p>
        </div>

        {/* Color picker — shown first if multiple colors */}
        {hasMultipleColors && (
          <div onClick={e => e.stopPropagation()}>
            <ColorSwatches
              colors={item.colors}
              selectedColor={selectedColor}
              onSelect={(c) => { setSelectedColor(c); setSelectedSize(null); }}
            />
          </div>
        )}

        {/* Size buttons */}
        {hasSizes && (
          <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
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
                  className={`px-2 py-0.5 text-[10px] rounded border transition-all
                    disabled:opacity-30 disabled:cursor-not-allowed
                    ${noStock ? "line-through" : ""}
                    ${isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary hover:text-primary"
                    }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}

        {/* Quick-add button */}
        <button
          onClick={handleAdd}
          disabled={!canAdd || outOfStock}
          className="mt-auto w-full py-1.5 text-xs font-medium rounded-lg border transition-colors
            bg-primary text-primary-foreground hover:bg-primary/90
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
