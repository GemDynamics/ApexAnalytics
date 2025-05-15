"use client"
import { Moon, Sun, MonitorSmartphone } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Vermeidet Hydration-Fehler
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render a placeholder or null to avoid hydration mismatch
    return <Button variant="ghost" size="icon" className="w-9 h-9 opacity-0" aria-hidden="true" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          rounded="full"
          className="w-10 h-10 border-border/50 hover:border-primary/70 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 group relative overflow-hidden"
          aria-label="Theme wechseln"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-primary group-hover:text-primary/90" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-primary group-hover:text-primary/90" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-card/80 backdrop-blur-md border-border/50 shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-300"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center gap-2.5 cursor-pointer px-3 py-2 hover:bg-primary/10 focus:bg-primary/10 text-foreground hover:text-primary focus:text-primary transition-colors duration-200"
        >
          <Sun className="h-4 w-4 text-primary/80" />
          <span>Hell</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center gap-2.5 cursor-pointer px-3 py-2 hover:bg-primary/10 focus:bg-primary/10 text-foreground hover:text-primary focus:text-primary transition-colors duration-200"
        >
          <Moon className="h-4 w-4 text-primary/80" />
          <span>Dunkel</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center gap-2.5 cursor-pointer px-3 py-2 hover:bg-primary/10 focus:bg-primary/10 text-foreground hover:text-primary focus:text-primary transition-colors duration-200"
        >
          <MonitorSmartphone className="h-4 w-4 text-primary/80" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
