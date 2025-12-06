import SiteNavigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import "swiper/css";
import "swiper/css/navigation";
import { useNavigate } from "react-router-dom";
import { Item } from "../../interfaces/types";
import ProductCard from "@/components/ProductCard";
import { getStoreItems } from "@/services/store.service";

const AdminItemOverview = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getStoreItems();
        setItems(result);
        setFilteredItems(result);
      } catch (error) {
        console.error("Error fetching store items:", error);
      }
    };
    load();
  }, []);

  // Filter items whenever searchTerm or items change
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredItems(
      items.filter((item) => item.title.toLowerCase().includes(term))
    );
  }, [searchTerm, items]);

  const onItemPressed = (itemId: number) => {
    navigate(`/admin/AdminUpdateItem/${itemId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />

      {/* Search Field */}
      <section className="py-6 px-4">
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search by item title..."
            className="w-full border rounded px-3 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-2">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onItemPressed={onItemPressed}
              />
            ))}
            {filteredItems.length === 0 && (
              <p className="text-center col-span-full text-gray-500">
                No items match your search.
              </p>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AdminItemOverview;
