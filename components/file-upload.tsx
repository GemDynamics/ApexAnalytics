"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useUploadAndAnalyzeContract } from "@/hooks/useConvex"

export function FileUpload() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // Convex-Hook für Upload und Analyse
  const uploadAndAnalyzeContract = useUploadAndAnalyzeContract();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (
        droppedFile.type === "application/pdf" ||
        droppedFile.type === "application/msword" ||
        droppedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        droppedFile.type === "text/plain" // Unterstützung für txt Dateien
      ) {
        setFile(droppedFile)
      } else {
        setError("Bitte laden Sie nur PDF, Word oder TXT-Dokumente hoch.")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (
        selectedFile.type === "application/pdf" ||
        selectedFile.type === "application/msword" ||
        selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        selectedFile.type === "text/plain" // Unterstützung für txt Dateien
      ) {
        setFile(selectedFile)
      } else {
        setError("Bitte laden Sie nur PDF, Word oder TXT-Dokumente hoch.")
      }
    }
  }

  const removeFile = () => {
    setFile(null)
    setError(null)
  }

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setProgress(10) // Startfortschritt anzeigen

    try {
      // Echter Upload und Analyse über Convex
      const result = await uploadAndAnalyzeContract(file);
      
      // Fortschritt simulieren während der Analyse im Backend
      let currentProgress = 10;
      const interval = setInterval(() => {
        currentProgress += 5;
        setProgress(Math.min(currentProgress, 95)); // Maximal 95%, 100% erst nach Abschluss
        
        if (currentProgress >= 95) {
          clearInterval(interval);
        }
      }, 300);

      if (result.success && result.contractId) {
        // Erfolg - warte einen Moment und leite dann weiter
        setTimeout(() => {
          setProgress(100);
          // Navigiere zur Detailseite oder Analyseseite mit der Vertrags-ID
          router.push(`/analytik/${result.contractId}`);
        }, 1000);
      } else {
        // Wenn result.success false ist, benutze result.error für die Fehlermeldung
        throw new Error(result.error || "Upload oder Analyse fehlgeschlagen. Unbekannter Fehler.");
      }
    } catch (err: any) { // Expliziter Typ für err
      // Verwende err.message, wenn vorhanden, sonst eine generische Meldung
      const errorMessage = err.message || "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.";
      setError(errorMessage);
      setUploading(false);
      setProgress(0); // Fortschritt zurücksetzen
      console.error("Upload error details:", err); // Detailliertere Logausgabe
    }
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-primary/10 rounded-full p-3 mb-4">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">Vertrag hier ablegen oder auswählen</h3>
          <p className="mb-4 text-sm text-muted-foreground">Unterstützte Formate: PDF, DOC, DOCX, TXT</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
              <FileText className="mr-2 h-4 w-4" />
              Datei auswählen
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleFileChange}
            />
          </div>
          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {uploading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vertrag wird hochgeladen und analysiert...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 w-full" />
              <p className="text-xs text-muted-foreground text-center mt-2">
                {progress < 30
                  ? "Vertrag wird hochgeladen..."
                  : progress < 60
                    ? "Klauseln werden analysiert..."
                    : progress < 90
                      ? "Risikobewertung wird durchgeführt..."
                      : "Ergebnisse werden vorbereitet..."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile} className="rounded-full h-8 w-8">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Datei entfernen</span>
                </Button>
              </div>
              <Button className="w-full" onClick={uploadFile}>
                Vertrag hochladen und analysieren
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
