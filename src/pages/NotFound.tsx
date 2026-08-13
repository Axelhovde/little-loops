import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLang } from "@/contexts/languageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLang();

  useEffect(() => {
    console.error("404 — user tried to access:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4 font-medium">
          {t.notFound.label}
        </p>
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-primary mb-6">
          {t.notFound.title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
          {t.notFound.body}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            {t.notFound.goHome}
          </Link>
          <Link
            to="/store"
            className="px-8 py-3 border border-primary text-primary rounded-xl font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {t.notFound.browseShop}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
