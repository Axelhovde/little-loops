// src/pages/ItemPage.tsx
import SiteNavigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import CustomSwiper from "@/components/customSwiper";
import ColorSwatches from "@/components/colorSwatches";
import { getItemFull } from "@/services/items.service";
import type {
  ItemColor as ProjectItemColor,
  ItemPhoto as ProjectItemPhoto,
} from "@/interfaces/types";

/**
 * If your project doesn't export ItemColor / ItemPhoto from "@/interfaces/types",
 * change the import above to match where you define those interfaces.
 *
 * The rest of the file assumes:
 * ProjectItemColor = { id: number; name: string; hex?: string; photos: ProjectItemPhoto[] }
 * ProjectItemPhoto = { photo_id: number; item_color_id: number; photo_url: string }
 */

type LocalItem = {
  id: number;
  title: string;
  description: string;
  price: string;
  photos: ProjectItemPhoto[]; // all photos (we'll filter by color for display)
  colors: ProjectItemColor[];  // color variants (with photos array inside)
};

const ItemPage = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<LocalItem | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProjectItemColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const itemData = await getItemFull(Number(id));
        // itemData contains: item, itemColors, photos (raw supabase rows)
        // Map itemColors -> ProjectItemColor, ensure each has a photos array
        const mappedColors: ProjectItemColor[] = (itemData.itemColors || []).map((ic: any) => {
          const photosForThisVariant: ProjectItemPhoto[] = (itemData.photos || [])
            .filter((p: any) => p.item_color_id === ic.item_color_id)
            .map((p: any) => ({
              photo_id: p.photo_id,
              item_color_id: p.item_color_id,
              photo_url: p.photo_url,
            }));

          return {
            id: ic.item_color_id, // match your project's ItemColor.id
            name: ic.colors?.color_name ?? "",
            hex: ic.colors?.color_hex ?? undefined,
            photos: photosForThisVariant,
          } as ProjectItemColor;
        });

        // Map all photos to a common shape
        const mappedPhotos: ProjectItemPhoto[] = (itemData.photos || []).map((p: any) => ({
          photo_id: p.photo_id,
          item_color_id: p.item_color_id,
          photo_url: p.photo_url,
        }));

        const fullItem: LocalItem = {
          id: itemData.item.item_id,
          title: itemData.item.item_name,
          description: itemData.item.description,
          price: itemData.item.price,
          photos: mappedPhotos,
          colors: mappedColors,
        };

        setItem(fullItem);
        if (mappedColors.length > 0) setSelectedColor(mappedColors[0]);
      } catch (err) {
        console.error("Error loading item:", err);
      }
    };

    load();
  }, [id]);

  if (!item) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  // The photos we want to display in the swiper are the photos for the selected color.
  const displayedPhotos = selectedColor?.photos ?? [];

  const sizes = ["S", "M", "L", "One-Size"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavigation />

      <div className="container mx-auto py-16 px-4 lg:px-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Product Images */}
          {/* CustomSwiper is given only the photos array and title */}
          <CustomSwiper photos={displayedPhotos.map((p) => p.photo_url)} title={item.title} />

          {/* Right: Product Info */}
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl font-bold">{item.title}</h1>

            {/* Top controls: colors + sizes (placed near top) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
              <div>
                <span className="text-xl">{item.price}kr</span>
              </div>

              <div className="flex items-center gap-6">
                {/* Color Swatches */}
                {item.colors.length > 0 && (
                  <ColorSwatches
                    colors={item.colors}
                    selectedColor={selectedColor as ProjectItemColor}
                    onSelect={(c) => {
                      // wrap setSelectedColor to ensure exact param type
                      setSelectedColor(c);
                    }}
                  />
                )}

                {/* Size selector (compact) */}
                <div className="flex gap-2 items-center">
                  {sizes.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(isSelected ? null : size)}
                        className={`px-3 py-1 rounded border text-sm transition ${
                          isSelected
                            ? "bg-primary text-background border-primary"
                            : "bg-background text-foreground border-muted-foreground hover:border-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="mt-6 text-base md:text-lg leading-relaxed text-muted-foreground">
              {item.description}
            </p>

            <button className="mt-6 bg-primary text-background font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition w-full md:w-auto">
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ItemPage;
