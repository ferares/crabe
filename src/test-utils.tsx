import { NextIntlClientProvider } from "next-intl"

import { vi } from "vitest"

import { configureAxe } from "vitest-axe"

import { defaultLocale, type LocaleOption } from "./i18n/routing"

import defaultMessages from '../langs/es.json'

export const axe = configureAxe()

export function nextIntlWrapper(locale: LocaleOption = defaultLocale, messages = defaultMessages) {
  const nextIntlWrapperComponent = ({ children }: { children: React.ReactNode }) => {
    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    )
  }
  return nextIntlWrapperComponent
}

export function mockDialog() {
  HTMLDialogElement.prototype.show = vi.fn()
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
}