export const locales = ["es", "en"] as const
export type Locale = typeof locales[number]
export const defaultLocale: Locale = "en"
export const routeKeys = ["home", "tutorial", "game"] as const;
export type RouteKey = typeof routeKeys[number];
export const labels: Record<Locale, string> = { "es": "Español", "en": "English" }
export const paths: Record<Locale, Record<RouteKey, string>> = {
  es: {
    home: "",
    tutorial: "tutorial",
    game: "juego",
  },
  en: {
    home: "",
    tutorial: "tutorial",
    game: "game",
  },
};