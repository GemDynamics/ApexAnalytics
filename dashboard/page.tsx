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

// Komponente für einzelne Vertrags-Items
function ContractItem({ contract }: { contract: any }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Abgeschlossen</Badge>
      case "processing":
      case "chunking":
        return <Badge variant="secondary" className="animate-pulse">In Bearbeitung</Badge>
      case "pending":
        return <Badge variant="outline">Ausstehend</Badge>
      case "failed":
        return <Badge variant="destructive">Fehlgeschlagen</Badge>
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
            <p className="text-sm font-medium truncate" title={contract.fileName}>{contract.fileName}</p>
            <p className="text-xs text-muted-foreground">
              Hochgeladen: {new Date(contract.uploadedAt).toLocaleDateString('de-DE')}
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
export default function HomePage() {
  const contracts = useQuery(api.contractsQueries.listUserContracts)

  return (
    <div className="container mx-auto py-8 px-4 max-w-screen-lg">
      {/* Header der Seite (nicht der App-Header) */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Vertragsanalyse Dashboard</h1>
        <p className="text-muted-foreground">
          Übersicht Ihrer Vertragsanalysen und Risikobewertungen
        </p>
      </div>

      {/* Hauptinhalt in zwei Spalten oder untereinander */}
      <div className="grid grid-cols-1 gap-8">
        {/* Letzte Analysen */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Analysen</CardTitle>
            <CardDescription>
              Ihre zuletzt hochgeladenen und analysierten Verträge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contracts === undefined && (
                // Ladezustand
                <div className="space-y-3">
                  <div className="h-16 bg-muted rounded-lg animate-pulse"></div>
                  <div className="h-16 bg-muted rounded-lg animate-pulse"></div>
                  <div className="h-16 bg-muted rounded-lg animate-pulse"></div>
                </div>
              )}
              {contracts && contracts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Noch keine Verträge analysiert.
                </p>
              )}
              {contracts && contracts.map((contract) => (
                <ContractItem key={contract._id} contract={contract} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Neuer Vertrag analysieren */}
        <ContractUploadForm />

      </div>
    </div>
  )
}
