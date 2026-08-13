import heroImage from "@/assets/beads-background.jpg";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-white/70 mb-6 font-medium">
          Handcrafted in Norway
        </p>

        <h1 className="text-6xl md:text-8xl font-serif font-bold text-white mb-6 leading-none">
          Natalie Winger
        </h1>

        <p className="text-lg md:text-xl text-white/80 mb-12 max-w-md mx-auto leading-relaxed font-light">
          Handcrafted beaded necklaces made with love, one bead at a time.
        </p>

        <Link
          to="/store"
          className="text-white text-base font-medium border-b border-white/60 hover:border-white pb-0.5 transition-colors tracking-wide"
        >
          Shop the Collection
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <ChevronDown className="h-6 w-6 text-white/50" />
      </div>
    </section>
  );
};

export default Hero;
