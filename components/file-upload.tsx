"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useUploadContract, useAnalyzeContract } from "@/hooks/useConvex"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function FileUpload() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload, isUploading, uploadProgress, error } = useUploadContract()
  const analyzeContract = useAnalyzeContract()

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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      
      // Validiere Dateityp
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(droppedFile.type)) {
        toast({
          title: "Ungültiges Dateiformat",
          description: "Bitte lade eine PDF, DOCX oder TXT Datei hoch.",
          variant: "destructive",
        })
        return
      }
      
      // Validiere Dateigröße (max 10MB)
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Datei zu groß",
          description: "Die maximale Dateigröße beträgt 10MB.",
          variant: "destructive",
        })
        return
      }
      
      setFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      
      // Validiere Dateityp
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Ungültiges Dateiformat",
          description: "Bitte lade eine PDF, DOCX oder TXT Datei hoch.",
          variant: "destructive",
        })
        return
      }
      
      // Validiere Dateigröße (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Datei zu groß",
          description: "Die maximale Dateigröße beträgt 10MB.",
          variant: "destructive",
        })
        return
      }
      
      setFile(selectedFile)
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return

    try {
      setIsLoading(true)
      
      // Schritt 1: Datei hochladen und Datensatz erstellen
      const result = await upload(file)
      
      if (!result || error) {
        toast({
          title: "Upload fehlgeschlagen",
          description: error || "Der Datei-Upload konnte nicht abgeschlossen werden.",
          variant: "destructive",
        })
        return
      }
      
      // Erfolgreich hochgeladen
      toast({
        title: "Upload erfolgreich",
        description: "Deine Datei wurde hochgeladen. Die Analyse wird gestartet...",
        variant: "default",
      })
      
      // Schritt 2: Analyse starten
      try {
        await analyzeContract({ 
          contractId: result.contractId, 
          storageId: result.storageId 
        })
        toast({
          title: "Analyse gestartet",
          description: "Die Vertragsanalyse läuft im Hintergrund.",
          variant: "default",
        })
      } catch (analyzeError) {
        console.error("Failed to start analysis:", analyzeError)
        toast({
          title: "Fehler beim Start der Analyse",
          description: analyzeError instanceof Error ? analyzeError.message : "Die Analyse konnte nicht gestartet werden.",
          variant: "destructive",
        })
        // Hier nicht unbedingt abbrechen, Weiterleitung kann trotzdem sinnvoll sein
      }

      // Schritt 3: Weiterleitung zur Analyse-Seite
      router.push(`/analytik/${result.contractId}`)
      
    } catch (err) {
      console.error("Upload error:", err)
      toast({
        title: "Upload fehlgeschlagen",
        description: err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="file">Vertrag hochladen</Label>
        <Input
          ref={fileInputRef}
          id="file"
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={isLoading || isUploading}
          required
        />
        <p className="text-sm text-muted-foreground">
          Unterstützte Dateiformate: PDF, DOCX, TXT (max. 10MB)
        </p>
      </div>

      {file && (
        <div className="flex items-center space-x-2">
          <p className="text-sm">
            <span className="font-medium">Ausgewählte Datei:</span> {file.name}
          </p>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            disabled={isLoading || isUploading}
          >
            Ändern
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <p className="text-sm text-muted-foreground mt-1">
            Upload: {uploadProgress}%
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={!file || isLoading || isUploading}>
          {isLoading || isUploading ? "Wird hochgeladen..." : "Vertrag analysieren"}
        </Button>
      </div>
    </form>
  )
}
