import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ConvexClientProvider } from "../components/convex-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { DashboardShell } from "@/components/dashboard-shell"
import { ClerkProvider } from "@clerk/nextjs"
import { PageTransitionWrapper } from "@/components/animation/page-transition-wrapper"

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
        <body className={cn("min-h-screen font-sans antialiased", inter.className)}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ConvexClientProvider>
              <TooltipProvider>
                <DashboardShell>
                  <PageTransitionWrapper>
                    {children}
                  </PageTransitionWrapper>
                </DashboardShell>
              </TooltipProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
