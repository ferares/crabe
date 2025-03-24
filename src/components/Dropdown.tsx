"use client"

import { type ComponentProps, type RefObject, useCallback, useEffect, useRef } from "react"

export interface DropdownProps extends Omit<ComponentProps<"div">, "className"> {
  open: boolean
  togglerRef: RefObject<HTMLElement | null>,
  onOpen?: () => void
  onClose?: () => void
}

export default function Dropdown({ children, open, onOpen, onClose, togglerRef, ...props }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!open) return
    const target = event.target as HTMLElement
    if (ref.current && !ref.current.contains(target) && togglerRef.current && (!togglerRef.current.contains(target))) onClose?.()
  }, [onClose, togglerRef, open])
  
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose, handleClickOutside])

  useEffect(() => {
    if (open) {
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onClose, onOpen, handleClickOutside])
  
  return (
    <div ref={ref} className={`dropdown-menu ${open ? "show" : ""}`} role="" aria-hidden={!open} {...props}>
      {children}
    </div>
  )
}