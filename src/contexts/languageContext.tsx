import { createContext, useContext, useState } from "react";
import translations, { type Lang, type Translations } from "@/i18n/translations";

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
};

const LanguageContext = createContext<LangCtx | null>(null);

const getInitialLang = (): Lang => {
  try {
    const stored = localStorage.getItem("lang");
    if (stored === "en" || stored === "no") return stored;
    // Default to Norwegian for Norwegian shop
    return "no";
  } catch {
    return "no";
  }
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = (l: Lang) => {
    try { localStorage.setItem("lang", l); } catch { /* ignore */ }
    setLangState(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
};
