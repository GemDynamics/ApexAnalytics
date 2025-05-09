import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useState } from "react";

// Verträge abrufen (mit Typisierung)
export function useContracts() {
  const contracts = useQuery(api.contractsQueries.listUserContracts);
  const isLoading = contracts === undefined;
  
  return {
    contracts,
    isLoading
  };
}

// Einzelnen Vertrag nach ID abrufen
export function useContract(contractId: Id<"contracts"> | undefined | "skip") {
  const contract = useQuery(
    api.contractsQueries.getContractById, 
    contractId === "skip" ? "skip" : contractId ? { contractId } : "skip"
  );
  
  return {
    contract,
    isLoading: contract === undefined && contractId !== "skip",
  };
}

// Vertrag erstellen
export function useCreateContract() {
  const createContract = useMutation(api.contractMutations.createContractRecord);
  
  return createContract;
}

// Upload-URL generieren
export function useGenerateUploadUrl() {
  const generateUploadUrl = useMutation(api.contractMutations.generateUploadUrl);
  
  return generateUploadUrl;
}

// Vertrag analysieren
export function useAnalyzeContract() {
  const analyzeContract = useAction(api.contractActions.startFullContractAnalysis);
  
  return analyzeContract;
}

// Datei-Upload über server-side Mutation
export function useUploadFile() {
  const uploadFileAction = useAction(api.contractActions.uploadFileAction);
  
  return uploadFileAction;
}

// Komplette Upload- und Analyse-Funktion
export function useUploadAndAnalyzeContract() {
  const uploadFile = useUploadFile();
  const analyzeContract = useAnalyzeContract();
  
  const uploadAndAnalyze = async (file: File) => {
    try {
      console.log("1. Starte Upload-Prozess");
      
      // Datei als ArrayBuffer für den Upload vorbereiten
      const arrayBuffer = await file.arrayBuffer();
      
      // 1. Datei direkt hochladen und Vertrag erstellen
      console.log("2. Upload der Datei via Convex Action");
      const result = await uploadFile({
        fileName: file.name,
        fileType: file.type,
        fileBuffer: arrayBuffer,
      });
      
      if (!result.success) {
        throw new Error(result.error || "Upload fehlgeschlagen");
      }
      
      const contractId = result.contractId;
      const storageId = result.storageId;
      console.log("3. Vertrag erstellt mit ID:", contractId, "Storage ID:", storageId);
      
      // Überprüfen, ob die IDs definiert sind
      if (!contractId || !storageId) {
        throw new Error("Contract ID oder Storage ID fehlt nach dem Upload");
      }
      
      // 2. Analyse starten
      await analyzeContract({
        contractId: contractId as Id<"contracts">,
        storageId: storageId
      });
      console.log("4. Analyse gestartet");
      
      return { contractId, success: true };
    } catch (error: any) {
      // Detailliertere Fehlerbehandlung
      console.error("Error uploading and analyzing contract:", error);
      let errorMessage = "Upload oder Analyse fehlgeschlagen";
      
      if (error.message) {
        errorMessage = `Fehler: ${error.message}`;
      }
      
      return { success: false, error: errorMessage };
    }
  };
  
  return uploadAndAnalyze;
}

export function useUploadContract() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.contractMutations.generateUploadUrl);
  const createContract = useMutation(api.contractMutations.createContractRecord);

  const upload = async (file: File): Promise<{ contractId: Id<'contracts'>, storageId: Id<'_storage'> } | null> => {
    if (!file) return null;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      console.log("Starting upload process for file:", file.name);
      
      // 1. Generate upload URL and tempId
      console.log("Step 1: Generating upload URL from Convex");
      const uploadData = await generateUploadUrl();
      
      if (!uploadData || !uploadData.uploadUrl || !uploadData.tempId) {
        throw new Error("Failed to generate upload URL from Convex");
      }
      
      console.log("Upload URL obtained:", uploadData.uploadUrl);
      console.log("Temporary ID obtained:", uploadData.tempId);
      
      // 2. Upload file directly to Convex storage
      console.log("Step 2: Uploading file to Convex storage");
      
      // Storage-ID-Variable außerhalb des try-Blocks deklarieren,
      // damit sie im gesamten Funktionsbereich zugänglich ist
      let storageId: Id<'_storage'>;
      
      try {
        const result = await fetch(uploadData.uploadUrl, {
          method: "POST", // Laut Convex-Dokumentation sollte POST verwendet werden
          // Keine unnötigen Header hinzufügen, nur Content-Type
          headers: { 
            "Content-Type": file.type 
          },
          // Die Datei direkt als Body übergeben, ohne Formularfelder
          body: file,
          // Cookies nicht mitsenden
          credentials: 'omit'
        });
        
        if (!result.ok) {
          const responseText = await result.text();
          console.error("Upload Response Status:", result.status);
          console.error("Upload Response Text:", responseText);
          throw new Error(
            `Upload failed with status: ${result.status} ${result.statusText}\n` +
            `Response: ${responseText}`
          );
        }
        
        // Extrahiere die Storage-ID aus der erfolgreichen Antwort
        // Nach Convex-Dokumentation gibt die Upload-API eine JSON-Antwort mit storageId zurück
        const responseData = await result.json();
        console.log("Upload response data:", responseData);
        
        // Die echte Storage-ID aus der Antwort verwenden, wenn verfügbar
        storageId = (responseData && responseData.storageId) 
          ? responseData.storageId 
          : `upload_${uploadData.tempId}` as Id<'_storage'>;
        
        console.log("File uploaded successfully to storage with ID:", storageId);
        
      } catch (uploadError) {
        console.error("Error during upload to storage:", uploadError);
        throw uploadError;
      }
      
      // 3. Create contract record using the storage ID from the upload response
      console.log("Step 3: Creating contract record in database");
      const contractId = await createContract({ 
        fileName: file.name,
        storageId: storageId
      });
      console.log("Contract record created with ID:", contractId);
      
      setUploadProgress(100);
      return { contractId, storageId };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error during upload";
      console.error("Upload error:", errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, uploadProgress, error };
} 