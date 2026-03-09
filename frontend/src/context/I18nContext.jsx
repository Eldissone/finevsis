import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations.js';

const LOCALE_KEY = 'finevsis_locale';
const SUPPORTED_LOCALES = ['pt', 'en'];

const I18nContext = createContext(null);

function readStoredLocale() {
  const value = localStorage.getItem(LOCALE_KEY);
  return SUPPORTED_LOCALES.includes(value) ? value : 'pt';
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => readStoredLocale());

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(nextLocale) {
    if (!SUPPORTED_LOCALES.includes(nextLocale)) return;
    setLocaleState(nextLocale);
  }

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        messages: translations[locale],
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
