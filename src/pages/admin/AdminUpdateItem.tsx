import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SiteNavigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ProductSize } from "@/types/ProductSize";



import {
getItemFull,
updateItem,

} from "@/services/items.service";

import {
    deleteItemPhoto,
    getItemPhotos,
uploadItemPhoto,

} from "@/services/photos.service";

import {
getAllColors,
addColor as addNewColor,
assignColorToItem,
removeColorFromItem,
reassignColorVariant,
} from "@/services/colors.service";

const AdminUpdateItem = () => {
const { id } = useParams();
const itemId = Number(id);
const [selectedSizes, setSelectedSizes] = useState<ProductSize[]>([]);

const [loading, setLoading] = useState(true);

const [item, setItem] = useState<any>(null);
const [itemColors, setItemColors] = useState<any[]>([]);
const [photos, setPhotos] = useState<any[]>([]);

const [allColors, setAllColors] = useState<any[]>([]);

const [newColorName, setNewColorName] = useState("");
const [newColorHex, setNewColorHex] = useState("#000000");

const [addingColorId, setAddingColorId] = useState<number | "existing" | null>(null);
const [selectedColorToAdd, setSelectedColorToAdd] = useState<number | null>(null);

const [uploading, setUploading] = useState(false);

const navigate = useNavigate();

useEffect(() => {
    const load = async () => {
    try {
        setLoading(true);
        const result = await getItemFull(itemId); // item, itemColors, photos from items.service
        const c = await getAllColors();
        const photosResult = await getItemPhotos(itemId); // photos.service

        setAllColors(c || []);
        setItem(result.item || null);
        setItemColors(result.itemColors || []);
        setPhotos(photosResult || []);
    } catch (err) {
        console.error("Error loading item data:", err);
        alert("Failed loading item data (check console).");
    } finally {
        setLoading(false);
    }
    };
    if (!isNaN(itemId)) load();
}, [itemId]);

// --- SAVE (single save for item fields) ---
const handleSaveAll = async () => {
    try {
    await updateItem(itemId, {
        item_name: item.item_name,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        sizes: selectedSizes,
        // add other fields if you have them
    });

    navigate(`/admin/AdminItemOverview`);

    } catch (err) {
    console.error("Failed saving item:", err);
    alert("Save failed (check console)");
    }
};

// --- Add existing color as a new item_color row (variant) ---
const handleAddExistingColorVariant = async (color_id: number) => {
    try {
    const created = await assignColorToItem(itemId, color_id); // returns item_color row
    // refresh list (append)
    setItemColors((prev) => [...prev, created]);
    // optionally fetch photos for this new variant (none yet)
    } catch (err) {
    console.error("Failed to assign color to item:", err);
    alert("Assign color failed");
    }
};

// --- Create a new color then assign it as variant ---
const handleCreateAndAssignColor = async () => {
    if (!newColorName || !newColorHex) return alert("Please fill name and hex");
    try {
    const createdColor = await addNewColor(newColorName, newColorHex);
    setAllColors((prev) => [...prev, createdColor]);
    // assign
    const createdItemColor = await assignColorToItem(itemId, createdColor.color_id);
    setItemColors((prev) => [...prev, createdItemColor]);
    setNewColorName("");
    setNewColorHex("#000000");
    } catch (err) {
    console.error("Failed creating + assigning color:", err);
    alert("Failed to create/assign color");
    }
};

// --- Remove a color variant (delete item_colors row) ---
const handleRemoveColorVariant = async (item_color_id: number) => {
    if (!confirm("Remove this color variant?")) return;
    try {
    await removeColorFromItem(item_color_id);
    setItemColors((prev) => prev.filter((c) => c.item_color_id !== item_color_id));
    } catch (err) {
    console.error("Failed removing color variant:", err);
    alert("Failed to remove color variant");
    }
};

// --- Change the color for an item_color row (reassign) ---
const handleChangeColorAssignment = async (item_color_id: number, new_color_id: number) => {
  try {
    const updatedItemColor = await reassignColorVariant(item_color_id, new_color_id);

    // Update local state
    setItemColors((prev) =>
      prev.map((c) =>
        c.item_color_id === item_color_id ? { ...c, color_id: new_color_id } : c
      )
    );

    setPhotos((prev) =>
      prev.map((p) =>
        p.item_color_id === item_color_id
          ? { ...p, item_color_id: updatedItemColor.item_color_id }
          : p
      )
    );

  } catch (err) {
    console.error(err);
    alert("Failed to change color assignment");
  }
};


    // --- Upload photos for a specific item_color (variant) ---
    const handleUploadFilesForColor = async (item_color_id: number, files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const uploaded: any[] = [];

            for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // use the service that handles display_order
            const photoRow = await uploadItemPhoto(itemId, item_color_id, file);
            uploaded.push(photoRow);
            }

            // append newly uploaded photos to state
            setPhotos((prev) => [...prev, ...uploaded]);
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Upload failed (see console)");
        } finally {
            setUploading(false);
        }
    };



// --- Remove photo ---
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

if (loading) return <div className="p-8 text-center">Loading...</div>;

