import { mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

// Typ für den Status, um Typsicherheit zu gewährleisten
type ContractStatus = Doc<"contracts">["status"];

// Neue Mutation zum Generieren einer Upload-URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("generateUploadUrl wird aufgerufen");
    
    const identity = await ctx.auth.getUserIdentity();
    console.log("Benutzer-Authentifizierung:", identity ? "Erfolgreich" : "Fehlgeschlagen");
    
    if (!identity) {
      throw new ConvexError("User not authenticated to upload files.");
    }
    
    // Generiere eine signierte URL für den Upload
    try {
      const url = await ctx.storage.generateUploadUrl();
      console.log("Upload-URL erfolgreich generiert:", url);
      return url;
    } catch (error) {
      console.error("Fehler bei der URL-Generierung:", error);
      throw error;
    }
  },
});

// Neue serverbasierte Upload-Methode ohne direkten Browser-Fetch
export const uploadFile = mutation({
  args: {
    fileName: v.string(),
    fileType: v.string(),
    fileBuffer: v.any(), // Verwende v.any() statt v.bytes(), um verschiedene Typen zu akzeptieren
  },
  handler: async (ctx, args) => {
    console.log(`Uploading file: ${args.fileName} (${args.fileType})`);
    
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("User not authenticated to upload files.");
    }
    
    try {
      // Wir verwenden jetzt generateUploadUrl um eine korrekte Storage-ID zu erhalten
      // und dann führen wir den Upload direkt mit dieser URL durch
      const uploadUrl = await ctx.storage.generateUploadUrl();
      console.log("Generated upload URL:", uploadUrl);
      
      // Blob aus dem ArrayBuffer erstellen für den Upload
      let blob;
      if (args.fileBuffer instanceof ArrayBuffer) {
        blob = new Blob([new Uint8Array(args.fileBuffer)]);
      } else if (args.fileBuffer instanceof Uint8Array) {
        blob = new Blob([args.fileBuffer]);
      } else {
        blob = new Blob([args.fileBuffer]);
      }
      
      // Upload zur URL durchführen
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: blob
      });
      
      if (!uploadResult.ok) {
        throw new Error(`Failed to upload file: ${uploadResult.status} ${uploadResult.statusText}`);
      }
      
      // Wir extrahieren die Storage-ID aus der URL
      // Convex-Upload-URLs haben das Format: 
      // https://[project-id].convex.cloud/api/storage/upload/[storageId]?token=[token]
      // oder manchmal ohne 'upload/' Teil
      const urlObj = new URL(uploadUrl);
      const pathParts = urlObj.pathname.split('/');
      
      // Die Storage-ID ist der letzte Teil des Pfades vor den Query-Parametern
      // Wir suchen nach dem letzten Teil, der kein "storage", "api", oder "upload" ist
      let storageId;
      for (let i = pathParts.length - 1; i >= 0; i--) {
        if (pathParts[i] && !['api', 'storage', 'upload', ''].includes(pathParts[i])) {
          storageId = pathParts[i];
          break;
        }
      }
      
      if (!storageId) {
        throw new ConvexError("Failed to extract valid storage ID from upload URL: " + uploadUrl);
      }
      
      console.log(`File uploaded with storageId: ${storageId}`);
      
      // Wir können die Datei nicht validieren, da ctx.storage.get in einer Mutation nicht verfügbar ist
      // Die Validierung erfolgt später in der Action
      
      // Vertrag in der Datenbank erstellen mit der richtigen Storage-ID
      const contractId = await ctx.db.insert("contracts", {
        ownerId: identity.subject,
        fileName: args.fileName,
        storageId: storageId as any, // Cast zur ID
        status: "pending",
        uploadedAt: Date.now(),
        processedChunks: 0,
        totalChunks: 0,
        analysisProtocol: [],
      });
      
      console.log(`Contract record created with ID: ${contractId}`);
      
      return { 
        contractId, 
        storageId: storageId as any 
      };
    } catch (error) {
      console.error("Error during file upload:", error);
      throw new ConvexError(`File upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

export const updateContractStatus = internalMutation({
  args: {
    contractId: v.id("contracts"),
    status: v.string(), // Behalte v.string() für die Argumentvalidierung, aber intern den Typ verwenden
    totalChunks: v.optional(v.number()),
    // processedChunks wird in appendChunkAnalysis verwaltet
  },
  handler: async (ctx, args) => {
    console.log(`Updating status for contract ${args.contractId} to ${args.status}, totalChunks: ${args.totalChunks}`);
    
    const patchData: Partial<Doc<"contracts">> = { 
      status: args.status as ContractStatus, // Typ-Assertion hier
    };

    if (args.totalChunks !== undefined) {
      patchData.totalChunks = args.totalChunks;
    }
    
    if (args.status === "processing" || args.status === "chunking" || args.status === "pending") {
        patchData.analysisProtocol = [];
        patchData.processedChunks = 0;
    }
    await ctx.db.patch(args.contractId, patchData);
  },
});

export const appendChunkAnalysis = internalMutation({
  args: {
    contractId: v.id("contracts"),
    chunkNumber: v.number(),
    totalChunks: v.number(),
    chunkResult: v.array(
      v.object({
        clauseText: v.string(),
        evaluation: v.string(),
        reason: v.string(),
        recommendation: v.string(),
      })
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      console.error(`Contract not found: ${args.contractId} in appendChunkAnalysis`);
      return;
    }

    let newProcessedChunks = (contract.processedChunks || 0) + 1;
    // Stelle sicher, dass analysisProtocol immer ein Array ist
    let currentProtocol: Doc<"contracts">["analysisProtocol"] = contract.analysisProtocol ? [...contract.analysisProtocol] : [];


    if (args.error) {
      console.error(`Error in chunk ${args.chunkNumber} for contract ${args.contractId}: ${args.error}`);
      currentProtocol.push({
        chunkNumber: args.chunkNumber,
        clauseText: `Fehler bei der Analyse von Chunk ${args.chunkNumber}`,
        evaluation: "Fehler",
        reason: args.error,
        recommendation: "Chunk konnte nicht analysiert werden.",
      });
    } else {
      // Stelle sicher, dass chunkResult auch ein Array ist und füge chunkNumber hinzu
      const resultsToAdd = Array.isArray(args.chunkResult) ? args.chunkResult : [];
      resultsToAdd.forEach(r => currentProtocol.push({ ...r, chunkNumber: args.chunkNumber }));
    }

    currentProtocol.sort((a, b) => (a.chunkNumber || 0) - (b.chunkNumber || 0));

    const patchData: Partial<Doc<"contracts">> = {
      analysisProtocol: currentProtocol,
      processedChunks: newProcessedChunks,
    };

    if (newProcessedChunks === contract.totalChunks && contract.totalChunks !== undefined && contract.totalChunks > 0) {
      const hasErrors = currentProtocol.some(entry => entry.evaluation === "Fehler");
      patchData.status = hasErrors ? "failed" : "completed";
      console.log(`All ${contract.totalChunks} chunks processed for contract ${args.contractId}. Final status: ${patchData.status}`);
    } else if (contract.totalChunks !== undefined && newProcessedChunks > contract.totalChunks ){
        console.warn(`Processed chunks (${newProcessedChunks}) exceed total chunks (${contract.totalChunks}) for contract ${args.contractId}. Setting to completed if no errors.`);
        const hasErrors = currentProtocol.some(entry => entry.evaluation === "Fehler");
        patchData.status = hasErrors ? "failed" : "completed"; // Sicherheitsnetz
    } else {
        patchData.status = "processing"; 
    }

    await ctx.db.patch(args.contractId, patchData);
  },
});

export const createContractRecord = mutation({
    args: {fileName: v.string(), storageId: v.id("_storage")},
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("User not authenticated to create a contract.");
        }
        const contractId = await ctx.db.insert("contracts", {
            ownerId: identity.subject, 
            fileName: args.fileName,
            storageId: args.storageId,
            status: "pending",
            uploadedAt: Date.now(),
            processedChunks: 0,
            totalChunks: 0, // Initialwert
            analysisProtocol: [],
        });
        return contractId;
    }
}); 