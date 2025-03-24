"use client"

import Image from "next/image"

import { useCallback, useRef, useState } from "react"

import { useLocale, useTranslations } from "next-intl"

import { labels, type LocaleOption, locales, redirect } from "@/i18n/routing"

import Dropdown from "./Dropdown"

export default function LangMenu() {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const locale = useLocale() as LocaleOption
  const t = useTranslations()

  const changeLocale = useCallback(async (localeOption: LocaleOption) => {
    redirect({ href: { pathname: "/" }, locale: localeOption })
    setOpen(false)
  }, [])

  return (
    <>
      <button ref={btnRef} id="button-lang" type="button" aria-controls="dropdown-lang" title={t("Labels.change-language")} className="language-button" aria-expanded={open} onClick={() => setOpen((open) => !open)}>
        <Image className="img-fluid" src={`/icons/language.svg`} alt="" height="20" width="20" />
      </button>
      <Dropdown id="dropdown-lang" open={open} onClose={() => setOpen(false)} togglerRef={btnRef}>
        <ul role="menu" aria-labelledby="button-lang">
          {locales.map((localeOption, index) => {
            if (localeOption === locale) return null
            return (
              <li role="menuitem" key={index}>
                <button type="button" onClick={() => changeLocale(localeOption)}>
                  <span lang={localeOption}>
                    {labels[localeOption]}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Dropdown>
    </>
  )
}