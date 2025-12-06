import { Link } from "react-router-dom";
import { Heart, Instagram, Facebook, Palette } from "lucide-react";
import React from "react";
import { supabase } from "../helper/supabaseClient";
import "../index.css";

const Footer = () => {
  
  const [email, setEmail] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [signupCount, setSignupCount] = React.useState(0);
  
    const handleNewsletterSignup = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
  
      // Simple email validation
      if (!email.includes("@") || !email.includes(".")) {
        setMessage("Please enter a valid email address.");
        return;
      }
  
      // Check max 3 per session
      if (signupCount >= 3) {
        setMessage("Something went wrong. Please try again.");
        return;
      }
  
      try {
        const { data, error } = await supabase
          .from("newslettersignup")
          .insert({ email });
  
        if (error) {
          if (error.code === "23505") { // unique violation
            setMessage("This email is already signed up.");
          } else {
            console.error(error);
            setMessage("Something went wrong. Please try again.");
          }
        } else {
          setSignupCount(signupCount + 1);
          setMessage("Thank you for signing up!");
          setEmail(""); // clear input
        }
      } catch (err) {
        console.error(err);
        setMessage("Something went wrong. Please try again.");
      }
    };

  return (
    <footer className="bg-secondary/30 border-t border-border ">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 md:gap-40 gap-8 ml-[5%] mr-[5%]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-2xl font-serif font-bold text-primary mb-4">
              Little Loops
            </h3>
            <p className="text-muted-foreground mb-6">
              Creating beautiful handmade pieces with love.
            </p>
            
            <h4 className="font-semibold text-primary mt-4">Customer Care</h4>
            <div className="flex flex-row space-x-2 mt-2">
              <a href="https://www.instagram.com/shoplittleloopsstudio?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors space-x-2">
                <span>Contact us through Instagram</span>
                <Instagram className="h-5 w-5" />
              </a>
              {/* <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Shipping Info
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Returns
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Size Guide
              </a> */}
            </div>
            
          </div>

          {/* Quick Links */}

          {/* <div>
            <h4 className="font-semibold text-primary mb-4">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/store" className="block text-muted-foreground hover:text-primary transition-colors">
                Shop
              </Link>
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
            </div>
          </div> */}

          {/* Customer Care */}
 {/*          <div className="justify-self-center">
            <h4 className="font-semibold text-primary mb-4">Customer Care</h4>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Shipping Info
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Returns
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Size Guide
              </a>
            </div>
          </div> */}

          {/* Newsletter */}
          <div className="md:col-span-1">
            <h4 className="font-semibold text-primary mb-4">Stay Connected</h4>
            <p className="text-muted-foreground mb-4 text-sm">
              Get the latest information from our newsletter delivered to your inbox.
            </p>
            <form className="space-y-2" onSubmit={handleNewsletterSignup}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
            {message && (
              <p
                className={`mt-2 ${
                  (message === "Something went wrong. Please try again." || message === "Please enter a valid email address." || message === "This email is already signed up.")
                    ? "text-red-600"
                    : "var(--accent)"
                }`}
              >
                {message}
              </p>  
            )}
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            Made with <Heart className="h-4 w-4 text-dusty-rose fill-current" /> by Little Loops
          
          <div className="flex space-x-4 ml-2 ">
              <a href="https://www.instagram.com/shoplittleloopsstudio?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;