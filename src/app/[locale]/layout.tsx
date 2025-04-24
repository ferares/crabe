import "../../styles/app.css"

import type { Metadata } from "next"
import { Caveat, Fuzzy_Bubbles } from 'next/font/google'

import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"

import { type LocaleOption } from "@/i18n/routing"

import { AlertsProvider } from "@/context/Alerts"
import { LoaderProvider } from "@/context/Loader"

import Header from "@/components/Header"
import Footer from "@/components/Footer"

const caveat = Caveat({ subsets: ['latin'], display: 'swap', variable: "--font-caveat" })
const fuzzyBubbles = Fuzzy_Bubbles({ subsets: ['latin'], weight: ["400"], display: 'swap', variable: "--font-fuzzy-bubbles" })

export const metadata: Metadata = {
  title: "La Marche du Crabe",
  robots: { follow: false, index: false },
  authors: [{ name: "Ares Software", url: "https://ares.uy" }],
}

interface RootLayoutProps { params: Promise<{ locale: LocaleOption }>, children: React.ReactNode }

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = await getMessages()
  return (
    <html lang={locale} className={`${caveat.variable} ${fuzzyBubbles.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AlertsProvider>
            <LoaderProvider>
              <Header />
              {children}
              <Footer />
            </LoaderProvider>
          </AlertsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
