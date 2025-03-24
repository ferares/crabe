import { defineRouting, type Pathnames } from "next-intl/routing"
import { createNavigation } from "next-intl/navigation"

export type Locale = (typeof locales)[number]

export const locales = ["en", "es"] as const
export const defaultLocale: Locale = "en"

export type LocaleOption = typeof locales[number]

export const labels: Record<LocaleOption, string> = {"es": "Español", "en": "English" }

export type Href = Parameters<typeof getPathname>[0]["href"]

// All routes should be added here and then rewrites configured on next.config.mjs
export const pathnames = {
  "/": "/",
  "/[code]": {
    es: "/[code]",
    en: "/[code]",
  },
  "/tutorial": {
    es: "/tutorial",
    en: "/tutorial",
  },
} satisfies Pathnames<typeof locales>

export const routing = defineRouting({ locales, defaultLocale })
 
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)