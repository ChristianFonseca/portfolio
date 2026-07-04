"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { BubbleCard } from "@/components/bubble-card"
import { ThemedBackground } from "@/components/themed-background"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Mail, Linkedin, Download, ExternalLink, Github, GraduationCap, MessageCircle, Award } from "lucide-react"
import { useState } from "react"
import { SuccessModal } from "@/components/success-modal"
import { PageTransition } from "@/components/page-transition"
import { useRouter } from "next/navigation"
import type { LandingContent } from "@/lib/content/schemas"
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries"

// Clases completas por nombre de color, con variantes light y dark
// (Tailwind no genera clases construidas dinámicamente)
const SKILL_BADGE_CLASSES: Record<string, string> = {
  purple:
    "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 dark:border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/60",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 dark:border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/60",
  emerald:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/60",
  yellow:
    "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 dark:border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/60",
  orange:
    "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30 dark:border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/60",
  cyan: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 dark:border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/60",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 dark:border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/60",
}

const PROJECT_GRADIENTS = [
  "from-blue-500/20 to-purple-500/20",
  "from-yellow-500/20 to-orange-500/20",
  "from-green-500/20 to-teal-500/20",
  "from-purple-500/20 to-pink-500/20",
  "from-orange-500/20 to-red-500/20",
  "from-red-500/20 to-pink-500/20",
]

