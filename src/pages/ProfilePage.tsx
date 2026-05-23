import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  LogOut, Trash2, Package, ChevronDown, ChevronUp,
  LayoutDashboard, Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import { useNavigate } from "react-router-dom";
import { getUserOrders } from "@/services/orders.service";
import type { Order } from "@/interfaces/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const OrderCard = ({ order }: { order: Order }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5">
        <div>
          <h3 className="font-serif font-bold text-primary">
            Order #{String(order.order_id).padStart(5, "0")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {order.status}
          </span>
          <span className="font-semibold text-sm">{order.total_price} NOK</span>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle order details"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && order.order_items && order.order_items.length > 0 && (
        <div className="border-t border-border px-5 py-4 space-y-3 bg-muted/20">
          {order.order_items.map((oi) => (
            <div key={oi.order_item_id} className="flex items-center gap-3">
              {oi.item_photo && (
                <img
                  src={oi.item_photo}
                  alt={oi.item_name}
                  className="w-11 h-14 object-cover rounded-md shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{oi.item_name}</p>
                {oi.selected_size && (
                  <p className="text-xs text-muted-foreground">Size: {oi.selected_size}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {oi.quantity} × {oi.price_per_item} NOK
                </p>
              </div>
              <p className="font-medium text-sm shrink-0">
                {oi.quantity * oi.price_per_item} NOK
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.full_name || user.email || null);
      setEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.is_admin === true);

      try {
        const userOrders = await getUserOrders(user.id);
        setOrders(userOrders);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };
    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    alert("Account deletion requires a server-side action. Please contact support.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Profile header */}
      <section className="bg-gradient-warm border-b border-border py-12 px-4">
        <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-serif font-bold shrink-0 select-none">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary">{userName}</h1>
              <p className="text-muted-foreground text-sm mt-1">{email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 py-12 space-y-14">

        {/* Admin shortcut — always rendered for admins, impossible to miss */}
        {isAdmin && (
          <section>
            <div className="flex items-center justify-between p-5 rounded-xl border-2 border-primary bg-primary/5">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-primary text-sm">Admin Dashboard</p>
                  <p className="text-xs text-muted-foreground">Manage products, orders, and care guides</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/admin")}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
              >
                Go to Admin →
              </button>
            </div>
          </section>
        )}

        {/* Orders */}
        <section>
          <h2 className="text-2xl font-serif font-bold text-primary mb-6 flex items-center gap-2.5">
            <Package className="h-5 w-5" />
            My Orders
          </h2>

          {loadingOrders ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
              <button
                onClick={() => navigate("/store")}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.order_id} order={order} />
              ))}
            </div>
          )}
        </section>

        {/* Account Settings (hidden by default) */}
        <section className="border-t border-border pt-8">
          <button
            onClick={() => setSettingsOpen((p) => !p)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            Account Settings
            {settingsOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {settingsOpen && (
            <div className="mt-4 p-5 border border-border rounded-xl space-y-1">
              <h3 className="text-sm font-semibold text-destructive">Delete Account</h3>
              <p className="text-xs text-muted-foreground pb-3">
                Permanently deletes your account and all associated data. This cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 text-xs text-destructive border border-destructive/30 px-3 py-2 rounded-lg hover:bg-destructive/5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete my account
              </button>
            </div>
          )}
        </section>

      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;
