"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-card/80 backdrop-blur-lg border border-border/60 rounded-lg shadow-xl", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1.5 relative items-center",
        caption_label: "text-sm font-medium text-foreground tracking-wide",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 border-border/80 hover:bg-accent/50 hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring"
        ),
        nav_button_previous: "absolute left-2",
        nav_button_next: "absolute right-2",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mt-1",
        head_cell:
          "text-muted-foreground/90 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/30 [&:has([aria-selected])]:bg-accent/80 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring rounded-md"
        ),
        day_range_end: "day-range-end rounded-r-md",
        day_selected:
          "bg-brand-gradient text-primary-foreground hover:opacity-95 focus:bg-brand-gradient focus:text-primary-foreground rounded-md",
        day_today: "bg-accent/70 text-accent-foreground ring-1 ring-accent rounded-md",
        day_outside:
          "day-outside text-muted-foreground/60 aria-selected:bg-accent/20 aria-selected:text-muted-foreground/80 rounded-md",
        day_disabled: "text-muted-foreground/40 opacity-50 cursor-not-allowed rounded-md",
        day_range_middle:
          "aria-selected:bg-accent/60 aria-selected:text-accent-foreground rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
