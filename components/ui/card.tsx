import * as React from "react"

import { cn } from "@/lib/utils"

const CardRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    interactive?: boolean;
    glowOnHover?: boolean;
    gradientBorder?: boolean;
    padding?: "default" | "sm" | "none";
  }
>(
  ({ className, interactive, glowOnHover, gradientBorder, padding = "default", ...props }, ref) => {
    const paddingClass = {
      default: "p-6",
      sm: "p-4",
      none: "p-0",
    }[padding];

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border bg-card text-card-foreground shadow-xl transition-all duration-300 ease-in-out",
          interactive &&
            "hover:scale-[1.02] hover:shadow-2xl dark:hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] light:hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]",
          glowOnHover &&
            "hover:border-primary/50 dark:hover:shadow-[0_0_25px_hsl(var(--primary)/0.25)] light:hover:shadow-[0_0_15px_hsl(var(--primary)/0.15)]",
          gradientBorder &&
            "border-transparent bg-clip-padding relative before:absolute before:inset-0 before:-m-px before:rounded-[inherit] before:bg-brand-gradient before:z-[-1]",
          paddingClass,
          className
        )}
        {...props}
      />
    );
  }
);
CardRoot.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 /*padding handled by CardRoot*/", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight group-hover:text-primary transition-colors duration-300",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("/*padding handled by CardRoot*/", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center /*padding handled by CardRoot, typically mt-auto if needed*/", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  CardRoot as Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
