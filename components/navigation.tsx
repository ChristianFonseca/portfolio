"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Home, User, Briefcase, Code, Mail, Languages, BookOpen } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries"

export function Navigation({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Los links de página (ej. /blog) navegan normal; solo los anchors hacen smooth scroll
    if (!href.startsWith("#")) {
      setIsOpen(false)
      return
    }
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      const navbarHeight = 96
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 12
      window.scrollTo({ top: targetPosition, behavior: "smooth" })
    }
    setIsOpen(false)
  }

  const navItems = [
    { icon: Home, label: dict.nav.home, href: "#home" },
    { icon: User, label: dict.nav.profile, href: "#profile" },
    { icon: Code, label: dict.nav.projects, href: "#public-projects" },
    { icon: Briefcase, label: dict.nav.experience, href: "#experience" },
    { icon: BookOpen, label: dict.nav.blog, href: locale === "es" ? "/es/blog" : "/blog" },
    { icon: Mail, label: dict.nav.contact, href: "#contact" },
  ]

  const otherLocaleHref = locale === "en" ? "/es" : "/"
  const otherLocaleLabel = locale === "en" ? "ES" : "EN"

  return (
    <>
      {/* Mobile: toggles de tema/idioma + botón de menú */}
      <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 md:hidden">
        <ThemeToggle />
        <Link
          href={otherLocaleHref}
          aria-label={locale === "en" ? "Ver en español" : "View in English"}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-background/50 px-3 text-xs font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary hover:text-primary"
        >
          <Languages className="h-3.5 w-3.5" />
          {otherLocaleLabel}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="bg-primary/90 hover:bg-primary text-primary-foreground backdrop-blur-md border-2 border-primary shadow-lg shadow-primary/50 w-12 h-12"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div className="hidden md:block fixed top-0 left-0 right-0 z-50 h-24">
        <div className="absolute inset-0 bg-background/40 [backdrop-filter:blur(8px)]" />
        <nav className="relative flex items-center justify-center h-full">
          <div className="flex items-center space-x-6 px-6 py-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </a>
            ))}
            <span className="h-5 w-px bg-border" />
            <Link
              href={otherLocaleHref}
              aria-label={locale === "en" ? "Ver en español" : "View in English"}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <Languages className="h-4 w-4" />
              {otherLocaleLabel}
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </div>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <div className="absolute inset-0 bg-background/95 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          <nav className="absolute top-24 right-6 left-6 bg-card/95 backdrop-blur-lg border-2 border-primary/50 rounded-2xl p-6 shadow-2xl shadow-primary/20">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="flex items-center space-x-3 text-base font-medium text-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-primary/10"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
