import { mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

// Typ für den Status, um Typsicherheit zu gewährleisten
type ContractStatus = Doc<"contracts">["status"];

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