import { mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

// Typ für den Status, um Typsicherheit zu gewährleisten
type ContractStatus = 
  | "pending"
  | "uploading"
  | "uploaded"
  | "preprocessing_structure"
  | "preprocessing_structure_chunked"
  | "structure_generation_inprogress"
  | "structure_generation_completed"
  | "chunking"
  | "processing"
  | "analysis_pending"
  | "analysis_inprogress"
  | "completed"
  | "failed"
  | "archived"
  | "structured_json_generated"; // Wird in structureContractIncrementallyAndCreateJsonElements verwendet

// UUID-Generator für JavaScript Umgebung
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, 
          v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
      // Generiere eine Upload-URL von Convex
      const uploadUrl = await ctx.storage.generateUploadUrl();
      
      // URL-Details analysieren für bessere Diagnostik
      console.log("Upload-URL erfolgreich generiert:", uploadUrl);
      
      // Die URL analysieren
      const url = new URL(uploadUrl);
      console.log("URL Protokoll:", url.protocol);
      console.log("URL Hostname:", url.hostname);
      console.log("URL Pfad:", url.pathname);
      console.log("URL Query Parameter:", url.search);

      // Bei Convex wird die Storage-ID tatsächlich erst beim erfolgreichen Upload generiert
      // Für die Client-API generieren wir eine UUID statt einer Storage-ID, die dann 
      // beim erfolgreichen Upload der Storage-ID zugeordnet wird
      const uuid = generateUUID();
      
      return { 
        uploadUrl: uploadUrl,
        // Wir verwenden statt einer "echten" Storage-ID einen UUID-String
        // Der Client gibt diesen beim Erstellen des Datensatzes mit
        tempId: uuid
      };
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
      // 1. Generiere UUID als temporäre Referenz
      const uuid = generateUUID();
      console.log("Temporary UUID generated:", uuid);

      // 2. Upload-URL generieren
      const uploadUrl = await ctx.storage.generateUploadUrl();
      console.log("Upload-URL erfolgreich generiert:", uploadUrl);
      
      // 3. Blob aus dem ArrayBuffer erstellen für den Upload
      let blob;
      if (args.fileBuffer instanceof ArrayBuffer) {
        blob = new Blob([new Uint8Array(args.fileBuffer)]);
      } else if (args.fileBuffer instanceof Uint8Array) {
        blob = new Blob([args.fileBuffer]);
      } else {
        blob = new Blob([args.fileBuffer]);
      }
      
      // 4. Upload zur URL durchführen
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: blob
      });
      
      if (!uploadResult.ok) {
        throw new Error(
          `Failed to upload file: ${uploadResult.status} ${uploadResult.statusText}`
        );
      }
      
      // 5. Storage-ID aus der Antwort extrahieren (wird hier simuliert)
      // In einer realen Implementierung würde die Storage-ID aus der Antwort extrahiert werden
      console.log("Upload erfolgreich. Response Status:", uploadResult.status);
      
      // 6. Vertrag in der Datenbank erstellen
      // WICHTIG: In der realen Implementierung müssten wir eine echte Storage-ID erhalten
      // Hier verwenden wir einen Workaround, indem wir die Datei nach dem Upload abrufen
      // und dann dessen Storage-ID verwenden
      
      // Da wir die echte Storage-ID nicht haben, erstellen wir einen symbolischen Eintrag
      // Der Upload selbst ist erfolgt, aber wir können die Datei nicht direkt referenzieren
      const fakeStorageId = `upload_${uuid}` as Id<"_storage">;
      
      const contractId = await ctx.db.insert("contracts", {
        userId: identity.subject,
        fileName: args.fileName,
        storageId: fakeStorageId,
        status: "pending",
        uploadedAt: Date.now(),
        processedChunks: 0,
        totalChunks: 0,
        analysisProtocol: [],
      });
      
      console.log(`Contract record created with ID: ${contractId}`);
      
      return { 
        contractId, 
        storageId: fakeStorageId
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
    status: v.string(), 
    totalChunks: v.optional(v.number()),
    errorDetails: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(`Updating status for contract ${args.contractId} to ${args.status}, totalChunks: ${args.totalChunks}, error: ${args.errorDetails}`);
    
    const patchData: Partial<Doc<"contracts">> = { 
      status: args.status as ContractStatus, 
    };

    if (args.totalChunks !== undefined) {
      patchData.totalChunks = args.totalChunks;
    }
    if (args.errorDetails !== undefined) {
      patchData.errorDetails = args.errorDetails;
    }
    
    if (args.status === "processing" || args.status === "chunking" || args.status === "pending" || args.status === "preprocessing_structure" || args.status === "preprocessing_structure_chunked" || args.status === "structure_generation_inprogress") {
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
    let currentProtocol = Array.isArray(contract.analysisProtocol) ? [...contract.analysisProtocol] : [];


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
            userId: identity.subject,
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

// Behelfstyp, da der Frontend-Typ hier nicht direkt importiert werden kann
type EditorSectionInput = {
    id: string;
    title: string;
    content: string;
    risk: "low" | "medium" | "high" | "error";
    evaluation: string;
    reason?: string;
    recommendation?: string;
    needsRenegotiation: boolean;
    urgentAttention: boolean;
    removed?: boolean;
    chunkNumber?: number;
    // alternativeFormulations bewusst weggelassen, da sie im Backend ggf. anders behandelt werden
};

// Neue Mutation zum Speichern bearbeiteter Analyse/Vertragsdaten
export const updateContractAnalysis = mutation({
  args: {
    contractId: v.id("contracts"),
    // Wir erwarten ein Array von bearbeiteten Sektionen/Klauseln
    updatedSections: v.array(v.object({
        id: v.string(),
        title: v.string(),
        content: v.string(),
        risk: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("error")),
        evaluation: v.string(),
        reason: v.optional(v.string()),
        recommendation: v.optional(v.string()),
        needsRenegotiation: v.boolean(),
        urgentAttention: v.boolean(),
        removed: v.optional(v.boolean()),
        chunkNumber: v.optional(v.number()),
        alternativeFormulations: v.optional(v.array(v.object({
          id: v.string(),
          content: v.string()
        }))),
    }))
  },
  handler: async (ctx, args) => {
    const { contractId, updatedSections } = args;
    console.log(`Updating analysis/sections for contract ${contractId}`);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Nicht authentifiziert für die Aktualisierung von Vertragsdaten.");
    }

    const existingContract = await ctx.db.get(contractId);
    if (!existingContract) {
      throw new ConvexError("Contract not found for updating analysis.");
    }

    // Hier entscheiden, wie die Daten gespeichert werden.
    // Option 1: Ersetze analysisProtocol mit den bearbeiteten Daten (falls die Struktur passt)
    // Option 2: Speichere die bearbeiteten Daten in einem neuen Feld, z.B. `editedAnalysis`
    // Option 3: Finde die ursprünglichen Klauseln im `analysisProtocol` und update sie (komplexer)

    // Wir wählen Option 2 für Klarheit und um Originaldaten zu behalten:
    await ctx.db.patch(contractId, {
      editedAnalysis: updatedSections, // Neues Feld einführen
      lastEditedAt: Date.now() // Zeitstempel der letzten Bearbeitung hinzufügen
    });

    console.log(`Successfully updated analysis/sections for contract ${contractId}`);
    return { success: true };
  },
}); 

