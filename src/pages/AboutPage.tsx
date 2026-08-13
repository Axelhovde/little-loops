import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import backgroundImage from "@/assets/beads-background.jpg";
import natalieImage from "@/assets/nataliePhoto2.jpeg";
import beadImage from "@/assets/about-me-beads.jpg";
import { Sparkles, Heart, MapPin } from "lucide-react";
import { useLang } from "@/contexts/languageContext";

const AboutPage = () => {
  const { t } = useLang();

  const values = [
    { icon: Sparkles, ...t.about.values.handcrafted },
    { icon: Heart, ...t.about.values.passion },
    { icon: MapPin, ...t.about.values.norwegian },
  ];

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
            {t.about.heroLabel}
          </p>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-5">
            {t.about.heroTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t.about.heroSubtitle}
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
                {t.about.howItStarted}
              </p>
              <h2 className="text-3xl font-serif font-bold text-primary mb-5">
                {t.about.storyTitle}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>{t.about.storyP1}</p>
                <p>{t.about.storyP2}</p>
                <p>{t.about.storyP3}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8">
            {values.map(({ icon: Icon, title, description }) => (
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
                {t.about.meetTheMaker}
              </p>
              <h2 className="text-3xl font-serif font-bold text-primary mb-1">
                Natalie Winger
              </h2>
              <p className="text-muted-foreground text-sm mb-5">{t.about.founderTitle}</p>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>{t.about.makerP1}</p>
                <p>{t.about.makerP2}</p>
                <p>{t.about.makerP3}</p>
              </div>
            </div>
            <div className="order-1 md:order-2 flex justify-center md:justify-end">
              <img
                src={natalieImage}
                alt="Natalie Winger, founder"
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
