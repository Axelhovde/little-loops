import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllOrders, updateOrderStatus } from "@/services/orders.service";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import type { Order } from "@/interfaces/types";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const OrderRow = ({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: number, status: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await updateOrderStatus(Number(order.order_id), newStatus);
      onStatusChange(order.order_id, newStatus);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
          #{String(order.order_id).padStart(5, "0")}
        </td>
        <td className="px-5 py-3 text-sm">{order.user_email || "—"}</td>
        <td className="px-5 py-3 text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </td>
        <td className="px-5 py-3 text-right font-medium">{order.total_price} NOK</td>
        <td className="px-5 py-3">
          <select
            value={order.status}
            disabled={updating}
            onChange={(e) => handleStatus(e.target.value)}
            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer capitalize focus:outline-none focus:ring-2 focus:ring-primary/30 ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-white text-foreground capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </td>
        <td className="px-5 py-3">
          {order.order_items && order.order_items.length > 0 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </td>
      </tr>

      {expanded && order.order_items && order.order_items.length > 0 && (
        <tr>
          <td colSpan={6} className="px-5 pb-4 bg-gray-50">
            <div className="space-y-2 pt-2">
              {order.order_items.map((oi) => (
                <div key={oi.order_item_id} className="flex items-center gap-3 text-sm">
                  {oi.item_photo && (
                    <img
                      src={oi.item_photo}
                      alt={oi.item_name}
                      className="w-10 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <span className="font-medium">{oi.item_name}</span>
                    {oi.selected_size && (
                      <span className="text-muted-foreground ml-2">({oi.selected_size})</span>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {oi.quantity} × {oi.price_per_item} NOK
                  </span>
                  <span className="font-medium">
                    {oi.quantity * oi.price_per_item} NOK
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    getAllOrders()
      .then(setOrders)
      .catch((err) => {
        console.error(err);
        alert("Failed to load orders.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = (orderId: number, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.order_id === orderId ? { ...o, status: newStatus as Order["status"] } : o
      )
    );
  };

  const filtered =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  const counts = STATUS_OPTIONS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm">
            {orders.length} total orders
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filterStatus === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-white border hover:bg-gray-50"
            }`}
          >
            All ({orders.length})
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-white border hover:bg-gray-50"
              }`}
            >
              {s} ({counts[s] ?? 0})
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading orders...</p>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Order</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Customer</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Date</th>
                  <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Total</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((order) => (
                  <OrderRow
                    key={order.order_id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