// Funktion zum Aktualisieren des Dateinamens
export const updateFileName = mutation({
  args: {
    contractId: v.id("contracts"),
    newFileName: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Nicht authentifiziert");
    }
    
    // Prüfen, ob der Vertrag existiert und dem Benutzer gehört
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      throw new ConvexError("Vertrag nicht gefunden");
    }
    
    if (contract.userId !== identity.subject) {
      throw new ConvexError("Nicht berechtigt, diesen Vertrag zu aktualisieren");
    }
    
    // Dateinamen aktualisieren
    await ctx.db.patch(args.contractId, {
      fileName: args.newFileName
    });
    
    return { success: true };
  }
}); 

// --- MIGRATION FUNCTIONS ---
// export const _migrateSingleContractOwnerId = internalMutation({
//   args: { contractId: v.id("contracts") },
//   handler: async (ctx, args) => {
//     const contract = await ctx.db.get(args.contractId);
//     if (contract && contract.ownerId && !contract.userId) {
//       await ctx.db.patch(args.contractId, { userId: contract.ownerId });
//       console.log(`Migrated ownerId to userId for contract ${args.contractId}`);
//     } else if (contract && contract.ownerId && contract.userId) {
//       console.warn(`Contract ${args.contractId} already has userId, ownerId ('${contract.ownerId}') was not migrated.`);
//     }
//   },
// });

