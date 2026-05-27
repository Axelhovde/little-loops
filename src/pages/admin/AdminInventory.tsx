import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../helper/supabaseClient";
import { ArrowLeft, Save, ChevronDown, ChevronUp } from "lucide-react";
import { updateSizeQuantities } from "@/services/items.service";
import { formatSize } from "@/lib/sizeUtils";

interface SizeQty { size: string; quantity: number; }

interface InventoryItem {
  item_id: number;
  item_name: string;
  item_type: string;
  price: number;
  quantity: number;
  sizes: string[];
  sizeQty: SizeQty[];
}

const AdminInventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [edited, setEdited] = useState<Record<number, number>>({});
  const [editedSizes, setEditedSizes] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const load = async () => {
      const { data: itemsData, error } = await supabase
        .from("items")
        .select("item_id, item_name, item_type, price, quantity, sizes")
        .order("item_name");

      if (error) { console.error(error); setLoading(false); return; }

      const itemIds = (itemsData ?? []).map((i: any) => i.item_id);
      const { data: sizeQtyData } = itemIds.length
        ? await supabase.from("item_size_quantities").select("item_id, size, quantity").in("item_id", itemIds)
        : { data: [] };

      const sizeMap: Record<number, SizeQty[]> = {};
      (sizeQtyData ?? []).forEach((sq: any) => {
        if (!sizeMap[sq.item_id]) sizeMap[sq.item_id] = [];
        sizeMap[sq.item_id].push({ size: sq.size, quantity: sq.quantity });
      });

      setItems(
        (itemsData ?? []).map((i: any) => ({
          ...i,
          sizes: i.sizes ?? [],
          sizeQty: sizeMap[i.item_id] ?? [],
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

  const getQty = (item: InventoryItem) =>
    edited[item.item_id] !== undefined ? edited[item.item_id] : item.quantity;

  const getSizeQty = (item: InventoryItem, size: string) => {
    const key = `${item.item_id}:${size}`;
    if (editedSizes[key] !== undefined) return editedSizes[key];
    return item.sizeQty.find(s => s.size === size)?.quantity ?? 0;
  };

  const handleQtyChange = (itemId: number, value: number) => {
    setEdited(prev => ({ ...prev, [itemId]: Math.max(0, value) }));
  };

  const handleSizeQtyChange = (itemId: number, size: string, value: number) => {
    setEditedSizes(prev => ({ ...prev, [`${itemId}:${size}`]: Math.max(0, value) }));
  };

  const isDirty = (item: InventoryItem) => {
    if (edited[item.item_id] !== undefined) return true;
    return item.sizes.some(s => editedSizes[`${item.item_id}:${s}`] !== undefined);
  };

  const handleSave = async (item: InventoryItem) => {
    setSaving(item.item_id);
    try {
      const hasSizes = item.sizes.length > 0;
      if (hasSizes) {
        const newSizeQty: Record<string, number> = {};
        item.sizes.forEach(size => {
          newSizeQty[size] = getSizeQty(item, size);
        });
        await updateSizeQuantities(item.item_id, newSizeQty);
        const total = Object.values(newSizeQty).reduce((s, q) => s + q, 0);
        setItems(prev => prev.map(i =>
          i.item_id === item.item_id
            ? { ...i, quantity: total, sizeQty: item.sizes.map(s => ({ size: s, quantity: newSizeQty[s] })) }
            : i
        ));
      } else {
        const newQty = edited[item.item_id];
        if (newQty !== undefined) {
          const { error } = await supabase.from("items").update({ quantity: newQty }).eq("item_id", item.item_id);
          if (error) throw error;
          setItems(prev => prev.map(i => i.item_id === item.item_id ? { ...i, quantity: newQty } : i));
        }
      }
      setEdited(prev => { const n = { ...prev }; delete n[item.item_id]; return n; });
      setEditedSizes(prev => {
        const n = { ...prev };
        item.sizes.forEach(s => delete n[`${item.item_id}:${s}`]);
        return n;
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    } finally {
      setSaving(null);
    }
  };

  const totalItems = items.length;
  const totalStock = items.reduce((s, i) => s + getQty(i), 0);
  const totalValue = items.reduce((s, i) => s + getQty(i) * i.price, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8">Inventory Management</h1>

        {loading ? (
          <p className="text-muted-foreground">Loading inventory...</p>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow overflow-hidden mb-10">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Item</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Type</th>
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Price</th>
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Qty / Sizes</th>
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Value</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => {
                    const qty = getQty(item);
                    const hasSizes = item.sizes.length > 0;
                    const isExpanded = expanded[item.item_id] ?? false;
                    const dirty = isDirty(item);

                    return (
                      <>
                        <tr key={item.item_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              {item.item_name}
                              {hasSizes && (
                                <button
                                  onClick={() => setExpanded(prev => ({ ...prev, [item.item_id]: !prev[item.item_id] }))}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground capitalize">{item.item_type}</td>
                          <td className="px-5 py-3 text-right">{item.price} NOK</td>
                          <td className="px-5 py-3 text-right">
                            {hasSizes ? (
                              <span className="text-muted-foreground text-xs">{qty} total — click ▼</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={(e) => handleQtyChange(item.item_id, Number(e.target.value))}
                                className="w-20 border rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            )}
                          </td>
                          <td className="px-5 py-3 text-right text-muted-foreground">
                            {(qty * item.price).toLocaleString("nb-NO")} NOK
                          </td>
                          <td className="px-5 py-3 text-right">
                            {dirty && (
                              <button
                                onClick={() => handleSave(item)}
                                disabled={saving === item.item_id}
                                className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs hover:bg-primary/90 transition disabled:opacity-60 ml-auto"
                              >
                                <Save className="h-3 w-3" />
                                {saving === item.item_id ? "Saving..." : "Save"}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Per-size rows */}
                        {hasSizes && isExpanded && item.sizes.map(size => (
                          <tr key={`${item.item_id}-${size}`} className="bg-gray-50/60">
                            <td className="pl-10 pr-5 py-2 text-sm text-muted-foreground" colSpan={2}>
                              {formatSize(size)}
                            </td>
                            <td />
                            <td className="px-5 py-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={getSizeQty(item, size)}
                                onChange={(e) => handleSizeQtyChange(item.item_id, size, Number(e.target.value))}
                                className="w-20 border rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </td>
                            <td className="px-5 py-2 text-right text-muted-foreground text-xs">
                              {(getSizeQty(item, size) * item.price).toLocaleString("nb-NO")} NOK
                            </td>
                            <td />
                          </tr>
                        ))}
                      </>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                        No items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Statistics */}
            <div>
              <h2 className="text-xl font-bold mb-4">Inventory Statistics</h2>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Total Products", value: totalItems },
                  { label: "Total Units in Stock", value: totalStock },
                  { label: "Total Inventory Value", value: `${totalValue.toLocaleString("nb-NO")} NOK` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl shadow p-5 text-center">
                    <p className="text-sm text-muted-foreground mb-1">{label}</p>
                    <p className="text-2xl font-bold text-primary">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;
