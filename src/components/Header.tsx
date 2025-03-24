"use client"

import { Suspense } from "react"

import { useTranslations } from "next-intl"

import { Link } from "@/i18n/routing"

import { playersIcon } from "@/helpers/game"

import LangMenu from "./LangMenu"

export default function Header() {
  const t = useTranslations("Labels")
  return (
    <header className="main-header">
      <div className="content">
        <nav className="main-nav" role="navigation">
          <Link className="main-nav-home-link" href={{ pathname: "/" }} title={t("home")}>
            {playersIcon}
          </Link>
          <div className="right-options">
            <Suspense>
              <LangMenu />
            </Suspense>
          </div>
        </nav>
      </div>
    </header>
  )
}