export function Landing({
  content,
  locale,
  dict,
}: {
  content: LandingContent
  locale: Locale
  dict: Dictionary
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  const chatHref = locale === "es" ? "/es/chat" : "/chat"
  const handleNavigateToChat = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsNavigating(true)
    setTimeout(() => {
      router.push(chatHref)
    }, 1500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setShowSuccessModal(true)
        setFormData({ name: "", email: "", subject: "", message: "" })
      } else {
        console.error("Error sending message:", data.error)
        alert(dict.contact.sendError)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      alert(dict.contact.sendError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }))
  }

  const { hero, about, skills, publicProjects, researchProjects, experience, teaching, faq } = content

  return (
    <main className="min-h-screen relative animate-page-fade">
      {isNavigating && <PageTransition />}

      <ThemedBackground />
      <Navigation locale={locale} dict={dict} />

      {/* Hero Section */}
      {hero.visible && (
        <section id="home" className="pt-32 pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              {/* Nombre en estilo lockup de marca: llaves en gradiente + serif itálica */}
              <h1 className="text-5xl md:text-7xl mb-15 floating-element font-serif italic lowercase tracking-tight">
                <span
                  aria-hidden
                  className="bg-gradient-to-b from-primary to-accent bg-clip-text text-transparent font-normal"
                >
                  {"{ "}
                </span>
                <span className="text-foreground">{hero.data.name}</span>
                <span
                  aria-hidden
                  className="bg-gradient-to-b from-primary to-accent bg-clip-text text-transparent font-normal"
                >
                  {" }"}
                </span>
              </h1>

              <div className="flex justify-center mb-15">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-lg opacity-75 group-hover:opacity-100 transition duration-300 animate-gradient bg-[length:200%_100%]"></div>
                  <div className="relative">
                    <img
                      src={hero.data.photo || "/profile.webp"}
                      alt={hero.data.name}
                      className="w-56 h-56 md:w-64 md:h-64 rounded-full object-cover border-4 border-background"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xl md:text-3xl text-foreground font-medium mb-6 max-w-3xl mx-auto">
                {hero.data.tagline}
              </p>
              <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 mb-8 text-sm md:text-base text-muted-foreground max-w-4xl mx-auto font-medium">
                {hero.data.certs.map((cert, i) => (
                  <span key={`${cert.label}-${i}`} className="contents">
                    {i > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary/40 hidden sm:block"></span>}
                    {cert.count ? (
                      <span className="flex items-center">
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-extrabold text-base md:text-lg mr-1.5">
                          {cert.count}
                        </span>{" "}
                        {cert.label}
                      </span>
                    ) : (
                      <span className="text-foreground">{cert.label}</span>
                    )}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="px-4 py-2 text-sm glow-effect">
                  <MapPin className="h-4 w-4 mr-2" />
                  {hero.data.location}
                </Badge>
              </div>
              {/* Redes: iconos grandes sin chrome de botón — las marcas ya son reconocibles */}
              <div className="mb-8 flex flex-wrap items-center justify-center gap-7">
                {[
                  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/in/christian-fonseca-rodriguez" },
                  { icon: Github, label: "GitHub", href: "https://github.com/christianfonseca" },
                  {
                    icon: GraduationCap,
                    label: "Google Scholar",
                    href: "https://scholar.google.com/citations?user=95NzphUAAAAJ&hl=es",
                  },
                  { icon: Award, label: "Credly", href: "https://www.credly.com/users/christian-fonseca-rodriguez" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    className="text-muted-foreground transition-all duration-200 hover:-translate-y-1 hover:text-primary hover:drop-shadow-[0_0_14px_rgba(168,85,247,0.65)]"
                  >
                    <social.icon className="h-8 w-8" strokeWidth={1.75} />
                  </a>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  className="w-52"
                  asChild
                >
                  <a href={chatHref} onClick={handleNavigateToChat}>
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {dict.hero.tryChat}
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="w-52" asChild>
                  <a href="/cv.pdf" download="Christian-Fonseca-CV.pdf">
                    <Download className="h-4 w-4 mr-2" />
                    {dict.hero.downloadCV}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Profile Section */}
      {(about.visible || skills.visible) && (
        <section id="profile" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {dict.profile.heading}
            </h2>

            {about.visible && (
              <div className="mb-16">
                <BubbleCard size="lg" className="glow-effect">
                  <h3 className="text-2xl font-semibold mb-4 text-primary">{about.title}</h3>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">{about.data.text}</p>
                </BubbleCard>
              </div>
            )}

            {/* Skills & Certs Grid */}
            {skills.visible && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skills.data.groups.map((group) => (
                  <BubbleCard key={group.name} className="glow-effect flex flex-col h-full">
                    <h4 className="text-lg font-semibold mb-4 text-primary">{group.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.badges.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className={`text-xs hover:-translate-y-0.5 transition-all ${SKILL_BADGE_CLASSES[group.color] ?? SKILL_BADGE_CLASSES.purple}`}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </BubbleCard>
                ))}

                <BubbleCard className="glow-effect flex flex-col h-full">
                  <h4 className="text-lg font-semibold mb-4 text-primary">{dict.profile.languagesTitle}</h4>
                  <div className="flex flex-col gap-2">
                    {skills.data.languages.map((lang) => (
                      <div
                        key={lang.name}
                        className="flex items-center justify-between p-2 rounded-lg bg-background/40 border border-border/50"
                      >
                        <span className="text-sm font-medium">{lang.name}</span>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                          {lang.level}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </BubbleCard>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Public Projects Section */}
      {publicProjects.visible && (
        <section id="public-projects" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {publicProjects.title}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicProjects.data.items.map((project, i) => (
                <BubbleCard key={`${project.title}-${i}`} className="glow-effect">
                  <div
                    className={`w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br ${PROJECT_GRADIENTS[i % PROJECT_GRADIENTS.length]}`}
                  >
                    <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary">{project.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.tech.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: project.languageColor || "#a855f7" }}
                    ></span>
                    {project.language}
                  </div>
                </BubbleCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Research Projects Section */}
      {researchProjects.visible && (
        <section id="research-projects" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {researchProjects.title}
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {researchProjects.data.items.map((project, i) => (
                <BubbleCard key={`${project.title}-${i}`} size="lg" className="glow-effect">
                  <h3 className="text-xl font-semibold mb-4 text-primary">{project.title}</h3>
                  <p className="text-muted-foreground mb-4">{project.description}</p>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    {project.bullets.map((bullet, j) => (
                      <li key={j}>• {bullet}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </BubbleCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience Section */}
      {experience.visible && (
        <section id="experience" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {experience.title}
            </h2>

            <div className="space-y-8">
              {experience.data.items.map((item, i) => (
                <ExperienceCard key={`${item.org}-${i}`} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Consulting & Teaching Section */}
      {teaching.visible && (
        <section id="teaching" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {teaching.title}
            </h2>

            <div className="space-y-8">
              {teaching.data.items.map((item, i) => (
                <ExperienceCard key={`${item.org}-${i}`} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faq.visible && faq.data.items.length > 0 && (
        <section id="faq" className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {faq.title}
            </h2>
            <div className="space-y-4">
              {faq.data.items.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-border bg-card/40 backdrop-blur-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-left font-medium [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span className="shrink-0 text-primary transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {dict.contact.heading}
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto text-center">
            {dict.contact.subheading}
          </p>

          <BubbleCard size="lg" className="glow-effect max-w-2xl mx-auto mb-12" noAnimation>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    {dict.contact.name}
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder={dict.contact.namePlaceholder}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    {dict.contact.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder={dict.contact.emailPlaceholder}
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-foreground">
                  {dict.contact.subject}
                </label>
                <input
                  id="subject"
                  type="text"
                  placeholder={dict.contact.subjectPlaceholder}
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  {dict.contact.message}
                </label>
                <textarea
                  id="message"
                  rows={6}
                  placeholder={dict.contact.messagePlaceholder}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                <Mail className="h-5 w-5 mr-2" />
                {isSubmitting ? dict.contact.sending : dict.contact.send}
              </Button>
            </form>
          </BubbleCard>

          <div className="flex flex-wrap justify-center gap-6">
            <Button variant="outline" size="lg" asChild>
              <a href={chatHref} onClick={handleNavigateToChat}>
                <MessageCircle className="h-5 w-5 mr-2" />
                {dict.hero.tryChat}
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
             
              asChild
            >
              <a href="mailto:christian.fonseca.r@gmail.com">
                <Mail className="h-5 w-5 mr-2" />
                {dict.contact.directEmail}
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
             
              asChild
            >
              <a href="https://linkedin.com/in/christian-fonseca-rodriguez" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-5 w-5 mr-2" />
                LinkedIn
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
             
              asChild
            >
              <a
                href="https://scholar.google.com/citations?user=95NzphUAAAAJ&hl=es"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                {dict.contact.scholar}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Christian Fonseca. {dict.footer.rights}
          </p>
        </div>
      </footer>

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </main>
  )
}

function ExperienceCard({
  item,
}: {
  item: { role: string; org: string; period: string; current: boolean; bullets: string[]; tech: string[] }
}) {
  return (
    <BubbleCard size="lg" className="glow-effect">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-primary">{item.role}</h3>
          <p className="text-lg font-medium text-foreground">{item.org}</p>
        </div>
        {item.current ? (
          <Badge className="mt-2 md:mt-0 bg-primary text-primary-foreground">{item.period}</Badge>
        ) : (
          <Badge variant="outline" className="mt-2 md:mt-0 border-primary text-primary">
            {item.period}
          </Badge>
        )}
      </div>
      <ul className="text-muted-foreground space-y-2 text-sm">
        {item.bullets.map((bullet, i) => (
          <li key={i}>• {bullet}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2 mt-4">
        {item.tech.map((tech) => (
          <Badge key={tech} variant="secondary" className="text-xs">
            {tech}
          </Badge>
        ))}
      </div>
    </BubbleCard>
  )
}
