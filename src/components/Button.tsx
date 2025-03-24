import { type PropsWithChildren } from "react"

import { type Href, Link } from "@/i18n/routing"

interface ButtonProps { onClick?: () => void, href?: Href }

export default function Button({ children, href, onClick }: PropsWithChildren<ButtonProps>) {
  if (href) return (
    <Link href={href} className="btn">
      {children}
    </Link>
  )
  return (
    <button type="button" className="btn" onClick={onClick}>
      {children}
    </button>
  )
}