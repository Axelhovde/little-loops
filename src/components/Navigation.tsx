import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Search, Menu, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";



const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const isHomePage = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  
  
  const isActive = (path: string) => location.pathname === path;
 useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || null);
      }
    };
    getUser();
  }, []);
"test"
    
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100); // adjust threshold as needed
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <nav className={`sticky top-0 z-50 duration-700 border-border
    ${
      !isHomePage || scrolled
        ? "bg-background/95 border-b backdrop-blur"
        : "bg-transparent"
    }
    hover:bg-background/95
  `}>
      {/* Top banner */}
      {/* <div className="bg-light-blue text-primary-foreground py-2 text-center text-sm">
        Free shipping on orders over $75
      </div> */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-serif font-bold text-primary">
            Little Loops
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`transition-colors hover:text-primary ${isActive('/') ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              Home
            </Link>
            <Link 
              to="/store" 
              className={`transition-colors hover:text-primary ${isActive('/store') ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              Shop
            </Link>
            {/* <Link 
              to="/beads" 
              className={`transition-colors hover:text-primary ${isActive('/beads') ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              Beads
            </Link> */}
            <Link 
              to="/about" 
              className={`transition-colors hover:text-primary ${isActive('/about') ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              About
            </Link>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4 pt-2">
            {[{
              icon: <Search className="h-5 w-5" />,
              label: "Search",
              onClick: () => {}
            }, {
              icon: <ShoppingBag className="h-5 w-5" />,
              label: "Cart",
              onClick: () => {}
            }, 
            
            {
              icon: <UserRound className="h-5 w-5" />,
              label: userName || "Log In",
              onClick: () => navigate(userName ? "/profile" : "/login")
            }].map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                onClick={item.onClick}
                className="flex flex-col items-center space-y-0.5 hover:bg-transparent group"
              >
                {item.icon}
                <span className="text-xs text-muted-foreground group-hover:text-primary text-center transition-colors">
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

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded transition-colors ${isActive('/') ? 'bg-secondary text-primary' : 'hover:bg-secondary'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/store" 
                className={`px-4 py-2 rounded transition-colors ${isActive('/store') ? 'bg-secondary text-primary' : 'hover:bg-secondary'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Shop
              </Link>
{/*               <Link 
                to="/" 
                className={`px-4 py-2 rounded transition-colors ${isActive('/beads') ? 'bg-secondary text-primary' : 'hover:bg-secondary'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Beads
              </Link> */}
              <Link 
                to="/about" 
                className={`px-4 py-2 rounded transition-colors ${isActive('/about') ? 'bg-secondary text-primary' : 'hover:bg-secondary'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;