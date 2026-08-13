import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NECKLACE_SIZES, CLOTHING_SIZES, ITEM_TYPES } from "@/interfaces/types";
import { supabase } from "../../helper/supabaseClient";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { deleteItem } from "@/services/items.service";

import { getItemFull, updateItem } from "@/services/items.service";
import { deleteItemPhoto, getItemPhotos, uploadItemPhoto } from "@/services/photos.service";
import {
  getAllColors,
  addColor as addNewColor,
  assignColorToItem,
  removeColorFromItem,
  reassignColorVariant,
} from "@/services/colors.service";
import { getMaterialCareGuides } from "@/services/materialCare.service";
import { getCollections } from "@/services/collections.service";
import { AdminItem, AdminItemColor, AdminPhoto, MaterialCareGuide, Collection } from "@/interfaces/types";

const AdminUpdateItem = () => {
  const { id } = useParams();
  const itemId = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [item, setItem] = useState<AdminItem | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [itemColors, setItemColors] = useState<AdminItemColor[]>([]);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [allColors, setAllColors] = useState<any[]>([]);

  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [selectedColorToAdd, setSelectedColorToAdd] = useState<number | null>(null);
  const [guides, setGuides] = useState<MaterialCareGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<number | "">("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | "">("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await getItemFull(itemId);
        const c = await getAllColors();
        const photosResult = await getItemPhotos(itemId);
        getMaterialCareGuides().then(setGuides).catch(() => {});
        getCollections().then(setCollections).catch(() => {});

        setAllColors(c || []);
        setItem(result.item || null);
        setItemColors(result.itemColors || []);
        setPhotos(photosResult || []);
        const sizes = result.item?.sizes ?? [];
        setSelectedSizes(sizes);
        setSelectedGuideId(result.item?.material_care_id ?? "");
        setSelectedCollectionId(result.item?.collection_id ?? "");

        // Load per-size quantities
        const { data: sizeQtyRows } = await supabase
          .from("item_size_quantities")
          .select("size, quantity")
          .eq("item_id", itemId);
        const loadedQties: Record<string, number> = {};
        for (const row of sizeQtyRows ?? []) loadedQties[row.size] = row.quantity;
        setSizeQuantities(loadedQties);

        // Detect custom sizes (not in either preset list)
        const allPresets = [...NECKLACE_SIZES, ...CLOTHING_SIZES];
        setCustomSizes(sizes.filter((s) => !allPresets.includes(s)));
      } catch (err) {
        console.error("Error loading item data:", err);
        alert("Failed loading item data (check console).");
      } finally {
        setLoading(false);
      }
    };
    if (!isNaN(itemId)) load();
  }, [itemId]);

  const currentItemType = item?.item_type ?? "necklace";
  const presetSizes =
    currentItemType === "knitting_pattern" ? CLOTHING_SIZES :
    (currentItemType === "necklace" || currentItemType === "bracelet") ? NECKLACE_SIZES :
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
    setSizeQuantities((q) => ({ ...q, [s]: q[s] ?? 1 }));
    setCustomSizeInput("");
  };

  const removeCustomSize = (size: string) => {
    setCustomSizes((prev) => prev.filter((s) => s !== size));
    setSelectedSizes((prev) => prev.filter((s) => s !== size));
    setSizeQuantities((q) => { const n = { ...q }; delete n[size]; return n; });
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${item?.item_name}"? This cannot be undone and removes all photos and color variants.`)) return;
    try {
      await deleteItem(itemId);
      navigate("/admin/AdminItemOverview");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete item.");
    }
  };

  const handleSaveAll = async () => {
    if (!item) return;
    setSaving(true);
    try {
      let totalQuantity = item.quantity;

      if (selectedSizes.length > 0) {
        // Upsert quantities for all selected sizes
        for (const size of selectedSizes) {
          await supabase.from("item_size_quantities").upsert(
            { item_id: itemId, size, quantity: sizeQuantities[size] ?? 0 },
            { onConflict: "item_id,size" }
          );
        }
        // Delete quantities for sizes that were removed
        const { data: existingRows } = await supabase
          .from("item_size_quantities").select("size").eq("item_id", itemId);
        const removedSizes = (existingRows ?? [])
          .map((r: any) => r.size)
          .filter((s: string) => !selectedSizes.includes(s));
        if (removedSizes.length > 0) {
          await supabase.from("item_size_quantities").delete()
            .eq("item_id", itemId).in("size", removedSizes);
        }
        totalQuantity = selectedSizes.reduce((sum, s) => sum + (sizeQuantities[s] ?? 0), 0);
      } else {
        // No sizes — delete all size quantity rows if any
        await supabase.from("item_size_quantities").delete().eq("item_id", itemId);
        totalQuantity = item.quantity;
      }

      await updateItem(itemId, {
        item_name: item.item_name,
        description: item.description,
        price: item.price,
        quantity: totalQuantity,
        item_type: item.item_type,
        sizes: selectedSizes,
        material_care_id: selectedGuideId !== "" ? selectedGuideId : null,
        collection_id: selectedCollectionId !== "" ? selectedCollectionId : null,
        ishidden: item.ishidden ?? false,
      });
      navigate("/admin/AdminItemOverview");
    } catch (err) {
      console.error("Failed saving item:", err);
      alert("Save failed (check console)");
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingColorVariant = async (color_id: number) => {
    try {
      const created = await assignColorToItem(itemId, color_id);
      setItemColors((prev) => [...prev, created]);
    } catch (err) {
      console.error("Failed to assign color:", err);
      alert("Assign color failed");
    }
  };

  const handleCreateAndAssignColor = async () => {
    if (!newColorName || !newColorHex) return alert("Fill in name and hex");
    try {
      const createdColor = await addNewColor(newColorName, newColorHex);
      setAllColors((prev) => [...prev, createdColor]);
      const createdItemColor = await assignColorToItem(itemId, createdColor.color_id);
      setItemColors((prev) => [...prev, createdItemColor]);
      setNewColorName("");
      setNewColorHex("#000000");
    } catch (err) {
      console.error("Failed creating color:", err);
      alert("Failed to create/assign color");
    }
  };

  const handleRemoveColorVariant = async (item_color_id: number) => {
    if (!confirm("Remove this color variant and all its photos?")) return;
    try {
      await removeColorFromItem(item_color_id);
      setItemColors((prev) => prev.filter((c) => c.item_color_id !== item_color_id));
      setPhotos((prev) => prev.filter((p) => p.item_color_id !== item_color_id));
    } catch (err) {
      console.error("Failed removing color variant:", err);
      alert("Failed to remove color variant");
    }
  };

  const handleChangeColorAssignment = async (
    item_color_id: number,
    new_color_id: number
  ) => {
    try {
      await reassignColorVariant(item_color_id, new_color_id);
      setItemColors((prev) =>
        prev.map((c) =>
          c.item_color_id === item_color_id ? { ...c, color_id: new_color_id } : c
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to change color assignment");
    }
  };

  const handleUploadFilesForColor = async (
    item_color_id: number,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const photoRow = await uploadItemPhoto(itemId, item_color_id, files[i]);
        uploaded.push(photoRow);
      }
      setPhotos((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed (see console)");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo_id: number) => {
    if (!confirm("Delete this photo?")) return;
    try {
      await deleteItemPhoto(photo_id);
      setPhotos((prev) => prev.filter((p) => p.photo_id !== photo_id));
    } catch (err) {
      console.error("Failed deleting photo:", err);
      alert("Delete failed");
    }
  };

  if (loading)
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Edit Item</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 rounded-lg font-semibold hover:bg-red-100 transition"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={item?.item_name ?? ""}
                onChange={(e) =>
                  setItem((s: any) => ({ ...s, item_name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={4}
                value={item?.description ?? ""}
                onChange={(e) =>
                  setItem((s: any) => ({ ...s, description: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price (NOK)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  type="number"
                  value={item?.price ?? 0}
                  onChange={(e) =>
                    setItem((s: any) => ({ ...s, price: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  type="number"
                  value={item?.quantity ?? 0}
                  onChange={(e) =>
                    setItem((s: any) => ({ ...s, quantity: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Item Type</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={item?.item_type ?? "necklace"}
                  onChange={(e) =>
                    setItem((s: any) => ({ ...s, item_type: e.target.value }))
                  }
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
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
                id="isHiddenUpdate"
                checked={item?.ishidden ?? false}
                onChange={(e) => setItem((s: any) => ({ ...s, ishidden: e.target.checked }))}
                className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
              />
              <label htmlFor="isHiddenUpdate" className="cursor-pointer">
                <span className="text-sm font-medium">Hide from store</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When checked, this item is not visible to customers.
                </p>
              </label>
            </div>
          </div>

          {/* Sizes */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-lg border-b pb-2 mb-4">Available Sizes</h2>

            {presetSizes.length > 0 ? (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {currentItemType === "knitting_pattern" ? "Clothing sizes" : "Standard lengths"}
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

            {/* No sizes selected — show direct quantity edit */}
            {selectedSizes.length === 0 && (
              <div className="flex items-center gap-3 mt-2">
                <label className="text-sm font-medium shrink-0">Total quantity in stock</label>
                <input
                  type="number" min="0"
                  value={item?.quantity ?? 0}
                  onChange={(e) => setItem((s: any) => ({ ...s, quantity: Number(e.target.value) }))}
                  className="w-28 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-xs text-muted-foreground">stk</span>
              </div>
            )}
          </div>

          {/* Color Variants */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-lg border-b pb-2 mb-4">Color Variants</h2>

            <div className="space-y-5">
              {itemColors.map((ic) => {
                const assignedColor = allColors.find(
                  (c) => c.color_id === ic.color_id
                );
                const variantPhotos = photos.filter(
                  (p) => p.item_color_id === ic.item_color_id
                );
                return (
                  <div key={ic.item_color_id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow"
                          style={{ background: assignedColor?.color_hex ?? "#ccc" }}
                        />
                        <select
                          className="border rounded-lg px-2 py-1 text-sm"
                          value={ic.color_id ?? ""}
                          onChange={(e) =>
                            handleChangeColorAssignment(
                              ic.item_color_id,
                              Number(e.target.value)
                            )
                          }
                        >
                          <option value="">Select color</option>
                          {allColors.map((c) => (
                            <option key={c.color_id} value={c.color_id}>
                              {c.color_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            id={`file-${ic.item_color_id}`}
                            onChange={(e) =>
                              handleUploadFilesForColor(
                                ic.item_color_id,
                                e.target.files
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              document
                                .getElementById(`file-${ic.item_color_id}`)
                                ?.click()
                            }
                            className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm hover:bg-primary/90 transition"
                          >
                            {uploading ? "Uploading..." : "Upload photos"}
                          </button>
                        </label>
                        <button
                          onClick={() =>
                            handleRemoveColorVariant(ic.item_color_id)
                          }
                          className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm hover:bg-red-200 transition"
                        >
                          Remove variant
                        </button>
                      </div>
                    </div>

                    {variantPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {variantPhotos.map((p) => (
                          <div key={p.photo_id} className="relative group">
                            <img
                              src={p.photo_url}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => handleDeletePhoto(p.photo_id)}
                              className="absolute top-1 right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add existing color variant */}
            <div className="mt-5 pt-4 border-t space-y-3">
              <div className="flex gap-2">
                <select
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  value={selectedColorToAdd ?? ""}
                  onChange={(e) => setSelectedColorToAdd(Number(e.target.value))}
                >
                  <option value="">Pick existing color to add</option>
                  {allColors.map((c) => (
                    <option key={c.color_id} value={c.color_id}>
                      {c.color_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (!selectedColorToAdd) return alert("Pick a color first");
                    handleAddExistingColorVariant(selectedColorToAdd);
                    setSelectedColorToAdd(null);
                  }}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition"
                >
                  Add variant
                </button>
              </div>

              {/* Create new color */}
              <div className="flex gap-2 items-center">
                <input
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  placeholder="New color name"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                />
                <input
                  type="color"
                  className="w-10 h-10 p-0.5 border rounded-lg cursor-pointer"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                />
                <input
                  className="w-24 border rounded-lg px-2 py-2 text-sm font-mono"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                />
                <button
                  onClick={handleCreateAndAssignColor}
                  className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-sm hover:bg-secondary/80 transition"
                >
                  Create & assign
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUpdateItem;