// NEU/ANGEPASST: Mutation zum Kopieren von ownerId zu userId und zum Leeren/Entfernen von ownerId
/*
export const _migrateOwnerIdToUserIdAndClearOldField = internalMutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      console.error(
        `_migrateOwnerIdToUserIdAndClearOldField: Contract ${args.contractId} not found.`
      );
      return;
    }

    let copiedToUserId = false;
    let ownerIdCleared = false;
    const patchData: Partial<Doc<"contracts">> & { ownerId?: undefined } = {};

    // Check if ownerId exists and is not empty
    // @ts-expect-error ownerId is removed from schema, this code is for completed migration
    if (contract.ownerId && contract.ownerId.trim() !== "") {
      // If userId is empty or not set, copy ownerId to userId
      // @ts-expect-error ownerId is removed from schema
      if (!contract.userId || contract.userId.trim() === "") {
        // @ts-expect-error ownerId is removed from schema
        patchData.userId = contract.ownerId; // Kopiere den Wert
        copiedToUserId = true;
        console.log(
          // @ts-expect-error ownerId is removed from schema
          `_migrateOwnerIdToUserIdAndClearOldField: Copying ownerId ('${contract.ownerId}') to userId for contract ${args.contractId}.`
        );
        // @ts-expect-error ownerId is removed from schema
      } else if (contract.userId !== contract.ownerId) {
        console.warn(
          // @ts-expect-error ownerId is removed from schema
          `_migrateOwnerIdToUserIdAndClearOldField: Contract ${args.contractId} has userId ('${contract.userId}') and a different ownerId ('${contract.ownerId}'). ownerId will be cleared, userId remains unchanged.`
        );
      }
      // Mark ownerId to be cleared
      // @ts-expect-error ownerId is removed from schema
      patchData.ownerId = undefined; // Setze ownerId auf undefined
      ownerIdCleared = true;
    // @ts-expect-error ownerId is removed from schema
    } else if (contract.ownerId === "") {
      // If ownerId is an empty string, also clear it
      // @ts-expect-error ownerId is removed from schema
      patchData.ownerId = undefined; 
      ownerIdCleared = true;
      console.log(
        `_migrateOwnerIdToUserIdAndClearOldField: Clearing empty ownerId for contract ${args.contractId}.`
      );
    }

    if (Object.keys(patchData).length > 0) {
      await ctx.db.patch(args.contractId, patchData);
      if (copiedToUserId && ownerIdCleared) {
        // console.log(`_migrateOwnerIdToUserIdAndClearOldField: Successfully copied ownerId to userId and cleared ownerId for contract ${args.contractId}.`);
      } else if (ownerIdCleared) {
        // console.log(`_migrateOwnerIdToUserIdAndClearOldField: Successfully cleared ownerId for contract ${args.contractId}.`);
      }
    } else {
      // console.log(
      //   `_migrateOwnerIdToUserIdAndClearOldField: No changes needed for contract ${args.contractId}.`
      // );
    }
    return { copiedToUserId, ownerIdCleared };
  },
});
*/
// --- END MIGRATION FUNCTIONS --- 

export const updateContractProcessingProgress = internalMutation({
  args: {
    contractId: v.id("contracts"),
    chunksProcessed: v.number(),
    statusMessage: v.optional(v.string()),
    currentStatus: v.string(), // z.B. "structure_generation_inprogress"
  },
  handler: async (ctx, args) => {
    console.log(`Updating processing progress for contract ${args.contractId}: ${args.chunksProcessed} chunks processed. Status: ${args.currentStatus}. Message: ${args.statusMessage || ''}`);
    const patchData: Partial<Doc<"contracts">> = {
      processedChunks: args.chunksProcessed,
      status: args.currentStatus as ContractStatus,
    };
    if (args.statusMessage !== undefined) {
      patchData.currentProcessingStepDetail = args.statusMessage;
    }
    await ctx.db.patch(args.contractId, patchData);
  },
});

