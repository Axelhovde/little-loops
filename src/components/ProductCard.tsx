import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Item } from "../interfaces/types";
import ColorSwatches from "@/components/colorSwatches";

const ProductCard = ({ item, onItemPressed }: { item: Item; onItemPressed: (id: number) => void }) => {
  const [selectedColor, setSelectedColor] = useState(item.colors[0]);
  const [isNew] = useState(true);

  const photos = selectedColor.photos
    .sort((a, b) => a.display_order - b.display_order)
    .map(p => p.photo_url)
    .slice(0, 2);

  return (
    <Card
      key={item.id}
      variant="plain"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button")) {
          onItemPressed(Number(item.id));
        }
      }}
      className="group overflow-hidden flex-row aspect-[3/5] transition-all duration-300 rounded-none"
    >
      {/* Image container */}
      <div className="relative h-[85%] overflow-hidden group">
        {/* New badge */}
        {isNew && (
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-background/80 z-10 rounded-full leading-relaxed text-muted-foreground text-[10px] sm:text-xs py-0.5 sm:py-1 px-2 sm:px-3">
            New
          </div>
        )}

        {/* Quick Add button */}
        <Button
          size="icon"
          variant="ghost"
          className="
            absolute bottom-2 right-3.5
            rounded-full border bg-background/80 hover:bg-background z-10
            h-6 w-6         /* base: very small screens */
            sm:h-7 sm:w-7   /* small screens and up */
            md:h-8 md:w-8   /* medium screens and up */
            lg:h-9 lg:w-9   /* large screens and up */
          "
        >
          <Plus className="" />
        </Button>


        {/* Color Swatches for small screens */}
        <div className="absolute bottom-2 left-2 sm:hidden bg-white rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ColorSwatches
            colors={item.colors}
            selectedColor={selectedColor}
            onSelect={(color) => setSelectedColor(color)}
          />
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <img
            src={photos[0]}
            alt={item.title}
            className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
          />
        )}
        {photos.length > 1 && (
          <img
            src={photos[1]}
            alt={item.title}
            className="w-full h-full object-cover absolute top-0 left-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100"
          />
        )}
      </div>

      {/* Content */}
      <CardContent className="p-2 sm:p-3 flex flex-col items-center justify-center bg-background relative">
        {/* Title and Price */}
        <h3 className="text-xs sm:text-sm md:text-lg font-sans text-foreground text-center">
          {item.title}
        </h3>
        <span className="text-[10px] sm:text-xs md:text-sm font-sans text-foreground text-center">
          {item.price} NOK
        </span>

        {/* Color Swatches for larger screens */}
        <div className="absolute bottom-4 sm:bottom-6 right-2 hidden sm:block group-hover:opacity-100 opacity-0 transition-opacity duration-500">
          <ColorSwatches
            colors={item.colors}
            selectedColor={selectedColor}
            onSelect={(color) => setSelectedColor(color)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
