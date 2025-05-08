"use client"

import { useRef, useState, useEffect, type ReactNode } from "react"

interface ChartAnimationWrapperProps {
  children: ReactNode
  className?: string
}

export function ChartAnimationWrapper({ children, className = "" }: ChartAnimationWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
      },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-1000 ${isVisible ? "opacity-100" : "opacity-0"} ${className}`}
    >
      {children}
    </div>
  )
}
