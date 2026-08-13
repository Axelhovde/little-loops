import { Link } from "react-router-dom";
import { Heart, Instagram } from "lucide-react";
import { useState } from "react";
import { supabase } from "../helper/supabaseClient";
import { useLang } from "@/contexts/languageContext";

type MsgKey = "success" | "alreadySignedUp" | "invalidEmail" | "error" | "";

const Footer = () => {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [msgKey, setMsgKey] = useState<MsgKey>("");

  const isError = msgKey === "alreadySignedUp" || msgKey === "invalidEmail" || msgKey === "error";

  const msgText: Record<Exclude<MsgKey, "">, string> = {
    success: t.footer.newsletterSuccess,
    alreadySignedUp: t.footer.newsletterAlreadySignedUp,
    invalidEmail: t.footer.newsletterInvalidEmail,
    error: t.footer.newsletterError,
  };

  const handleNewsletterSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setMsgKey("invalidEmail");
      return;
    }
    try {
      const { error } = await supabase.from("newslettersignup").insert({ email });
      if (error) {
        setMsgKey(error.code === "23505" ? "alreadySignedUp" : "error");
      } else {
        setMsgKey("success");
        setEmail("");
      }
    } catch {
      setMsgKey("error");
    }
  };

  return (
    <footer className="bg-secondary/20 border-t border-border">
      <div className="container mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-serif font-bold text-primary mb-3">
              Natalie Winger
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              {t.footer.tagline}
            </p>
            <a
              href="https://www.instagram.com/shoplittleloopsstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-4 w-4" />
              @shoplittleloopsstudio
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-primary mb-4 text-sm uppercase tracking-wide">
              {t.footer.navigate}
            </h4>
            <nav className="space-y-2.5">
              {[
                { to: "/", label: t.footer.home },
                { to: "/store", label: t.footer.shop },
                { to: "/about", label: t.footer.about },
                { to: "/profile", label: t.footer.myAccount },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-primary mb-2 text-sm uppercase tracking-wide">
              {t.footer.stayInLoop}
            </h4>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              {t.footer.newsletterDesc}
            </p>
            <form onSubmit={handleNewsletterSignup} className="space-y-2">
              <input
                type="email"
                placeholder={t.footer.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {t.footer.subscribe}
              </button>
            </form>
            {msgKey && (
              <p className={`mt-2 text-xs ${isError ? "text-red-600" : "text-primary"}`}>
                {msgText[msgKey]}
              </p>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            {t.footer.madeWith} <Heart className="h-3.5 w-3.5 text-rose-400 fill-current" /> {t.footer.byLittleLoops}
          </p>
          <p>{t.footer.allRightsReserved(new Date().getFullYear())}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
