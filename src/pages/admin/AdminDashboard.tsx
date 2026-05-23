import { Link } from "react-router-dom";
import {
  Package,
  PlusCircle,
  Edit3,
  Layers,
  BarChart2,
  ClipboardList,
  BookOpen,
} from "lucide-react";

const tiles = [
  {
    to: "/admin/add-item",
    icon: PlusCircle,
    label: "Add New Item",
    description: "Create a new product listing",
    color: "bg-primary text-primary-foreground",
  },
  {
    to: "/admin/AdminItemOverview",
    icon: Edit3,
    label: "Edit Items",
    description: "Update existing products",
    color: "bg-secondary text-secondary-foreground",
  },
  {
    to: "/admin/inventory",
    icon: Layers,
    label: "Inventory",
    description: "Manage stock quantities & view stats",
    color: "bg-emerald-600 text-white",
  },
  {
    to: "/admin/orders",
    icon: ClipboardList,
    label: "Orders",
    description: "View and manage customer orders",
    color: "bg-violet-600 text-white",
  },
  {
    to: "/admin/stats",
    icon: BarChart2,
    label: "Sales Statistics",
    description: "Revenue, items sold, order trends",
    color: "bg-amber-500 text-white",
  },
  {
    to: "/admin/material-care",
    icon: BookOpen,
    label: "Materials & Care",
    description: "Manage care guides for products",
    color: "bg-teal-600 text-white",
  },
];

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-10">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-primary">Admin Dashboard</h1>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {tiles.map(({ to, icon: Icon, label, description, color }) => (
            <Link
              key={to}
              to={to}
              className={`${color} rounded-xl p-6 flex items-start gap-4 hover:opacity-90 transition-opacity shadow-sm`}
            >
              <Icon className="h-6 w-6 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-lg leading-tight">{label}</p>
                <p className="text-sm opacity-80 mt-0.5">{description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
