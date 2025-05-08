import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

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