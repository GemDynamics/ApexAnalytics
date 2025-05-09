"use client";

import { Loader2 } from "lucide-react";

interface ApiLoadingProps {
  title?: string;
  description?: string;
}

export function ApiLoading({ title = "Wird geladen", description }: ApiLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
    </div>
  );
} 