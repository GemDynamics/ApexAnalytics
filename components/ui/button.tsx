import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transform hover:scale-[1.03] active:scale-[0.98] shadow-lg hover:shadow-primary/30",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 transform hover:scale-[1.03] active:scale-[0.98] shadow-lg hover:shadow-destructive/30",
        outline:
          "border border-input bg-transparent hover:bg-accent/10 hover:text-accent active:bg-accent/20 transform hover:scale-[1.03] active:scale-[0.98] hover:shadow-md hover:shadow-accent/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 transform hover:scale-[1.03] active:scale-[0.98] shadow-lg hover:shadow-secondary/30",
        ghost:
          "hover:bg-accent/10 hover:text-accent active:bg-accent/20 transform hover:scale-[1.03] active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary/80 active:text-primary/70 transform hover:scale-[1.02] active:scale-[0.98]",
        brand_gradient:
          "text-white bg-brand-gradient bg-size-animated animate-rolling-gradient hover:shadow-[0_0_20px_hsl(var(--primary)/0.5),_0_0_30px_hsl(var(--secondary)/0.4)] active:shadow-[0_0_10px_hsl(var(--primary)/0.4)] transform hover:scale-[1.03] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4 rounded-md",
        lg: "h-12 px-8 rounded-lg text-base",
        icon: "h-10 w-10",
      },
      rounded: {
        default: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
      glowIntensity: {
        none: "",
        subtle: "shadow-[0_0_8px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_12px_hsl(var(--primary)/0.4)]",
        medium: "shadow-[0_0_12px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)]",
        strong: "animate-button-hover-glow", // Uses keyframe animation
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
      glowIntensity: "none",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, glowIntensity, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, rounded, glowIntensity, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
