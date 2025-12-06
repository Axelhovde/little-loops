import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Filter } from "lucide-react";

const beadProducts = [
  {
    id: 1,
    name: "Sage Green Glass Beads",
    type: "Glass",
    size: "6mm",
    quantity: "50 pieces",
    price: "$12.99",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop",
    description: "Beautiful translucent glass beads in calming sage green."
  },
  {
    id: 2,
    name: "Dusty Rose Ceramic Rounds",
    type: "Ceramic",
    size: "8mm",
    quantity: "40 pieces",
    price: "$15.99",
    image: "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=400&h=300&fit=crop",
    description: "Handcrafted ceramic beads with a matte finish."
  },
  {
    id: 3,
    name: "Natural Wood Mix",
    type: "Wood",
    size: "Mixed",
    quantity: "60 pieces",
    price: "$8.99",
    image: "https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=400&h=300&fit=crop",
    description: "Assorted natural wood beads in warm tones."
  },
  {
    id: 4,
    name: "Terracotta Stone Chips",
    type: "Stone",
    size: "4-7mm",
    quantity: "100 pieces",
    price: "$18.99",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop",
    description: "Irregular stone chips in rich terracotta hues."
  },
  {
    id: 5,
    name: "Pearl Cream Rounds",
    type: "Pearl",
    size: "10mm",
    quantity: "25 pieces",
    price: "$22.99",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop",
    description: "Lustrous cultured pearls in cream white."
  },
  {
    id: 6,
    name: "Vintage Brass Accents",
    type: "Metal",
    size: "5mm",
    quantity: "80 pieces",
    price: "$14.99",
    image: "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=400&h=300&fit=crop",
    description: "Antique brass spacer beads and charms."
  }
];

const BeadsPage = () => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "Glass":
        return "bg-light-blue text-primary-foreground";
      case "Ceramic":
        return "bg-dusty-rose text-primary-foreground";
      case "Wood":
        return "bg-soft-brown text-primary-foreground";
      case "Stone":
        return "bg-terracotta text-primary-foreground";
      case "Pearl":
        return "bg-secondary text-secondary-foreground";
      case "Metal":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-warm">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-6">
            Premium Beads
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            High-quality beads in beautiful colors and textures for all your crafting needs
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 px-4 border-b border-border">
        <div className="container mx-auto">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" className="border-primary text-primary">
              <Filter className="h-4 w-4 mr-2" />
              All Types
            </Button>
            <Button variant="ghost">Glass</Button>
            <Button variant="ghost">Ceramic</Button>
            <Button variant="ghost">Wood</Button>
            <Button variant="ghost">Stone</Button>
            <Button variant="ghost">Pearl</Button>
            <Button variant="ghost">Metal</Button>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {beadProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden shadow-soft hover:shadow-warm transition-all duration-300">
                <div className="relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-4 right-4 bg-background/80 hover:bg-background"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Badge className={`absolute top-4 left-4 ${getTypeColor(product.type)}`}>
                    {product.type}
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-xl font-serif font-bold text-primary mb-2">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {product.description}
                  </p>
                  
                  <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{product.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{product.quantity}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-primary">{product.price}</span>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-serif font-bold text-primary mb-4">
            Need Custom Colors?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Can't find the perfect shade? Contact us for custom bead orders and bulk pricing.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            Contact Us
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BeadsPage;