import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import backgroundImage from "@/assets/beads-background.jpg";
import natalieImage from "@/assets/nataliePhoto2.jpeg";
import beadImage from "@/assets/about-me-beads.jpg";
import { Sparkles, Heart, MapPin } from "lucide-react";

const VALUES = [
  {
    icon: Sparkles,
    title: "Handcrafted",
    description: "Every piece is made entirely by hand, with no shortcuts.",
  },
  {
    icon: Heart,
    title: "Passion-led",
    description: "What started as a hobby grew into a genuine love for creating wearable art.",
  },
  {
    icon: MapPin,
    title: "Norwegian Roots",
    description: "Made locally, shipped with care, inspired by the beauty around us.",
  },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-background/65" />
        </div>
        <div className="container mx-auto text-center relative z-10">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 font-medium">
            Our Story
          </p>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-5">
            About Little Loops
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A small jewellery brand born from a love of beads, colour, and making things by hand.
          </p>
        </div>
      </section>

      {/* Story section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <img
                src={beadImage}
                alt="Beaded jewellery close-up"
                className="w-full object-cover rounded-2xl shadow-md"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">
                How it started
              </p>
              <h2 className="text-3xl font-serif font-bold text-primary mb-5">
                A hobby that became a passion
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  I have always loved crafting, and I have been a knitter for many years. During
                  the summer, I came across a wholesale jewellery store and knew I had to create
                  something out of it. The beads I found were too beautiful to pass up on — and
                  that's how Little Loops began.
                </p>
                <p>
                  It quickly grew into a passion: making beaded jewellery that people can enjoy.
                  Right now, I'm excited to be sharing my work at local markets and turning this
                  website into a place where you can explore and order my creations online.
                </p>
                <p>
                  Thank you for being here at the very beginning of this journey!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3 p-6">
                <div className="w-12 h-12 rounded-full bg-gradient-warm flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-serif font-bold text-primary">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the maker */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div className="order-2 md:order-1">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">
                Meet the Maker
              </p>
              <h2 className="text-3xl font-serif font-bold text-primary mb-1">
                Natalie Winger
              </h2>
              <p className="text-muted-foreground text-sm mb-5">Founder & Creator</p>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  I have always loved creating with my hands, and beads quickly captured my
                  heart. What started as a hobby soon grew into Little Loops — a place where
                  I share my passion for crafting unique jewellery and decorative pieces.
                </p>
                <p>
                  I draw inspiration from colours, textures, and the little details that make
                  every design special. I love seeing how a simple bead can transform into
                  something beautiful, and enjoy sharing that joy with the crafting community.
                </p>
                <p>
                  At Little Loops, every piece reflects my creativity and my belief that crafting
                  is about connection, expression, and endless possibilities.
                </p>
              </div>
            </div>
            <div className="order-1 md:order-2 flex justify-center md:justify-end">
              <img
                src={natalieImage}
                alt="Natalie Winger, founder of Little Loops"
                className="w-72 md:w-80 object-cover rounded-2xl shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
