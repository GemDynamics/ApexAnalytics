import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
          "flex min-h-[100px] w-full rounded-lg border border-input bg-background/80 px-4 py-3 text-base shadow-sm backdrop-blur-sm",
          "ring-offset-background placeholder:text-muted-foreground/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50 focus-visible:shadow-[0_0_15px_hsl(var(--primary)/0.3)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "transition-all duration-300 ease-in-out md:text-sm",
          "hover:border-primary/40 hover:bg-background",
          className
      )}
      ref={ref}
      {...props}
    />
  )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
