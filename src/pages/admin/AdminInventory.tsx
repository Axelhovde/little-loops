import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../helper/supabaseClient";
import { ArrowLeft, Save } from "lucide-react";

interface InventoryItem {
  item_id: number;
  item_name: string;
  item_type: string;
  price: number;
  quantity: number;
}

const AdminInventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [edited, setEdited] = useState<Record<number, number>>({});

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("item_id, item_name, item_type, price, quantity")
        .order("item_name");
      if (error) {
        console.error(error);
      } else {
        setItems(data ?? []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const getQty = (item: InventoryItem) =>
    edited[item.item_id] !== undefined ? edited[item.item_id] : item.quantity;

  const handleQtyChange = (itemId: number, value: number) => {
    setEdited((prev) => ({ ...prev, [itemId]: Math.max(0, value) }));
  };

  const handleSave = async (itemId: number) => {
    const newQty = edited[itemId];
    if (newQty === undefined) return;
    setSaving(itemId);
    try {
      const { error } = await supabase
        .from("items")
        .update({ quantity: newQty })
        .eq("item_id", itemId);
      if (error) throw error;
      setItems((prev) =>
        prev.map((i) => (i.item_id === itemId ? { ...i, quantity: newQty } : i))
      );
      setEdited((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save quantity.");
    } finally {
      setSaving(null);
    }
  };

  // Stats
  const totalItems = items.length;
  const totalStock = items.reduce((s, i) => s + getQty(i), 0);
  const totalValue = items.reduce((s, i) => s + getQty(i) * i.price, 0);

  const byType = items.reduce<Record<string, { count: number; stock: number; value: number }>>(
    (acc, item) => {
      const t = item.item_type || "other";
      if (!acc[t]) acc[t] = { count: 0, stock: 0, value: 0 };
      acc[t].count++;
      acc[t].stock += getQty(item);
      acc[t].value += getQty(item) * item.price;
      return acc;
    },
    {}
  );

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
            {/* Inventory table */}
            <div className="bg-white rounded-xl shadow overflow-hidden mb-10">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Item</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Type</th>
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Price</th>
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">
                      Quantity
                    </th>
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">
                      Value
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => {
                    const qty = getQty(item);
                    const isDirty = edited[item.item_id] !== undefined;
                    return (
                      <tr key={item.item_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium">{item.item_name}</td>
                        <td className="px-5 py-3 text-muted-foreground capitalize">
                          {item.item_type}
                        </td>
                        <td className="px-5 py-3 text-right">{item.price} NOK</td>
                        <td className="px-5 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) =>
                              handleQtyChange(item.item_id, Number(e.target.value))
                            }
                            className="w-20 border rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </td>
                        <td className="px-5 py-3 text-right text-muted-foreground">
                          {(qty * item.price).toLocaleString("nb-NO")} NOK
                        </td>
                        <td className="px-5 py-3 text-right">
                          {isDirty && (
                            <button
                              onClick={() => handleSave(item.item_id)}
                              disabled={saving === item.item_id}
                              className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs hover:bg-primary/90 transition disabled:opacity-60 ml-auto"
                            >
                              <Save className="h-3 w-3" />
                              {saving === item.item_id ? "Saving..." : "Save"}
                            </button>
                          )}
                        </td>
                      </tr>
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

              {/* Overall stats */}
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Total Products", value: totalItems },
                  { label: "Total Units in Stock", value: totalStock },
                  {
                    label: "Total Inventory Value",
                    value: `${totalValue.toLocaleString("nb-NO")} NOK`,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-white rounded-xl shadow p-5 text-center"
                  >
                    <p className="text-sm text-muted-foreground mb-1">{label}</p>
                    <p className="text-2xl font-bold text-primary">{value}</p>
                  </div>
                ))}
              </div>

              {/* By type */}
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-muted-foreground">
                        Type
                      </th>
                      <th className="text-right px-5 py-3 font-semibold text-muted-foreground">
                        Products
                      </th>
                      <th className="text-right px-5 py-3 font-semibold text-muted-foreground">
                        Units in Stock
                      </th>
                      <th className="text-right px-5 py-3 font-semibold text-muted-foreground">
                        Total Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(byType).map(([type, stats]) => (
                      <tr key={type} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium capitalize">{type}</td>
                        <td className="px-5 py-3 text-right">{stats.count}</td>
                        <td className="px-5 py-3 text-right">{stats.stock}</td>
                        <td className="px-5 py-3 text-right">
                          {stats.value.toLocaleString("nb-NO")} NOK
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;
