import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Menu, UserRound, X, Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import { useCart } from "@/contexts/cartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const CartOverlay = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate("/cart");
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2 font-serif text-xl">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 opacity-30" />
            <p>Your cart is empty</p>
            <Button variant="outline" onClick={() => { onClose(); navigate("/jewelry"); }}>
              Browse Shop
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div key={`${item.itemId}-${item.selectedSize ?? ""}`} className="flex gap-3 items-start">
                  {item.photo && (
                    <img
                      src={item.photo}
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    {item.selectedSize && (
                      <p className="text-xs text-muted-foreground">Size: {item.selectedSize}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{item.price} NOK</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.itemId, item.quantity - 1, item.selectedSize)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.itemId, item.quantity + 1, item.selectedSize)}
                        disabled={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="text-sm font-medium">{item.price * item.quantity} NOK</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.itemId, item.selectedSize)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{totalPrice} NOK</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Go to Checkout
              </Button>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const isHomePage = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const { items } = useCart();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isActive = (path: string) => location.pathname === path;

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearchToggle = () => {
    if (isSearchOpen) {
      handleSearchClose();
    } else {
      setIsSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/jewelry?q=${encodeURIComponent(q)}`);
      handleSearchClose();
    }
  };

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSearchClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  useEffect(() => {
    handleSearchClose();
  }, [location.pathname]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || null);
      }
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      const user = session?.user;
      setUserName(user?.user_metadata?.full_name || user?.email || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollYRef.current;

      setScrolled(currentY > 80);

      if (currentY < 80) {
        setNavVisible(true);
      } else if (diff > 6) {
        setNavVisible(false);
      } else if (diff < -4) {
        setNavVisible(true);
      }

      lastScrollYRef.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isTransparent = isHomePage && !scrolled;

  return (
    <>
      <nav
        className={`${isHomePage ? "fixed w-full" : "sticky"} top-0 z-50 transition-all duration-300 border-border group/nav
          ${navVisible ? "translate-y-0" : "-translate-y-full"}
          ${isTransparent
            ? "bg-transparent hover:bg-black/30 backdrop-blur-none hover:backdrop-blur-sm"
            : "bg-neutral-200 border-b border-neutral-300"
          }
        `}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className={`text-2xl font-serif font-bold transition-colors ${isTransparent ? "text-white" : "text-primary"}`}
            >
              Little Loops
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { to: "/", label: "Home" },
                { to: "/jewelry", label: "Jewelry" },
                { to: "/knitting", label: "Patterns" },
                { to: "/about", label: "About" },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`transition-colors text-sm font-medium
                    ${isTransparent
                      ? `text-white/90 hover:text-white ${isActive(to) ? "border-b border-white/60" : ""}`
                      : `hover:text-primary ${isActive(to) ? "text-primary" : "text-muted-foreground"}`
                    }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-4 pt-2">
              {[
                {
                  icon: <Search className="h-5 w-5" />,
                  label: "Search",
                  onClick: handleSearchToggle,
                  active: isSearchOpen,
                },
                {
                  icon: (
                    <div className="relative">
                      <ShoppingBag className="h-5 w-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </div>
                  ),
                  label: "Cart",
                  onClick: () => setIsCartOpen(true),
                  active: false,
                },
                {
                  icon: <UserRound className="h-5 w-5" />,
                  label: userName || "Log In",
                  onClick: () => navigate(userName ? "/profile" : "/login"),
                  active: false,
                },
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="icon"
                  onClick={item.onClick}
                  className={`flex flex-col items-center space-y-0.5 hover:bg-transparent group ${item.active ? (isTransparent ? "text-white" : "text-primary") : ""}`}
                >
                  <span className={`transition-colors ${isTransparent ? "text-white/90 group-hover:text-white" : item.active ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                    {item.icon}
                  </span>
                  <span className={`text-xs text-center transition-colors ${isTransparent ? "text-white/70 group-hover:text-white" : item.active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                    {item.label}
                  </span>
                </Button>
              ))}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search bar */}
          {isSearchOpen && (
            <div className="border-t border-border">
              <form
                onSubmit={handleSearchSubmit}
                className="py-3 flex items-center gap-3"
              >
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for necklaces, bracelets..."
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-base px-0 h-auto py-0"
                />
                <button
                  type="button"
                  onClick={handleSearchClose}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col space-y-4">
                {[
                  { to: "/", label: "Home" },
                  { to: "/jewelry", label: "Jewelry" },
                  { to: "/knitting", label: "Patterns" },
                  { to: "/about", label: "About" },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`px-4 py-2 rounded transition-colors ${isActive(to) ? "bg-secondary text-primary" : "hover:bg-secondary"}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      <CartOverlay open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navigation;
