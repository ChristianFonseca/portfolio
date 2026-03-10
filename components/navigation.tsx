"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
// Fixed icon import - ImageIcon instead of Image
import { Menu, X, Home, User, Briefcase, Code, ImageIcon, Mail } from "lucide-react"

export function Navigation() {
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
    { icon: Home, label: "Home", href: "#home" },
    { icon: User, label: "Profile", href: "#profile" },
    { icon: Code, label: "Projects", href: "#public-projects" },
    { icon: Briefcase, label: "Experience", href: "#experience" },
    // Fixed icon reference from Image to ImageIcon
    { icon: ImageIcon, label: "Gallery", href: "#gallery" },
    { icon: Mail, label: "Contact", href: "#contact" },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-6 right-6 z-[100] md:hidden bg-primary/90 hover:bg-primary text-primary-foreground backdrop-blur-md border-2 border-primary shadow-lg shadow-primary/50 w-12 h-12"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

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
