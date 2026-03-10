"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { BubbleCard } from "@/components/bubble-card"
import { FloatingShapes } from "@/components/floating-shapes"
import Starfield from "@/components/starfield"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Mail, Linkedin, Download, ExternalLink, Github, MessageCircle, Twitter, Instagram, Award } from "lucide-react"
import { InfiniteGallery } from "@/components/infinite-gallery"
import { useState } from "react"
import { SuccessModal } from "@/components/success-modal"
import { PageTransition } from "@/components/page-transition"
import { useRouter } from "next/navigation"

export default function Home() {
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
        console.error("[v0] Error sending message:", data.error)
        alert("Failed to send message. Please try again or contact directly via email.")
      }
    } catch (error) {
      console.error("[v0] Error submitting form:", error)
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

  return (
    <main className="min-h-screen relative dark animate-page-fade">
      {isNavigating && <PageTransition />}

      <Starfield />
      <FloatingShapes />
      <Navigation />

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">


            <h1 className="text-5xl md:text-7xl font-bold mb-15 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent floating-element">
              Christian Fonseca
            </h1>

            <div className="flex justify-center mb-15">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-lg opacity-75 group-hover:opacity-100 transition duration-300 animate-gradient bg-[length:200%_100%]"></div>
                <div className="relative">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/profile_4-MnyYeHmjkRrxt72ovUYNwlmHASV2Gl.webp"
                    alt="Christian Fonseca"
                    className="w-56 h-56 md:w-64 md:h-64 rounded-full object-cover border-4 border-background"
                  />
                </div>
              </div>
            </div>


            <p className="text-xl md:text-3xl text-foreground font-medium mb-6 max-w-3xl mx-auto">
              AI Engineer | Data Architect | Data Scientist
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 mb-8 text-sm md:text-base text-muted-foreground max-w-4xl mx-auto font-medium">
              <span className="flex items-center"><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-extrabold text-base md:text-lg mr-1.5">13x</span> AWS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 hidden sm:block"></span>
              <span className="flex items-center"><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-extrabold text-base md:text-lg mr-1.5">4x</span> Azure</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 hidden sm:block"></span>
              <span className="flex items-center"><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-extrabold text-base md:text-lg mr-1.5">4x</span> OCI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 hidden sm:block"></span>
              <span className="text-foreground">TOGAF</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 hidden sm:block"></span>
              <span className="text-foreground">DAMA CDMP</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2 text-sm glow-effect">
                <MapPin className="h-4 w-4 mr-2" />
                Lima, Peru
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
              {/* CHANGE: Making Try Chat more prominent without changing font size, and matching button widths */}
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
                <a href="#">
                  <Download className="h-4 w-4 mr-2" />
                  Download CV
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section id="profile" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Professional Profile
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <BubbleCard size="lg" className="glow-effect">
              <h3 className="text-2xl font-semibold mb-4 text-primary">About Me</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI Engineer with 10+ years of experience translating complex business needs into end-to-end
                data solutions. Expert in building scalable data architectures, automated ETL/ELT pipelines, and
                production-ready ML models (DataSecOps/MLOps).
              </p>
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

          {/* Skills & Certs Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Generative AI & LLMs */}
            <BubbleCard className="glow-effect flex flex-col h-full">
              <h4 className="text-lg font-semibold mb-4 text-primary">
                Generative AI & LLMs
              </h4>
              <div className="flex flex-wrap gap-2 ">
                {["RAG Architectures", "LangChain", "OpenAI API", "Gemini", "Bedrock", "DeepSeek", "Prompt Engineering", "Pinecone", "FAISS"].map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/50 hover:-translate-y-0.5 transition-all">
                    {skill}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            {/* Machine Learning & MLOps */}
            <BubbleCard className="glow-effect flex flex-col h-full">
              <h4 className="text-lg font-semibold mb-4 text-primary">
                Machine Learning & MLOps
              </h4>
              <div className="flex flex-wrap gap-2">
                {["TensorFlow", "PyTorch", "Scikit-learn", "MLFlow", "Vertex AI", "Amazon SageMaker"].map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/50 hover:-translate-y-0.5 transition-all">
                    {skill}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            {/* Data Engineering & Databases */}
            <BubbleCard className="glow-effect flex flex-col h-full">
              <h4 className="text-lg font-semibold mb-4 text-primary">
                Data Engineering & Databases
              </h4>
              <div className="flex flex-wrap gap-2">
                {["SQL", "PySpark", "PostgreSQL", "Oracle", "Redshift", "SQL Server", "MongoDB", "Pinecone"].map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:-translate-y-0.5 transition-all">
                    {skill}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            {/* Programming Languages */}
            <BubbleCard className="glow-effect flex flex-col h-full">
              <h4 className="text-lg font-semibold mb-4 text-primary">
                Programming Languages
              </h4>
              <div className="flex flex-wrap gap-2">
                {["Python", "R", "MATLAB", "C/C++", "C#", "Rust"].map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs bg-yellow-500/10 text-yellow-300 border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/50 hover:-translate-y-0.5 transition-all">
                    {skill}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            {/* Cloud Platforms */}
            <BubbleCard className="glow-effect flex flex-col h-full">
              <h4 className="text-lg font-semibold mb-4 text-primary">
                Cloud Platforms
              </h4>
              <div className="flex flex-wrap gap-2">
                {["AWS", "Azure", "GCP", "OCI", "Databricks"].map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs bg-cyan-500/10 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:-translate-y-0.5 transition-all">
                    {skill}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            {/* DevOps & Tools */}
            <BubbleCard className="glow-effect flex flex-col h-full">
              <h4 className="text-lg font-semibold mb-4 text-primary">
                DevOps & Tools
              </h4>
              <div className="flex flex-wrap gap-2">
                {["Docker", "Kubernetes", "Git", "GitLab/GitHub Actions", "Terraform", "CloudFormation"].map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/50 hover:-translate-y-0.5 transition-all">
                    {skill}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            {/* Languages */}
            <BubbleCard className="glow-effect flex flex-col h-full">
              <h4 className="text-lg font-semibold mb-4 text-primary">
                Languages
              </h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/40 border border-border/50">
                  <span className="text-sm font-medium">Spanish</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">Native</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/40 border border-border/50">
                  <span className="text-sm font-medium">English</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">Advanced</Badge>
                </div>
              </div>
            </BubbleCard>


          </div>
        </div>
      </section>

      {/* Public Projects Section */}
      <section id="public-projects" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Public Projects
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BubbleCard className="glow-effect">
              <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <img
                  src="/ml-pipeline-dashboard.webp"
                  alt="ML Pipeline Framework"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">ML Pipeline Framework</h3>
                <Button variant="ghost" size="sm" className="p-2" asChild>
                  <a href="https://github.com/christianfonseca/ml-pipeline" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Scalable MLOps framework for automated model training, validation, and deployment with monitoring
                capabilities.
              </p>
              <div className="flex flex-wrap gap-1 mb-4">
                {["Python", "Docker", "MLflow", "AWS"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Python
              </div>
            </BubbleCard>

            <BubbleCard className="glow-effect">
              <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                <img
                  src="/data-engineering-etl-pipeline.webp"
                  alt="Data Engineering Toolkit"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">Data Engineering Toolkit</h3>
                <Button variant="ghost" size="sm" className="p-2" asChild>
                  <a href="https://github.com/christianfonseca/data-toolkit" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Collection of reusable data processing utilities and ETL pipelines for various data sources and formats.
              </p>
              <div className="flex flex-wrap gap-1 mb-4">
                {["PySpark", "SQL", "Airflow", "Kafka"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                Python
              </div>
            </BubbleCard>

            <BubbleCard className="glow-effect">
              <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-green-500/20 to-teal-500/20">
                <img src="/nlp-analytics-suite.webp" alt="NLP Analytics Suite" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">NLP Analytics Suite</h3>
                <Button variant="ghost" size="sm" className="p-2" asChild>
                  <a href="https://github.com/christianfonseca/nlp-suite" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Advanced NLP toolkit with sentiment analysis, entity recognition, and text classification capabilities.
              </p>
              <div className="flex flex-wrap gap-1 mb-4">
                {["Python", "Transformers", "spaCy", "FastAPI"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Python
              </div>
            </BubbleCard>

            <BubbleCard className="glow-effect">
              <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <img
                  src="/time-series-forecasting.webp"
                  alt="Time Series Forecasting"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">Time Series Forecasting</h3>
                <Button variant="ghost" size="sm" className="p-2" asChild>
                  <a
                    href="https://github.com/christianfonseca/ts-forecasting"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Comprehensive time series analysis and forecasting models with automated feature engineering.
              </p>
              <div className="flex flex-wrap gap-1 mb-4">
                {["Python", "Prophet", "ARIMA", "Plotly"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                Jupyter Notebook
              </div>
            </BubbleCard>

            <BubbleCard className="glow-effect">
              <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <img
                  src="/aws-cloud-architecture.webp"
                  alt="Cloud Infrastructure"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">Cloud Infrastructure</h3>
                <Button variant="ghost" size="sm" className="p-2" asChild>
                  <a href="https://github.com/christianfonseca/cloud-infra" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Terraform modules and CloudFormation templates for scalable data infrastructure on AWS and Azure.
              </p>
              <div className="flex flex-wrap gap-1 mb-4">
                {["Terraform", "AWS", "Azure", "Kubernetes"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                HCL
              </div>
            </BubbleCard>

            <BubbleCard className="glow-effect">
              <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-red-500/20 to-pink-500/20">
                <img
                  src="/deep-learning-network.webp"
                  alt="Deep Learning Models"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">Deep Learning Models</h3>
                <Button variant="ghost" size="sm" className="p-2" asChild>
                  <a href="https://github.com/christianfonseca/dl-models" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Collection of deep learning architectures for computer vision and NLP tasks with pre-trained weights.
              </p>
              <div className="flex flex-wrap gap-1 mb-4">
                {["PyTorch", "TensorFlow", "CUDA", "OpenCV"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                Python
              </div>
            </BubbleCard>
          </div>
        </div>
      </section>

      {/* Research Projects Section */}
      <section id="research-projects" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Research Projects
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <BubbleCard size="lg" className="glow-effect">
              <h3 className="text-xl font-semibold mb-4 text-primary">Brain-Computer Interface</h3>
              <p className="text-muted-foreground mb-4">
                State-funded project, focused on the creation of an essential communication system for hemiplegic
                patients.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                <li>
                  • Enhanced Brain-Computer Interface performance by 10% using advanced digital signal processing and ML
                  algorithms.
                </li>
                <li>
                  • Built a custom C++ user interface for brain signal acquisition based on ERP and sensorimotor
                  rhythms.
                </li>
                <li>
                  • Optimized EEG data acquisition and channel selection by applying Python's statistical and CSP
                  methods.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2">
                {["Python", "TensorFlow", "Torch", "C++", "MATLAB", "EEG Signals Analysis"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            <BubbleCard size="lg" className="glow-effect">
              <h3 className="text-xl font-semibold mb-4 text-primary">Mining Robot</h3>
              <p className="text-muted-foreground mb-4">
                State-funded project, focused on building an autonomous robot to detect toxic gases in underground
                mines.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                <li>
                  • Improved the robotic exo-arm's movement precision by 5% by implementing Fuzzy Logic and Advanced
                  Controllers.
                </li>
                <li>
                  • Developed a real-time object recognition system for polygons and hand gestures using Python and
                  OpenCV.
                </li>
                <li>
                  • Designed and implemented robust navigation and route planning algorithms using both MATLAB and C++.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2">
                {["Python", "Genetic Algorithms", "C++", "MATLAB", "Robotics"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Professional Experience
          </h2>

          <div className="space-y-8">
            {/* Current Position */}
            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">AIOps Specialist</h3>
                  <p className="text-lg font-medium text-foreground">Baufest</p>
                </div>
                <Badge className="mt-2 md:mt-0 bg-primary text-primary-foreground">May 2025 - Present</Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  • Built AI chatbots for instant documentation retrieval and error analysis, reducing search and debugging time to seconds.
                </li>
                <li>
                  • Automated Boomi documentation generation, standardizing integration artifacts and accelerating knowledge delivery.
                </li>
                <li>
                  • Designed AI-driven unit test generation to automate validation and improve code quality and developer productivity.
                </li>
                <li>
                  • Implemented AI video documentation that converts walkthroughs into structured docs with conversational guidance.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Python", "Docker", "LLM", "RAG", "OpenAI", "Gemini", "Bedrock", "Boomi", "React", "AWS"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>


            {/* Position */}
            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">AI Solutions Engineer</h3>
                  <p className="text-lg font-medium text-foreground">JobLeap AI</p>
                </div>
                <Badge className="mt-2 md:mt-0 bg-primary text-primary-foreground">October 2024 - April 2025</Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  • Designed 10+ end-to-end data pipelines from multiple vendors using relational and vector databases.
                </li>
                <li>
                  • Established automated testing frameworks for data pipelines, guaranteeing high reliability and
                  superior data quality.
                </li>
                <li>
                  • Applied advanced NLP and embedding techniques to enrich data transformations, boosting accuracy and
                  relevance.
                </li>
                <li>
                  • Used LangChain and LLMs to generate relevance scores and create resume and interview simulations.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Python", "LLM", "NLP", "OpenAI", "DeepSeek", "PostgreSQL", "Pinecone", "AWS"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            {/* Freelance/Consulting Experiences */}
            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">LLM Data Scientist & Engineer</h3>
                  <p className="text-lg font-medium text-foreground">Turing (Consultant at Apple)</p>
                </div>
                <Badge className="mt-2 md:mt-0 bg-primary text-primary-foreground">November 2024 – April 2025</Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  • Developed over 300 advanced reasoning notebooks for complex subjects like ML, robotics, and control
                  systems.
                </li>
                <li>
                  • Covered prompt engineering, data structures, and data science with validated code and solution
                  steps.
                </li>
                <li>
                  • Implemented robust QA frameworks to test 200+ notebooks for clarity, reasoning, and code
                  correctness.
                </li>
                <li>
                  • Built content generation pipelines using OpenAI, DeepSeek, and Gemini to ensure linguistic accuracy.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Python", "LLMs", "OpenAI", "DeepSeek", "Gemini"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Staff Data Architect</h3>
                  <p className="text-lg font-medium text-foreground">DELOSI</p>
                </div>
                <Badge className="mt-2 md:mt-0 bg-primary text-primary-foreground">October 2024 – March 2025</Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>• Cut data flow review and error handling times by 60% with a new monitoring architecture.</li>
                <li>
                  • Reduced development time by 100% by automating cloud backups for over 5,000 on-premise tables.
                </li>
                <li>
                  • Created reusable Cloud Formation templates for pipelines using AWS Step Functions, Glue, and
                  Lambdas.
                </li>
                <li>
                  • Designed and successfully implemented more than 20 unique data architectures for various business
                  units.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Python", "PySpark", "SQL", "AWS"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            {/* Previous Positions */}
            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Senior Data Solutions Consultant</h3>
                  <p className="text-lg font-medium text-foreground">TIVIT LATAM</p>
                </div>
                <Badge variant="outline" className="mt-2 md:mt-0 border-primary text-primary">
                  November 2023 – September 2024
                </Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  • Migrated on-prem SQL to AWS RDS via DMS, enabling 3-min ingestion and cutting station refueling
                  delays.
                </li>
                <li>
                  • Deployed RDS monitoring with automated alerts for failures/overloads, reducing production downtime.
                </li>
                <li>
                  • Built Databricks-based pipelines with Athena pipelines for ML-driven electricity-demand forecasts.
                </li>
                <li>
                  • Delivered recommendation dashboards with automated stakeholder notifications, boosting operational
                  efficiency.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Python", "PySpark", "SQL", "PostgreSQL", "Databricks", "AWS"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Senior Data Scientist Consultant</h3>
                  <p className="text-lg font-medium text-foreground">Fivvy</p>
                </div>
                <Badge variant="outline" className="mt-2 md:mt-0 border-primary text-primary">
                  July 2023 – October 2023
                </Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  • Led data modeling for the "Contextual Profiler" app, leading to its acquisition by two businesses.
                </li>
                <li>
                  • Developed a local Streamlit application to effectively visualize and present the performance of
                  various models.
                </li>
                <li>
                  • Formulated and deployed solvency and customer acquisition models for financial products using AWS
                  Glue.
                </li>
                <li>
                  • Modified complex budgetary models to accommodate new and requested functionalities within the
                  application.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Python", "MySQL", "AWS"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Manager Data Scientist</h3>
                  <p className="text-lg font-medium text-foreground">BBVA</p>
                </div>
                <Badge variant="outline" className="mt-2 md:mt-0 border-primary text-primary">
                  June 2021 – October 2023
                </Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  • Drove a 10% rise in debit card sales by creating a hybrid client profitability recommendation
                  system.
                </li>
                <li>
                  • Improved expert evaluation of billing accuracy by 50%, using forecasting and elasticity models in
                  retail budgeting.
                </li>
                <li>• Boosted corporate customer acquisition by 15% through cost calculation system development.</li>
                <li>
                  • Implemented the RORC threshold selection, resulting in a 5% monthly decrease in the number of
                  high-risk clients.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Machine Learning", "Python", "PySpark", "SQL", "Oracle", "Datio"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            {/* Professor/Teaching Experiences */}

            {/* BCP Experience */}
            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Senior Data Scientist</h3>
                  <p className="text-lg font-medium text-foreground">Banco de Crédito del Peru (BCP)</p>
                </div>
                <Badge variant="outline" className="mt-2 md:mt-0 border-primary text-primary">
                  November 2019 – May 2021
                </Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  • Slashed lead evaluation time from two days to under one minute using credit-score and income
                  forecasts.
                </li>
                <li>
                  • Improved customer acquisition accuracy by 10% by implementing advanced customer-transaction graph
                  modeling.
                </li>
                <li>
                  • Cut data analysis time by 30% by designing a reusable univariate and multivariate analysis toolkit.
                </li>
                <li>
                  • Halved model metrics tracking time by 50% through the development of an IFRS-9 scoring toolkit.
                </li>
                <li>• Evaluated models via portfolio projections to forecast shifts up to 6 months ahead.</li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Python", "PySpark", "SQL", "Oracle", "SAS", "Cloudera"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            {/* Rimac Experience */}
            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Data Scientist</h3>
                  <p className="text-lg font-medium text-foreground">Rimac Seguros y Reaseguros</p>
                </div>
                <Badge variant="outline" className="mt-2 md:mt-0 border-primary text-primary">
                  August 2018 - November 2019
                </Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  • Halved fraud investigation times from six to three months using graph modeling for vehicle policies.
                </li>
                <li>
                  • Drove a 20% sales increase by implementing personalized, end-to-end pricing models for vehicle
                  insurance.
                </li>
                <li>
                  • Slashed model pre-processing time by a factor of 20x by effectively leveraging PySpark on AWS.
                </li>
                <li>
                  • Automated the monthly and on-demand execution of predictive models, improving both efficiency and
                  reliability.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Machine Learning", "Python", "PySpark", "SQL", "Oracle", "AWS"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            {/* Accenture Experience */}
            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Application Development Associate</h3>
                  <p className="text-lg font-medium text-foreground">Accenture</p>
                </div>
                <Badge variant="outline" className="mt-2 md:mt-0 border-primary text-primary">
                  January 2018 – August 2018
                </Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>• Cut daily back-office data collection time from four hours to just ten minutes using Python.</li>
                <li>
                  • Developed proof-of-concept business cases by implementing AI solutions and custom application
                  development.
                </li>
                <li>
                  • Contributed to the full lifecycle (analysis, design, development) of various cutting-edge innovation
                  projects.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Python", "SQL", "Automation Anywhere", "AWS"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>
          </div>
        </div>
      </section>

      {/* Teaching Experience Section */}
      <section id="teaching" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Teaching Experience
          </h2>

          <div className="space-y-8">
            {/* Professor/Teaching Experiences */}
            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Professor</h3>
                  <p className="text-lg font-medium text-foreground">Data Mining Consulting (DMC)</p>
                </div>
                <Badge className="mt-2 md:mt-0 bg-primary text-primary-foreground">October 2021 – Present</Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  • Authored and instructed over 20 advanced analytics programs, creating all original course material
                  for each edition.
                </li>
                <li>
                  • Established the institutional baseline for supporting and reviewing MLOps tests and cloud deployment
                  projects.
                </li>
                <li>
                  • Developed technical interview exams with diverse questions to assess candidates on advanced
                  programming topics.
                </li>
                <li>
                  • Key programs delivered include Data Engineering (AWS & Azure), MLOps & ML Engineering, Deep
                  Learning, Time Series & NLP, Big Data, and Advanced Python (ETL, Web Scraping).
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  "Machine Learning",
                  "Deep Learning",
                  "Python",
                  "PySpark",
                  "TensorFlow",
                  "Torch",
                  "Git",
                  "MLFlow",
                  "Docker",
                  "AWS",
                  "Azure",
                  "GCP",
                ].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>

            <BubbleCard size="lg" className="glow-effect">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Professor</h3>
                  <p className="text-lg font-medium text-foreground">
                    BPC Business School – La Molina National Agrarian University (UNALM)
                  </p>
                </div>
                <Badge className="mt-2 md:mt-0 bg-primary text-primary-foreground">November 2020 – Present</Badge>
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  • Directed and taught over 10 Advanced Analytics Specialization programs, developing all course
                  materials.
                </li>
                <li>
                  • Successfully trained more than 100 professionals from diverse industries in data analytics and Big
                  Data concepts.
                </li>
                <li>
                  • Provided personalized, in-depth feedback to guide professionals in advancing their unique analytical
                  projects.
                </li>
                <li>
                  • Key programs delivered include specializations in Big Data & Analytics and Data Science for
                  Business.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Python", "SQL"].map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </BubbleCard>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Gallery
          </h2>
          <InfiniteGallery />
        </div>
      </section>

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
                href="https://scholar.google.com/citations?user=YOUR_USER_ID"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                View Full CV
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Christian Fonseca. All rights reserved.</p>
        </div>
      </footer>

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </main>
  )
}
