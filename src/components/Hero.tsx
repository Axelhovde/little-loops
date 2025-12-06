import { Button } from "@/components/ui/button";
import heroImage from "@/assets/beads-background.jpg";
import React from "react";
import { supabase } from "../helper/supabaseClient";

const Hero = () => {
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
      setMessage("You have reached the maximum of 3 signups per session.");
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
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-background/70" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary mb-6">
          Little Loops
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Handcrafted beaded necklaces.
        </p>
        <p className="text-xl md:text-lg text-muted-foreground mb-8 max-w-full md:max-w-2xl mx-auto">
          This website is currently under construction. In the meantime, please join our newsletter to be notified when we launch!
        </p>

        <form className="flex flex-col md:flex-row justify-center w-full items-center gap-4" onSubmit={handleNewsletterSignup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 md:w-[400px] w-[80%] rounded-lg border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="ml-4 border-primary rounded-2xl text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg"
          >
            Join newsletter
          </Button>
        </form>

        <p className={`mt-4 ${(message === "Something went wrong. Please try again." || message === "Please enter a valid email address." || message === "This email is already signed up.") ? "text-red-600" : "var(--accent)"}`}>
    {message}
  </p>
      </div>
    </section>
  );
};

export default Hero;
