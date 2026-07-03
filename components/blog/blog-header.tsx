"use client"

import Link from "next/link"
import { ArrowLeft, Languages } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Locale } from "@/lib/i18n/dictionaries"

export function BlogHeader({ locale, altHref }: { locale: Locale; altHref: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-6">
        <Link
          href={locale === "es" ? "/es" : "/"}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Christian Fonseca
        </Link>
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
