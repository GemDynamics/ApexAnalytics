"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, FileText, UploadCloud, Loader2 } from "lucide-react"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Doc } from "@/convex/_generated/dataModel"
import { AuthRedirectLink } from "@/components/auth-redirect-link"

// Typ direkt aus Doc verwenden
type ContractStatusType = Doc<"contracts">["status"];

// Komponente für einzelne Vertrags-Items
function ContractItem({ contract }: { contract: Doc<"contracts"> }) {
  const getStatusBadge = (status: ContractStatusType) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Abgeschlossen</Badge>
      case "preprocessing_structure":
      case "stage1_chunking_inprogress":
      case "stage2_structuring_inprogress":
      case "stage3_analysis_inprogress":
        return <Badge variant="secondary" className="animate-pulse">In Bearbeitung</Badge>
      case "pending":
        return <Badge variant="outline">Ausstehend</Badge>
      case "failed":
      case "stage1_chunking_failed":
      case "stage2_structuring_failed":
      case "failed_partial_analysis":
        return <Badge variant="destructive">Fehlgeschlagen</Badge>
      case "archived":
        return <Badge variant="outline">Archiviert</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Link href={`/analytik/${contract._id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" title={contract.fileName}>{contract.fileName || 'Unbenannter Vertrag'}</p>
            <p className="text-xs text-muted-foreground">
              Hochgeladen: {contract.uploadedAt ? new Date(contract.uploadedAt).toLocaleDateString('de-DE') : 'Unbekannt'}
            </p>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          {getStatusBadge(contract.status)}
        </div>
      </div>
    </Link>
  )
}

// Upload-Komponente
function ContractUploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const generateUploadUrl = useMutation(api.contractMutations.generateUploadUrl)
  const createContractRecord = useMutation(api.contractMutations.createContractRecord)
  const startAnalysisAction = useAction(api.contractActions.startFullContractAnalysis)
  const router = useRouter()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validierung (Typ, Größe)
      const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
      if (!allowedTypes.includes(file.type)) {
        toast.error("Ungültiger Dateityp. Bitte PDF, DOCX oder TXT hochladen.")
        setSelectedFile(null)
        event.target.value = "" // Reset file input
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10 MB
        toast.error("Datei zu groß. Maximal 10MB erlaubt.")
        setSelectedFile(null)
        event.target.value = "" // Reset file input
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.info("Bitte wählen Sie zuerst eine Datei aus.")
      return
    }

    setIsUploading(true)
    const uploadToastId = toast.loading("Datei wird hochgeladen...")

    try {
      // 1. Upload URL von Convex holen
      const postUrl = await generateUploadUrl({})

      // 2. Datei zur URL hochladen
      const result = await fetch(postUrl.uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      })
      const { storageId } = await result.json()

      if (!result.ok || !storageId) {
        throw new Error(`Upload fehlgeschlagen: ${result.statusText}`)
      }
      const typedStorageId = storageId as Id<"_storage"> // Type assertion for clarity

      toast.loading("Vertrag wird in der Datenbank gespeichert...", { id: uploadToastId })

      // 3. Contract Record in DB erstellen
      const contractId = await createContractRecord({ 
        fileName: selectedFile.name, 
        storageId: typedStorageId 
      })

      toast.loading("Vertragsanalyse wird gestartet...", { id: uploadToastId })
      
      // 4. Analyse-Action starten (asynchron) mit contractId und storageId
      await startAnalysisAction({ 
        contractId: contractId, 
        storageId: typedStorageId 
      })

      toast.success("Vertrag erfolgreich hochgeladen und Analyse gestartet!", { id: uploadToastId })
      setSelectedFile(null)
      // Optional: Direkt zur Analyse-Seite weiterleiten?
      // router.push(`/analytik/${contractId}`); 
       // Aktuell nicht, damit der User sieht, dass der Upload ok war.

    } catch (error) {
      console.error("Fehler beim Hochladen:", error)
      toast.error("Fehler beim Hochladen.", { 
        id: uploadToastId,
        description: error instanceof Error ? error.message : "Unbekannter Fehler"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="bg-muted/30 dark:bg-muted/10 border-dashed border-primary/30">
      <CardHeader>
        <CardTitle className="text-lg">Neuen Vertrag analysieren</CardTitle>
        <CardDescription>
          Laden Sie einen Vertrag hoch, um eine detaillierte Risikoanalyse zu erhalten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-4 border rounded-md bg-background">
            <label htmlFor="file-upload" className="flex-grow cursor-pointer">
              <span className="text-sm font-medium">
                {selectedFile ? selectedFile.name : "Datei auswählen"}
              </span>
              <input 
                id="file-upload" 
                name="file-upload" 
                type="file" 
                className="sr-only" 
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                disabled={isUploading}
              />
            </label>
            {!selectedFile && <span className="text-sm text-muted-foreground">Keine Datei ausgewählt</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            Unterstützte Dateiformate: PDF, DOCX, TXT (max. 10MB)
          </p>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="gap-2">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" /> 
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            <span>{isUploading ? "Wird hochgeladen..." : "Hochladen & Analysieren"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Haupt-Dashboard Komponente
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-card rounded-2xl shadow-xl p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-foreground">
          KI-gestützte Vertragsanalyse
        </h1>
        
        <p className="text-lg text-muted-foreground text-center mb-10">
          Analysieren Sie Verträge schnell und präzise mit unserem intelligenten System,
          das auf neuesten KI-Technologien und juristischen Wissensbasen basiert.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-muted p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-primary">
              Strukturierte Analyse
            </h2>
            <p className="text-muted-foreground mb-4">
              Unser System wandelt unstrukturierte Vertragstexte in strukturierte Elemente um
              und ermöglicht eine detaillierte Klausel-für-Klausel-Analyse.
            </p>
          </div>
          
          <div className="bg-muted p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-green-600 dark:text-green-400">
              Juristische Expertise
            </h2>
            <p className="text-muted-foreground mb-4">
              Mit einer umfangreichen Wissensbasis aus deutscher und österreichischer Rechtsprechung
              werden kritische Klauseln zuverlässig identifiziert.
            </p>
          </div>
          
          <div className="bg-muted p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-purple-600 dark:text-purple-400">
              Klauseloptimierung
            </h2>
            <p className="text-muted-foreground mb-4">
              Alternative Klauselformulierungen werden vorgeschlagen und können mit
              KI-Unterstützung weiter optimiert werden.
            </p>
          </div>
          
          <div className="bg-muted p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-amber-600 dark:text-amber-400">
              Ampelsystem
            </h2>
            <p className="text-muted-foreground mb-4">
              Klauseln werden nach dem Ampelprinzip kategorisiert: Rot (kritisch),
              Gelb (verhandelbar) und Grün (akzeptabel).
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <AuthRedirectLink 
            href="/neue-analyse"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg text-lg text-center transition-all"
          >
            Neue Analyse starten
          </AuthRedirectLink>
          
          <Link 
            href="/demo"
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-3 px-6 rounded-lg text-lg text-center transition-all"
          >
            Demo ansehen
          </Link>
        </div>
      </div>
    </main>
  );
}
