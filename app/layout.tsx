import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ConvexClientProvider } from "../components/convex-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  // icons: [
  //   {
  //     url: "/logo.svg",
  //     href: "/logo.svg",
  //   },
  // ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="de" suppressHydrationWarning>
        <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ConvexClientProvider>
              <TooltipProvider>
                <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
                    {/* Linke Seite - leer für Logo oder Navigation */}
                    <div className="flex items-center gap-2">
                      {/* Hier könnte ein Logo oder Navigationselemente kommen */}
                    </div>
                    
                    {/* Rechte Seite - Auth-Buttons und Theme-Toggle */}
                    <div className="flex items-center gap-2">
                      <SignedOut>
                        {/* Theme-Toggle vor den Auth-Buttons */}
                        <ThemeToggle />
                        <SignInButton />
                        <SignUpButton />
                      </SignedOut>
                      <SignedIn>
                        <ThemeToggle />
                        <UserButton afterSignOutUrl="/" />
                      </SignedIn>
                    </div>
                  </div>
                </header>
                <main className="flex-1">{children}</main>
              </TooltipProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
