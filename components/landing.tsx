"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { BubbleCard } from "@/components/bubble-card"
import { FloatingShapes } from "@/components/floating-shapes"
import Starfield from "@/components/starfield"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Mail, Linkedin, Download, ExternalLink, Github, MessageCircle, Twitter, Instagram, Award } from "lucide-react"
import { useState } from "react"
import { SuccessModal } from "@/components/success-modal"
import { PageTransition } from "@/components/page-transition"
import { useRouter } from "next/navigation"
import type { LandingContent } from "@/lib/content/schemas"

// Clases completas por nombre de color (Tailwind no genera clases construidas dinámicamente)
const SKILL_BADGE_CLASSES: Record<string, string> = {
  purple: "bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/50",
  blue: "bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/50",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/50",
  yellow: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/50",
  orange: "bg-orange-500/10 text-orange-300 border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/50",
  cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/50",
  rose: "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/50",
}

const PROJECT_GRADIENTS = [
  "from-blue-500/20 to-purple-500/20",
  "from-yellow-500/20 to-orange-500/20",
  "from-green-500/20 to-teal-500/20",
  "from-purple-500/20 to-pink-500/20",
  "from-orange-500/20 to-red-500/20",
  "from-red-500/20 to-pink-500/20",
]

export function Landing({ content }: { content: LandingContent }) {
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

  const handleNavigateToChat = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsNavigating(true)
    setTimeout(() => {
      router.push("/chat")
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
        alert("Failed to send message. Please try again or contact directly via email.")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Failed to send message. Please try again or contact directly via email.")
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

  const { hero, about, skills, publicProjects, researchProjects, experience, teaching } = content

  return (
    <main className="min-h-screen relative dark animate-page-fade">
      {isNavigating && <PageTransition />}

      <Starfield />
      <FloatingShapes />
      <Navigation />

      {/* Hero Section */}
      {hero.visible && (
        <section id="home" className="pt-32 pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-bold mb-15 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent floating-element">
                {hero.data.name}
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
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full bg-transparent glow-effect border-primary text-primary hover:bg-primary/20 hover:text-foreground hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-1 transition-all duration-300"
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
                  className="rounded-full bg-transparent glow-effect border-primary text-primary hover:bg-primary/20 hover:text-foreground hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-1 transition-all duration-300"
                  asChild
                >
                  <a href="https://github.com/christianfonseca" target="_blank" rel="noopener noreferrer">
                    <Github className="h-5 w-5 mr-2" />
                    GitHub
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full bg-transparent glow-effect border-primary text-primary hover:bg-primary/20 hover:text-foreground hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-1 transition-all duration-300"
                  asChild
                >
                  <a
                    href="https://scholar.google.com/citations?user=95NzphUAAAAJ&hl=es"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Scholar
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full bg-transparent glow-effect border-primary text-primary hover:bg-primary/20 hover:text-foreground hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-1 transition-all duration-300"
                  asChild
                >
                  <a
                    href="https://www.credly.com/users/christian-fonseca-rodriguez"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Award className="h-5 w-5 mr-2" />
                    Credly
                  </a>
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  className="w-52 rounded-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient glow-effect hover:shadow-[0_0_50px_rgba(168,85,247,1)] hover:scale-110 transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                  asChild
                >
                  <a href="/chat" onClick={handleNavigateToChat}>
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Try Chat!
                  </a>
                </Button>
                <Button size="lg" className="w-52 rounded-full glow-effect" asChild>
                  <a href="/cv.pdf" download="Christian-Fonseca-CV.pdf">
                    <Download className="h-4 w-4 mr-2" />
                    Download CV
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
              Professional Profile
            </h2>

            {about.visible && (
              <div className="grid md:grid-cols-2 gap-8 mb-16">
                <BubbleCard size="lg" className="glow-effect">
                  <h3 className="text-2xl font-semibold mb-4 text-primary">{about.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{about.data.text}</p>
                </BubbleCard>

                <BubbleCard size="lg" variant="accent" className="glow-effect">
                  <h3 className="text-2xl font-semibold mb-4 text-primary">Connect</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Twitter className="h-5 w-5 text-primary" />
                      <a
                        href="https://x.com/christianfonseca"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        @christianfonseca
                      </a>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Instagram className="h-5 w-5 text-primary" />
                      <a
                        href="https://instagram.com/christianfonseca"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        @christianfonseca
                      </a>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg
                        className="h-5 w-5 text-primary"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 2H3v20l4-4h14V2z" />
                        <path d="M7 8h10M7 12h6" />
                      </svg>
                      <a
                        href="https://kick.com/christianfonseca"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        kick.com/christianfonseca
                      </a>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Linkedin className="h-5 w-5 text-primary" />
                      <a
                        href="https://linkedin.com/in/christian-fonseca-rodriguez"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  </div>
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
                  <h4 className="text-lg font-semibold mb-4 text-primary">Languages</h4>
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

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ready to collaborate?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto text-center">
            I'm available for new projects and opportunities. Let's connect and build something incredible together.
          </p>

          <BubbleCard size="lg" className="glow-effect max-w-2xl mx-auto mb-12" noAnimation>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-foreground">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  placeholder="What's this about?"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  placeholder="Tell me about your project or opportunity..."
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full glow-effect hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-105 transition-all duration-300"
                disabled={isSubmitting}
              >
                <Mail className="h-5 w-5 mr-2" />
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </BubbleCard>

          <div className="flex flex-wrap justify-center gap-6">
            <Button
              size="lg"
              className="rounded-full glow-effect hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-105 transition-all duration-300"
              asChild
            >
              <a href="/chat" onClick={handleNavigateToChat}>
                <MessageCircle className="h-5 w-5 mr-2" />
                Try Chat!
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full bg-transparent glow-effect border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              asChild
            >
              <a href="mailto:christian.fonseca.r@gmail.com">
                <Mail className="h-5 w-5 mr-2" />
                Direct Email
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full bg-transparent glow-effect border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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
              className="rounded-full bg-transparent glow-effect border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              asChild
            >
              <a
                href="https://scholar.google.com/citations?user=95NzphUAAAAJ&hl=es"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Google Scholar
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Christian Fonseca. All rights reserved.</p>
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
