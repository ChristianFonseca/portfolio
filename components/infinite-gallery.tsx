"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Play, Pause } from "lucide-react"

interface GalleryItem {
  id: number
  title: string
  category: string
  image: string
  description: string
}

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: "Neural Network Visualization",
    category: "Deep Learning",
    image: "/placeholder-wu0iq.png",
    description: "Interactive visualization of deep neural network architectures",
  },
  {
    id: 2,
    title: "Data Pipeline Dashboard",
    category: "Data Engineering",
    image: "/data-pipeline-dashboard.png",
    description: "Real-time monitoring dashboard for ETL pipelines",
  },
  {
    id: 3,
    title: "ML Model Performance",
    category: "Machine Learning",
    image: "/ml-performance-charts.png",
    description: "Comprehensive model evaluation and performance metrics",
  },
  {
    id: 4,
    title: "Cloud Architecture",
    category: "Infrastructure",
    image: "/aws-cloud-architecture.png",
    description: "Scalable cloud infrastructure for data processing",
  },
  {
    id: 5,
    title: "NLP Text Analysis",
    category: "Natural Language Processing",
    image: "/text-analysis-visualization.png",
    description: "Advanced text processing and sentiment analysis",
  },
  {
    id: 6,
    title: "Time Series Forecasting",
    category: "Analytics",
    image: "/time-series-forecasting.png",
    description: "Predictive analytics for business forecasting",
  },
  {
    id: 7,
    title: "Computer Vision",
    category: "AI/ML",
    image: "/object-detection-boxes.png",
    description: "Object detection and image classification systems",
  },
  {
    id: 8,
    title: "Data Visualization",
    category: "Analytics",
    image: "/interactive-dashboard.png",
    description: "Interactive dashboards for business intelligence",
  },
]

export function InfiniteGallery() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 })

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const scroll = () => {
      if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
        scrollContainer.scrollLeft = 0
      } else {
        scrollContainer.scrollLeft += 1
      }
    }

    const startAnimation = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(scroll, 50)
    }

    const stopAnimation = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    if (isPlaying) {
      startAnimation()
    } else {
      stopAnimation()
    }

    const handleMouseEnter = () => {
      if (isPlaying) stopAnimation()
    }

    const handleMouseLeave = () => {
      if (isPlaying) startAnimation()
    }

    scrollContainer.addEventListener("mouseenter", handleMouseEnter)
    scrollContainer.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      stopAnimation()
      scrollContainer.removeEventListener("mouseenter", handleMouseEnter)
      scrollContainer.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [isPlaying])

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setIsPlaying(false) // Stop auto-scroll when dragging
    setDragStart({
      x: e.pageX - scrollRef.current.offsetLeft,
      scrollLeft: scrollRef.current.scrollLeft,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - dragStart.x) * 2 // Multiply by 2 for faster scrolling
    scrollRef.current.scrollLeft = dragStart.scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const duplicatedItems = [...galleryItems, ...galleryItems]

  return (
    <div className="relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10 bg-card/80 backdrop-blur-sm border border-border rounded-full p-2 glow-effect">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isPlaying ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          <span>{isPlaying ? "Playing" : "Paused"}</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-hidden cursor-grab active:cursor-grabbing"
        style={{ scrollBehavior: "auto", userSelect: "none" }}
        onClick={toggleAnimation}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        title="Click to play/pause gallery or drag to control manually"
      >
        {duplicatedItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex-shrink-0 w-80 bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden glow-effect hover:scale-105 transition-all duration-300"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground">{item.category}</Badge>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-primary mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  )
}
