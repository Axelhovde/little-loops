import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrderStats } from "@/services/orders.service";
import { ArrowLeft, TrendingUp, ShoppingBag, Package, DollarSign } from "lucide-react";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  byStatus: Record<string, number>;
  itemsSold: number;
  revenueByMonth: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminStats = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderStats()
      .then(setStats)
      .catch((err) => {
        console.error(err);
        alert("Failed to load statistics.");
      })
      .finally(() => setLoading(false));
  }, []);

  const sortedMonths = stats
    ? Object.entries(stats.revenueByMonth).sort(([a], [b]) => b.localeCompare(a))
    : [];

  const maxMonthRevenue =
    sortedMonths.length > 0 ? Math.max(...sortedMonths.map(([, v]) => v)) : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8">Sales Statistics</h1>

        {loading ? (
          <p className="text-muted-foreground">Loading statistics...</p>
        ) : stats ? (
          <div className="space-y-8">
            {/* KPI cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: ShoppingBag,
                  label: "Total Orders",
                  value: stats.totalOrders,
                  color: "text-violet-600 bg-violet-50",
                },
                {
                  icon: DollarSign,
                  label: "Total Revenue",
                  value: `${stats.totalRevenue.toLocaleString("nb-NO")} NOK`,
                  color: "text-green-600 bg-green-50",
                },
                {
                  icon: Package,
                  label: "Items Sold",
                  value: stats.itemsSold,
                  color: "text-amber-600 bg-amber-50",
                },
                {
                  icon: TrendingUp,
                  label: "Avg. Order Value",
                  value:
                    stats.totalOrders > 0
                      ? `${Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString("nb-NO")} NOK`
                      : "—",
                  color: "text-blue-600 bg-blue-50",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white rounded-xl shadow p-5 flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-xl font-bold text-primary">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Orders by status */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold text-lg mb-4">Orders by Status</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold capitalize ${STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"}`}
                  >
                    <span>{status}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue by month */}
            {sortedMonths.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold text-lg mb-6">Revenue by Month</h2>
                <div className="space-y-3">
                  {sortedMonths.slice(0, 12).map(([month, revenue]) => {
                    const pct = maxMonthRevenue > 0 ? (revenue / maxMonthRevenue) * 100 : 0;
                    const [year, mo] = month.split("-");
                    const label = new Date(Number(year), Number(mo) - 1).toLocaleDateString(
                      "en-GB",
                      { month: "long", year: "numeric" }
                    );
                    return (
                      <div key={month}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">
                            {revenue.toLocaleString("nb-NO")} NOK
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sortedMonths.length === 0 && (
              <div className="bg-white rounded-xl shadow p-10 text-center text-muted-foreground">
                No sales data yet. Orders will appear here once customers start purchasing.
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">No data available.</p>
        )}
      </div>
    </div>
  );
};

export default AdminStats;
