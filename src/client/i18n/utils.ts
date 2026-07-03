import { getRelativeLocaleUrl } from "astro:i18n";

import { defaultLocale, paths, locales, type Locale, type RouteKey } from "./config";

import es from './es.json';
import en from './en.json';

const translations: Record<Locale, typeof es> = { en, es };

type DotNotationKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown> ? DotNotationKeys<T[K], `${Prefix}${K}.`> : `${Prefix}${K}`;
}[keyof T & string];

export type TranslationKey = DotNotationKeys<typeof es>;

export function useTranslations(locale: Locale = defaultLocale) {
  return function t(key: TranslationKey): string {
    const resolve = (obj: Record<string, unknown>, parts: string[]): string => {
      const [head, ...rest] = parts;
      const value = obj[head];
      if (rest.length === 0) return (value as string) ?? key;
      if (value && typeof value === "object") {
        return resolve(value as Record<string, unknown>, rest);
      }
      return key;
    };
    const parts = key.split(".");
    return (
      resolve(translations[locale] as Record<string, unknown>, parts) ??
      resolve(translations[defaultLocale] as Record<string, unknown>, parts) ??
      key
    );
  };
}

export function getLocalizedPath(route: RouteKey, locale: string = defaultLocale) {
  const localizedPath = paths[locale as Locale]?.[route];
  return getRelativeLocaleUrl(locale, localizedPath);
}

export function getRouteKeyFromPath(pathname: string): RouteKey {
  const clean = pathname.replace(/^\/(en|es)(\/|$)/, "").replace(/^\/|\/$/g, "");
  if (!clean) return "home";
  for (const locale of locales) {
    for (const [routeKey, localizedPath] of Object.entries(paths[locale])) {
      if (localizedPath === clean) {
        return routeKey as RouteKey;
      }
    }
  }
  return "home";
}