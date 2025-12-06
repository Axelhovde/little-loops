import { Link } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid gap-6 w-full max-w-md">
        <Link
          to="/admin/add-item"
          className="bg-primary text-primary-foreground py-4 px-6 rounded-lg text-center font-medium hover:bg-primary/90 transition"
        >
          Add New Item to Shop
        </Link>

        <Link
          to="/admin/AdminItemOverview"
          className="bg-secondary text-secondary-foreground py-4 px-6 rounded-lg text-center font-medium hover:bg-secondary/90 transition"
        >
          Edit Existing Item
        </Link>
        
        {/* Placeholder for future admin buttons */}
        <button
          className="bg-gray-300 text-gray-800 py-4 px-6 rounded-lg text-center font-medium cursor-not-allowed"
        >
          More Admin Actions...
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