return (
    <div className="min-h-screen bg-background flex flex-col items-center">
    <SiteNavigation />

    <div className="w-full max-w-4xl px-4 py-12">
        <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Edit Item</h1>

        {/* Item basic fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
                className="w-full border rounded px-3 py-2"
                value={item?.item_name ?? ""}
                onChange={(e) => setItem((s: any) => ({ ...s, item_name: e.target.value }))}
            />
            </div>

            <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
                className="w-full border rounded px-3 py-2"
                rows={4}
                value={item?.description ?? ""}
                onChange={(e) => setItem((s: any) => ({ ...s, description: e.target.value }))}
            />
            </div>

            <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
                className="w-full border rounded px-3 py-2"
                type="number"
                value={item?.price ?? 0}
                onChange={(e) => setItem((s: any) => ({ ...s, price: Number(e.target.value) }))}
            />
            </div>

            <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
                className="w-full border rounded px-3 py-2"
                type="number"
                value={item?.quantity ?? 0}
                onChange={(e) => setItem((s: any) => ({ ...s, quantity: Number(e.target.value) }))}
            />
            </div>
        </div>
        <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Available Sizes</h2>
            <div className="flex gap-3 flex-wrap">
                {Object.values(ProductSize).map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                    <button
                    key={size}
                    onClick={() => {
                        if (isSelected) {
                        setSelectedSizes(selectedSizes.filter((s) => s !== size));
                        } else {
                        setSelectedSizes([...selectedSizes, size]);
                        }
                    }}
                    className={`px-3 py-1 rounded border transition ${
                        isSelected
                        ? "bg-primary text-white border-primary"
                        : "bg-background text-foreground border-muted-foreground"
                    }`}
                    >
                    {size}
                    </button>
                );
                })}
            </div>
        </div>

        {/* Colors + Photos grouped */}
        <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Color Variants</h2>

            {/* List existing item_color rows */}
            {itemColors.length === 0 && (
            <p className="text-sm text-muted mb-3 text-center">No color variants yet</p>
            )}

            <div className="space-y-6">
            {itemColors.map((ic) => {
                const assignedColor = allColors.find((c) => c.color_id === ic.color_id);
                return (
                <div key={ic.item_color_id} className="border rounded p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <div>
                        <div className="text-sm font-medium">Variant #{ic.item_color_id}</div>
                        <div className="text-xs text-muted">{assignedColor?.color_name ?? "Unassigned"}</div>
                        </div>

                        {/* Color selection */}
                        <select
                        className="border rounded px-2 py-1"
                        value={ic.color_id ?? ""}
                        onChange={(e) => handleChangeColorAssignment(ic.item_color_id, Number(e.target.value))}
                        >
                        <option value="">Select color</option>
                        {allColors.map((c) => (
                            <option key={c.color_id} value={c.color_id}>
                            {c.color_name} ({c.color_hex})
                            </option>
                        ))}
                        </select>

                        {/* color bubble */}
                        <div
                        className="w-8 h-8 rounded-full border ml-2"
                        style={{ background: assignedColor?.color_hex ?? "#ffffff" }}
                        title={assignedColor?.color_name ?? ""}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleUploadFilesForColor(ic.item_color_id, e.target.files)}
                            className="hidden"
                            id={`file-${ic.item_color_id}`}
                        />
                        <button
                            onClick={() => document.getElementById(`file-${ic.item_color_id}`)?.click()}
                            className="bg-primary text-white px-3 py-1 rounded"
                        >
                            Upload photos
                        </button>
                        </label>

                        <button
                        onClick={() => handleRemoveColorVariant(ic.item_color_id)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                        Remove variant
                        </button>
                    </div>
                    </div>

                    {/* Photos for this variant */}
                    <div className="mt-3 flex flex-wrap gap-3">
                    {photos.filter((p) => p.item_color_id === ic.item_color_id).map((p) => (
                        <div key={p.photo_id} className="relative">
                        <img src={p.photo_url} className="w-28 h-28 object-cover rounded" />
                        <button
                            onClick={() => handleDeletePhoto(p.photo_id)}
                            className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded"
                        >
                            ✕
                        </button>
                        </div>
                    ))}
                    </div>
                </div>
                );
            })}
            </div>

            {/* Add a new color variant from existing colors */}
            <div className="mt-6 border-t pt-4">
            <div className="flex gap-2 items-center">
                <select
                className="border rounded px-2 py-1 flex-1"
                value={selectedColorToAdd ?? ""}
                onChange={(e) => setSelectedColorToAdd(Number(e.target.value))}
                >
                <option value="">Pick a color to add</option>
                {allColors.map((c) => (
                    <option key={c.color_id} value={c.color_id}>
                    {c.color_name} ({c.color_hex})
                    </option>
                ))}
                </select>

                <button
                onClick={() => {
                    if (!selectedColorToAdd) return alert("Pick a color first");
                    handleAddExistingColorVariant(selectedColorToAdd);
                    setSelectedColorToAdd(null);
                }}
                className="bg-primary text-white px-3 py-1 rounded"
                >
                Add variant
                </button>
            </div>

            {/* Create new color then assign */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                className="border rounded px-2 py-1 col-span-2"
                placeholder="New color name"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                />
                <div className="flex items-center gap-2">
                <input
                    type="color"
                    className="w-10 h-10 p-0 border rounded"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                />
                <input
                    className="border rounded px-2 py-1"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                />
                </div>
            </div>

            <div className="mt-2">
                <button onClick={handleCreateAndAssignColor} className="bg-secondary text-white px-3 py-1 rounded">
                Create color + assign
                </button>
            </div>
            </div>
        </div>

        {/* Photos not tied to variants (optional) */}
        <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">All Photos</h2>
            <div className="flex flex-wrap gap-3">
            {photos.map((p) => (
                <div key={p.photo_id} className="relative">
                <img src={p.photo_url} className="w-28 h-28 object-cover rounded" />
                <button
                    onClick={() => handleDeletePhoto(p.photo_id)}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded"
                >
                    ✕
                </button>
                </div>
            ))}
            </div>
        </div>

        {/* Single save button */}
        <div className="mt-6 flex justify-center">
            <button onClick={handleSaveAll} className="bg-primary text-white px-6 py-2 rounded w-full md:w-1/3">
            Save Changes
            </button>
        </div>
        </div>
    </div>

    <Footer />
    </div>
);
};

export default AdminUpdateItem;
