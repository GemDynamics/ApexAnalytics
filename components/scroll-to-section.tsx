"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface ScrollToSectionProps {
  targetId: string
  children: React.ReactNode
}

export function ScrollToSection({ targetId, children }: ScrollToSectionProps) {
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleClick = () => {
    if (isClient) {
      // If we're not on the homepage, navigate there first
      if (pathname !== "/") {
        router.push("/")
        // Set a flag in sessionStorage to scroll after navigation
        sessionStorage.setItem("scrollToTarget", targetId)
      } else {
        // If we're already on the homepage, just scroll
        const targetElement = document.getElementById(targetId)
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
      }
    }
  }

  return (
    <div onClick={handleClick} className="cursor-pointer">
      {children}
    </div>
  )
}
