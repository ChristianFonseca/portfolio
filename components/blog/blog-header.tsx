"use client"

import Link from "next/link"
import { ArrowLeft, BookOpen, Mail, Languages } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Locale } from "@/lib/i18n/dictionaries"

export function BlogHeader({ locale, altHref }: { locale: Locale; altHref: string }) {
  const home = locale === "es" ? "/es" : "/"
  const blog = locale === "es" ? "/es/blog" : "/blog"
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-5 px-6">
        <Link
          href={home}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Christian Fonseca
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href={blog}
            className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
          >
            <BookOpen className="h-4 w-4" />
            Blog
          </Link>
          <Link
            href={`${home}#contact`}
            className="hidden items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary sm:flex"
          >
            <Mail className="h-4 w-4" />
            {locale === "es" ? "Contacto" : "Contact"}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={altHref}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-background/50 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Languages className="h-3.5 w-3.5" />
            {locale === "es" ? "EN" : "ES"}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
