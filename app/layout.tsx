import type React from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { DM_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
})

const siteDescription =
  "Senior Data & AI Engineer with 10+ years of experience in scalable data architectures, ML models, and production-ready solutions."

export const metadata: Metadata = {
  metadataBase: new URL("https://christianfonseca.dev"),
  title: "Christian Fonseca - AI Solutions Engineer",
  description: siteDescription,
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      es: "/es",
    },
  },
  openGraph: {
    title: "Christian Fonseca - AI Solutions Engineer",
    description: siteDescription,
    url: "/",
    siteName: "Christian Fonseca",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Christian Fonseca - AI Solutions Engineer",
    description: siteDescription,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // El middleware setea x-locale según la ruta (/es → es); default en
  const requestHeaders = await headers()
  const lang = requestHeaders.get("x-locale") === "es" ? "es" : "en"

  return (
    <html lang={lang} className={`${dmSans.variable} antialiased`} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
