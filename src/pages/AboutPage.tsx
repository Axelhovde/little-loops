import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Scissors, Palette } from "lucide-react";
import backgroundImage from "@/assets/beads-background.jpg";
import natalieImage from "@/assets/nataliePhoto2.jpeg";
import beadImage from "@/assets/about-me-beads.jpg";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          {/* 70% overlay (same as Hero) */}
          <div className="absolute inset-0 bg-background/70" />
        </div>

        {/* Content */}
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-6">
            About Little Loops
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crafting beautiful handmade pieces with love.
          </p>
        </div>
      </section>

      {/* Story Section */}
<section className="pt-20 px-4 flex flex-col md:flex-row items-start gap-12 md:gap-20">
  <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-start gap-12 md:gap-20 px-4">

    {/* Image Column */}
    <div className="md:w-1/2 flex justify-start md:justify-start pl-8">
      <img
        src={beadImage}
        alt="Beaded Jewelry"
        className="w-full max-w-md md:max-w-full object-cover rounded"
      />
    </div>

    {/* Text Column */}
    <div className="md:w-1/2 flex flex-col items-start text-left">
      <h2 className="text-4xl font-serif font-bold text-primary mb-6">
        About
      </h2>
      <div className="prose prose-lg text-muted-foreground">
        <p className="mb-6">
          I have always loved crafting, and I have been a knitter for many years. During the summer, I came across a wholesale jewelry store and knew I had to create something out of it. The beads I found were too beautiful to pass up on. This is how my little hobby came to be. It quickly grew into a passion: making beaded jewelry that people can enjoy. The website is going to be a place for me to share and sell my beaded creations, and might also evolve into a place for me to sell my knitting patterns in the future.
        </p>
        <p className="mb-6">
          Right now, I’m excited to be sharing my work at local markets and I’m working on turning this website into a place where you can explore and order my creations online.
        </p>
        <p className="mb-10">
          Thank you for being here at the very beginning of this journey! If you want to stay updated on when the website launches, please consider joining my newsletter.
        </p>
      </div>
    </div>
  </div>
</section>


      {/*  */}

      {/* Team Section */}
    <section className="md:py-20  flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-20">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-20 px-4">

        {/* Text Column */}
        <div className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-xl  font-serif text-muted-foreground mb-2 px-8">
            Meet the Maker
          </h2>
          <p className="text-2xl font-serif font-bold text-primary mb-4 px-8">
            Natalie Winger
          </p>
          <div className=" rounded-lg px-8 mt-4 w-full">
            <p className="text-muted-foreground mb-6">
              Founder & Creator
            </p>
            <p className="text-muted-foreground mb-6">
              I have always loved creating with my hands, and beads quickly captured my heart. What started as a hobby soon grew into Little Loops, a place where I share my passion for crafting unique jewelry and decorative pieces. I draw inspiration from colors, textures, and the little details that make every design special.
            </p>
            <p className="text-muted-foreground">
              I love seeing how a simple bead can transform into something beautiful and enjoy sharing that joy with the crafting community. At Little Loops, every piece reflects my creativity and my belief that crafting is about connection, expression, and endless possibilities.
            </p>
          </div>
        </div>

        {/* Image Column */}
        <div className="md:w-1/2 flex justify-center md:justify-end md:mr-[8%] pb-8">
          <img
            src={natalieImage}
            alt="Natalie Winger"
            className=" w-80 md:w-96 object-cover"
          />
        </div>
      </div>
    </section>

      <Footer />
    </div>
  );
};

export default AboutPage;