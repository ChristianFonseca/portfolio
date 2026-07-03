import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} antialiased`} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
