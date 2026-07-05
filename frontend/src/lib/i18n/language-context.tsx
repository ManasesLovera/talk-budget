"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  LANGUAGE_STORAGE_KEY,
  translations,
  type Language,
} from "./translations";

type Translations = (typeof translations)["en"];

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "es";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) {
      setLanguageState(stored);
    } else if (navigator.language.toLowerCase().startsWith("es")) {
      setLanguageState("es");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t: translations[language] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
