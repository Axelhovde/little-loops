import SiteNavigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "../helper/supabaseClient";
import { useEffect, useState } from "react";
import "swiper/css";
import "swiper/css/navigation";
import { useNavigate } from "react-router-dom";
import { Item } from "../interfaces/types";
import ProductCard from "@/components/ProductCard";
import { getStoreItems } from "@/services/store.service";



const StorePage = () => {
  const [items, setItems] = useState<Item[]>([]); 
  const navigate = useNavigate();

  useEffect(() => {
  const load = async () => {
    try {
      const result = await getStoreItems();
      setItems(result);
    } catch (error) {
      console.error("Error fetching store items:", error);

      }
    };
    load();
  }, []);
  const onItemPressed = (itemId: number) => {
    navigate(`/item/${itemId}`);
  };

return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-warm">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-6">
            Shop Our Collection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our handpicked collection of high-quality products
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-2">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {items
              .filter((item) => item.ishidden !== true)
              .map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onItemPressed={onItemPressed}
                />
              ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StorePage;