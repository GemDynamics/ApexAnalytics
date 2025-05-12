import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Hilfsfunktion zum Entfernen der Dateiendung
export function stripFileExtension(filename: string | undefined): string {
  if (!filename) return "UnbenannterVertrag";
  const lastDot = filename.lastIndexOf('.');
  // Keine Endung gefunden oder Punkt am Anfang (versteckte Datei)
  if (lastDot === -1 || lastDot === 0) return filename; 
  return filename.substring(0, lastDot);
}
