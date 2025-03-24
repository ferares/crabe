"use client"

import { useTranslations } from "next-intl"

export default function Footer() {
  const t = useTranslations("Labels")
  return (
    <footer className="footer">
      <div className="content">
        <span className="footer__text">
          {t("developed-by")}&nbsp;
          <br className="footer__mobile-break" />
          <a className="footer__link" href="https://github.com/ferares" target="_blank" rel="noreferrer noopener nofollow">Fermín Ares</a>
          <br />
          La Paloma, Rocha, Uruguay
        </span>
        <span className="footer__text">
          {t("open-source")}&nbsp;
          <a className="footer__link" href="https://github.com/ferares/marche-du-crabe" target="_blank" rel="noopener nofollow noreferrer">
            GitHub
          </a>
        </span>
      </div>
    </footer>
  )
}