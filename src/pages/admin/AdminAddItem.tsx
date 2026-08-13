import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../helper/supabaseClient";
import { NECKLACE_SIZES, CLOTHING_SIZES, ITEM_TYPES } from "@/interfaces/types";
import { getMaterialCareGuides } from "@/services/materialCare.service";
import { getCollections } from "@/services/collections.service";
import type { MaterialCareGuide, Collection } from "@/interfaces/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft } from "lucide-react";

interface ImageItem {
  id: string;
  file: File;
  preview: string;
}

interface ColorImages {
  colorName: string;
  colorHex: string;
  colorId?: number;
  images: ImageItem[];
}

const SortableImage = ({ image, index, onRemove }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative w-20 h-20 border border-gray-300 rounded-lg overflow-hidden cursor-grab"
    >
      <img src={image.preview} alt="preview" className="w-full h-full object-cover" />
      <button
        onClick={() => onRemove(index)}
        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl w-5 h-5 flex items-center justify-center text-xs"
      >
        ×
      </button>
    </div>
  );
};

const AdminAddItem = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(1);
  const [itemType, setItemType] = useState("necklace");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState<ColorImages[]>([]);
  const [newColor, setNewColor] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [existingColors, setExistingColors] = useState<
    { color_id: number; color_name: string; color_hex: string }[]
  >([]);
  const [guides, setGuides] = useState<MaterialCareGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<number | "">("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | "">("");
  const [isHidden, setIsHidden] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    supabase
      .from("colors")
      .select("*")
      .then(({ data }) => data && setExistingColors(data));
    getMaterialCareGuides().then(setGuides).catch(() => {});
    getCollections().then(setCollections).catch(() => {});
  }, []);

  const presetSizes =
    itemType === "knitting_pattern" ? CLOTHING_SIZES :
    (itemType === "necklace" || itemType === "bracelet") ? NECKLACE_SIZES :
    [];

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => {
      if (prev.includes(size)) {
        setSizeQuantities((q) => { const n = { ...q }; delete n[size]; return n; });
        return prev.filter((s) => s !== size);
      }
      setSizeQuantities((q) => ({ ...q, [size]: q[size] ?? 1 }));
      return [...prev, size];
    });
  };

  const addCustomSize = () => {
    const s = customSizeInput.trim();
    if (!s || customSizes.includes(s) || NECKLACE_SIZES.includes(s) || CLOTHING_SIZES.includes(s)) return;
    setCustomSizes((prev) => [...prev, s]);
    setSelectedSizes((prev) => [...prev, s]);
    setSizeQuantities((q) => ({ ...q, [s]: 1 }));
    setCustomSizeInput("");
  };

  const removeCustomSize = (size: string) => {
    setCustomSizes((prev) => prev.filter((s) => s !== size));
    setSelectedSizes((prev) => prev.filter((s) => s !== size));
    setSizeQuantities((q) => { const n = { ...q }; delete n[size]; return n; });
  };

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_IMAGE_SIZE_MB = 10;

  const handleFiles = (files: FileList, colorIndex: number) => {
    const validFiles = Array.from(files).filter((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        alert(`"${file.name}" is not a supported image type. Use JPEG, PNG, WebP, or GIF.`);
        return false;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`"${file.name}" exceeds the ${MAX_IMAGE_SIZE_MB} MB limit.`);
        return false;
      }
      return true;
    });
    const newImages = validFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      return { id: preview, file, preview };
    });
    setColors((prev) =>
      prev.map((color, idx) =>
        idx === colorIndex
          ? { ...color, images: [...color.images, ...newImages] }
          : color
      )
    );
  };

  const handleRemoveImage = (colorIndex: number, imageIndex: number) => {
    setColors((prev) =>
      prev.map((color, idx) =>
        idx === colorIndex
          ? { ...color, images: color.images.filter((_, i) => i !== imageIndex) }
          : color
      )
    );
  };

  const handleDragEnd = (colorIndex: number, event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setColors((prev) =>
      prev.map((color, idx) => {
        if (idx !== colorIndex) return color;
        const oldIndex = color.images.findIndex((img) => img.id === active.id);
        const newIndex = color.images.findIndex((img) => img.id === over.id);
        return { ...color, images: arrayMove(color.images, oldIndex, newIndex) };
      })
    );
  };

  const addExistingColor = (color: {
    color_id: number;
    color_name: string;
    color_hex: string;
  }) => {
    if (colors.some((c) => c.colorId === color.color_id)) return;
    setColors((prev) => [
      ...prev,
      {
        colorName: color.color_name,
        colorHex: color.color_hex ?? "#000000",
        colorId: color.color_id,
        images: [],
      },
    ]);
  };

  const addNewColor = () => {
    if (!newColor.trim()) return;
    setColors((prev) => [
      ...prev,
      { colorName: newColor.trim(), colorHex: newColorHex, images: [] },
    ]);
    setNewColor("");
    setNewColorHex("#000000");
  };

  const removeColorSection = (colorIndex: number) => {
    setColors((prev) => prev.filter((_, i) => i !== colorIndex));
  };

  const validateForm = (): string | null => {
    const t = title.trim();
    const d = description.trim();
    if (!t || t.length > 200) return "Title must be 1–200 characters.";
    if (!d || d.length > 5000) return "Description must be 1–5000 characters.";
    if (price === "" || Number(price) <= 0 || Number(price) > 1_000_000)
      return "Price must be between 0.01 and 1 000 000 NOK.";
    if (!Number.isInteger(Number(price) * 100))
      return "Price can have at most two decimal places.";
    if (quantity < 0) return "Quantity cannot be negative.";
    if (colors.length === 0) return "Add at least one color.";
    return null;
  };

  const handleAddItem = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    setLoading(true);

    try {
      const totalQuantity = selectedSizes.length > 0
        ? selectedSizes.reduce((sum, s) => sum + (sizeQuantities[s] ?? 0), 0)
        : quantity;

      const { data: newItem, error: itemError } = await supabase
        .from("items")
        .insert({
          item_name: title,
          description,
          price,
          quantity: totalQuantity,
          item_type: itemType,
          sizes: selectedSizes,
          material_care_id: selectedGuideId !== "" ? selectedGuideId : null,
          collection_id: selectedCollectionId !== "" ? selectedCollectionId : null,
          ishidden: isHidden,
        })
        .select()
        .single();
      if (itemError) throw itemError;
      const itemId = newItem.item_id;

      if (selectedSizes.length > 0) {
        const { error: sizeError } = await supabase.from("item_size_quantities").insert(
          selectedSizes.map((size) => ({ item_id: itemId, size, quantity: sizeQuantities[size] ?? 0 }))
        );
        if (sizeError) throw sizeError;
      }

      for (const color of colors) {
        let colorId = color.colorId;

        if (!colorId) {
          const { data: newColorData, error: colorInsertError } = await supabase
            .from("colors")
            .insert({ color_name: color.colorName, color_hex: color.colorHex })
            .select()
            .single();
          if (colorInsertError) throw colorInsertError;
          colorId = newColorData.color_id;
        }

        const { data: itemColorData, error: itemColorError } = await supabase
          .from("item_colors")
          .insert({ item_id: itemId, color_id: colorId })
          .select()
          .single();
        if (itemColorError) throw itemColorError;
        const itemColorId = itemColorData.item_color_id;

        for (let i = 0; i < color.images.length; i++) {
          const img = color.images[i];
          const fileExt = img.file.name.split(".").pop();
          const fileName = `${itemId}-${itemColorId}-${i + 1}.${fileExt}`;
          const filePath = `items/${itemId}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from("items")
            .upload(filePath, img.file, { upsert: true });
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from("items").getPublicUrl(filePath);

          await supabase.from("item_photos").insert({
            item_id: itemId,
            item_color_id: itemColorId,
            photo_url: data.publicUrl,
            display_order: i + 1,
          });
        }
      }

      navigate("/admin");
    } catch (err: any) {
      const msg = err?.message ?? err?.error_description ?? JSON.stringify(err);
      console.error("Error adding item:", err);
      alert(`Failed to add item:\n\n${msg}\n\nIf the error mentions a missing column, make sure you have run supabase-migration.sql in your Supabase SQL editor.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8">Add New Item</h1>

        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          {/* Basic Info */}
          <section>
            <h2 className="font-semibold text-lg mb-3 border-b pb-2">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Silver Pearl Necklace"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (NOK) *</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="299"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity in stock</label>
                  {selectedSizes.length > 0 ? (
                    <div className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-sm text-muted-foreground">
                      {selectedSizes.reduce((s, sz) => s + (sizeQuantities[sz] ?? 0), 0)} (from sizes)
                    </div>
                  ) : (
                    <input
                      type="number"
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min="0"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Item Type</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Materials & Care Guide
                  <span className="ml-2 font-normal text-muted-foreground text-xs">(optional)</span>
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={selectedGuideId}
                  onChange={(e) =>
                    setSelectedGuideId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                >
                  <option value="">— No guide —</option>
                  {guides.map((g) => (
                    <option key={g.guide_id} value={g.guide_id}>
                      {g.title}
                    </option>
                  ))}
                </select>
                {guides.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No guides yet — create them in{" "}
                    <a href="/admin/material-care" className="underline hover:text-primary">
                      Materials & Care
                    </a>
                    .
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Collection
                  <span className="ml-2 font-normal text-muted-foreground text-xs">(optional)</span>
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={selectedCollectionId}
                  onChange={(e) =>
                    setSelectedCollectionId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                >
                  <option value="">— No collection —</option>
                  {collections.map((c) => (
                    <option key={c.collection_id} value={c.collection_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {collections.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No collections yet — create them in{" "}
                    <a href="/admin/collections" className="underline hover:text-primary">
                      Collections
                    </a>
                    .
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                <input
                  type="checkbox"
                  id="isHidden"
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                />
                <label htmlFor="isHidden" className="cursor-pointer">
                  <span className="text-sm font-medium">Hide from store</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Item will be saved but not visible to customers until unhidden.
                  </p>
                </label>
              </div>
            </div>
          </section>

          {/* Sizes */}
          <section>
            <h2 className="font-semibold text-lg mb-3 border-b pb-2">Available Sizes</h2>

            {presetSizes.length > 0 ? (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {itemType === "knitting_pattern" ? "Clothing sizes" : "Standard lengths"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {presetSizes.map((size) => {
                    const active = selectedSizes.includes(size);
                    return (
                      <button
                        key={size} type="button" onClick={() => toggleSize(size)}
                        className={`px-4 py-2 rounded border text-sm transition ${
                          active ? "bg-primary text-primary-foreground border-primary"
                                 : "border-muted-foreground hover:border-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                No standard sizes for this type — add custom sizes below.
              </p>
            )}

            {/* Custom sizes */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Custom sizes</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {customSizes.map((size) => {
                  const active = selectedSizes.includes(size);
                  return (
                    <div key={size} className="flex items-stretch">
                      <button
                        type="button" onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 rounded-l border text-sm transition ${
                          active ? "bg-primary text-primary-foreground border-primary"
                                 : "border-muted-foreground hover:border-foreground"
                        }`}
                      >
                        {size}
                      </button>
                      <button
                        type="button" onClick={() => removeCustomSize(size)}
                        className="px-2 py-1.5 rounded-r border border-l-0 border-muted-foreground text-sm text-red-500 hover:bg-red-50 transition"
                        title="Remove custom size"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. One Size, 7 inches, 16 cm…"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomSize()}
                />
                <button
                  type="button" onClick={addCustomSize}
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm hover:bg-secondary/80 transition shrink-0"
                >
                  Add size
                </button>
              </div>
            </div>

            {/* Per-size quantities */}
            {selectedSizes.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium mb-3">Quantity per size</p>
                <div className="space-y-2">
                  {selectedSizes.map((size) => (
                    <div key={size} className="flex items-center gap-3">
                      <span className="w-20 text-sm font-mono text-right shrink-0">{size}</span>
                      <input
                        type="number" min="0"
                        value={sizeQuantities[size] ?? 0}
                        onChange={(e) => setSizeQuantities((q) => ({ ...q, [size]: Math.max(0, Number(e.target.value)) }))}
                        className="w-24 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <span className="text-xs text-muted-foreground">stk</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <span className="w-20 text-sm text-right shrink-0 text-muted-foreground">Total</span>
                    <span className="text-sm font-semibold">
                      {selectedSizes.reduce((s, sz) => s + (sizeQuantities[sz] ?? 0), 0)} stk
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Colors */}
          <section>
            <h2 className="font-semibold text-lg mb-3 border-b pb-2">Colors & Photos *</h2>

            {/* Pick from existing */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Add from existing colors:</p>
              <div className="flex flex-wrap gap-2">
                {existingColors.map((color) => (
                  <button
                    key={color.color_id}
                    type="button"
                    onClick={() => addExistingColor(color)}
                    disabled={colors.some((c) => c.colorId === color.color_id)}
                    className="flex items-center gap-1.5 px-3 py-1 border rounded-full text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <span
                      className="w-3 h-3 rounded-full border"
                      style={{ background: color.color_hex }}
                    />
                    {color.color_name}
                  </button>
                ))}
              </div>
            </div>

            {/* Add new color name + picker */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <input
                type="text"
                placeholder="New color name (e.g. Rose Gold)"
                className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNewColor()}
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-9 h-9 p-0.5 border rounded-lg cursor-pointer"
                  title="Pick a color"
                />
                <input
                  type="text"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  placeholder="#000000"
                  className="w-24 border rounded-lg px-2 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                type="button"
                onClick={addNewColor}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition shrink-0"
              >
                Add Color
              </button>
            </div>

            {/* Color sections */}
            <div className="space-y-4 mt-4">
              {colors.map((color, colorIndex) => (
                <div key={colorIndex} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full border border-gray-300 shrink-0"
                        style={{ background: color.colorHex }}
                      />
                      <h3 className="font-medium">{color.colorName}</h3>
                      <span className="text-xs font-mono text-muted-foreground">
                        {color.colorHex}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeColorSection(colorIndex)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <label className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition text-sm text-muted-foreground">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files && handleFiles(e.target.files, colorIndex)
                      }
                    />
                    Click to upload images for this color
                  </label>

                  {color.images.length > 0 && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleDragEnd(colorIndex, e)}
                    >
                      <SortableContext
                        items={color.images.map((img) => img.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-wrap gap-3 mt-3">
                          {color.images.map((img, index) => (
                            <SortableImage
                              key={img.id}
                              image={img}
                              index={index}
                              onRemove={(i: number) =>
                                handleRemoveImage(colorIndex, i)
                              }
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              ))}

              {colors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Add at least one color above to upload photos.
                </p>
              )}
            </div>
          </section>

          <button
            onClick={handleAddItem}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-60"
          >
            {loading ? "Adding item..." : "Add Item to Shop"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAddItem;