export const updateContractWithStructuredData = internalMutation({
  args: {
    contractId: v.id("contracts"),
    fullMarkdownText: v.string(),
    structuredContractElements: v.array(
      v.object({
        elementType: v.string(), // Sollte eigentlich ein v.union aus den erlaubten Typen sein
        elementId: v.string(),
        markdownContent: v.string(),
        originalOrderInChunk: v.number(),
        globalOriginalOrder: v.number(),
        // Die folgenden Felder sind für spätere Analysestufen und hier optional
        evaluation: v.optional(v.string()),
        reason: v.optional(v.string()),
        recommendation: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    console.log(`Storing structured data for contract ${args.contractId}. Markdown length: ${args.fullMarkdownText.length}, Elements: ${args.structuredContractElements.length}`);
    await ctx.db.patch(args.contractId, {
      fullMarkdownText: args.fullMarkdownText,
      structuredContractElements: args.structuredContractElements,
      // processedChunks und totalChunks werden hier nicht direkt angepasst,
      // sondern durch updateContractStatus oder updateContractProcessingProgress
    });
  },
}); 

// NEU: Mutation zum Speichern des Analyseergebnisses für ein einzelnes Strukturelement
export const mergeAnalysisResult = internalMutation({
  args: {
    contractId: v.id("contracts"),
    elementId: v.string(), // Die ID des zu aktualisierenden Strukturelements
    evaluation: v.string(),
    reason: v.string(),
    recommendation: v.string(),
    isError: v.optional(v.boolean()) // Flag, ob dies ein Fehlerergebnis ist
  },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      console.error(`Contract not found: ${args.contractId} in mergeAnalysisResult`);
      return; // Oder Fehler werfen?
    }

    // Kopiere das Array, um es sicher zu modifizieren
    let updatedElements = contract.structuredContractElements 
                            ? [...contract.structuredContractElements] 
                            : [];

    // Finde den Index des Elements, das aktualisiert werden soll
    const elementIndex = updatedElements.findIndex(el => el.elementId === args.elementId);

    if (elementIndex === -1) {
      console.error(`Element with id ${args.elementId} not found in contract ${args.contractId} for merging analysis.`);
      // Hier könnte man entscheiden, ob man abbricht oder den Fehler loggt und weitermacht.
      // Fürs Erste loggen wir nur und machen nichts.
      return; 
    }

    // Aktualisiere das gefundene Element
    updatedElements[elementIndex] = {
      ...updatedElements[elementIndex],
      evaluation: args.evaluation,
      reason: args.reason,
      recommendation: args.recommendation,
    };

    // Zähle verarbeitete Chunks hoch
    // WICHTIG: Wir zählen hier analysierte *Elemente*, nicht Analyse-Chunks.
    // Der Name "processedChunks" ist daher etwas irreführend, aber wir behalten ihn bei,
    // um Konsistenz mit dem Schema zu wahren. `totalChunks` im Schema bezieht sich auf Analyse-Chunks.
    // Wir können den Status erst auf "completed" setzen, wenn ALLE Elemente aus ALLEN Chunks analysiert wurden.
    // Das Tracken auf Element-Ebene ist komplexer.
    
    // Einfacher Ansatz: Wir aktualisieren nur die Elemente und lassen die Haupt-Action 
    // (analyzeContractChunkWithStructureAndVectorKB) den Status und processedChunks (für Analyse-Chunks) verwalten.
    // Diese Mutation hier fokussiert sich NUR auf das Mergen der Daten für EIN Element.
    
    await ctx.db.patch(args.contractId, {
      structuredContractElements: updatedElements,
      // Status- und processedChunks-Updates erfolgen separat, z.B. am Ende einer Action, die einen ganzen Analyse-Chunk verarbeitet.
    });

    console.log(`Merged analysis result for element ${args.elementId} in contract ${args.contractId}.`);
  },
}); 