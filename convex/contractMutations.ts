import { mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

// Typ für den Status, um Typsicherheit zu gewährleisten - Aktualisiert für 3-Stufen-Architektur
type ContractStatus = 
  | "pending" // Datei hochgeladen, wartet auf Verarbeitung
  | "uploading" // Nicht mehr direkt verwendet? Client-seitiger Status
  | "uploaded" // Nicht mehr direkt verwendet? Client-seitiger Status
  | "preprocessing_structure" // Textextraktion läuft
  // Stage 1
  | "stage1_chunking_inprogress"
  | "stage1_chunking_completed"
  | "stage1_chunking_failed"
  // Stage 2
  | "stage2_structuring_inprogress"
  | "stage2_structuring_completed" 
  | "stage2_structuring_failed" 
  // Stage 3
  | "stage3_analysis_inprogress"
  | "completed" // Stage 3 erfolgreich abgeschlossen
  | "failed_partial_analysis" // Stage 3 mit Fehlern abgeschlossen
  // Allgemeiner Fehlerstatus
  | "failed" 
  // Sonstiges
  | "archived";
  // Veraltete Status entfernt: preprocessing_structure_chunked, structure_generation_*, chunking, processing, analysis_pending, analysis_inprogress, structured_json_generated

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
    fileBuffer: v.any(), 
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
        // Keine veralteten Felder mehr hier
        totalLargeChunks: 0, 
        structuredLargeChunks: 0,
        totalElementsToAnalyze: 0,
        analyzedElements: 0,
        largeChunks: [],
        structuredContractElements: [],
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
    status: v.string(), // Behalte string bei, Validierung erfolgt im Code
    // totalChunks entfernt
    errorDetails: v.optional(v.string()),
    // Zusätzliche Argumente für Fortschritts-Reset oder Initialisierung (optional)
    resetProgress: v.optional(v.boolean()),
    totalLargeChunks: v.optional(v.number()), // Für Initialisierung bei stage1_chunking_completed
    totalElementsToAnalyze: v.optional(v.number()), // Für Initialisierung bei stage2_structuring_completed
    currentProcessingStepDetail: v.optional(v.string()) // Neues optionales Feld
  },
  handler: async (ctx, args) => {
    // Validierung des Status gegen den definierten Typ
    const validStatuses: ContractStatus[] = [
        "pending", "uploading", "uploaded", "preprocessing_structure", 
        "stage1_chunking_inprogress", "stage1_chunking_completed", "stage1_chunking_failed",
        "stage2_structuring_inprogress", "stage2_structuring_completed", "stage2_structuring_failed",
        "stage3_analysis_inprogress", "completed", "failed_partial_analysis", "failed", "archived"
    ];
    if (!validStatuses.includes(args.status as ContractStatus)) {
        console.error(`Invalid status provided to updateContractStatus: ${args.status}`);
        // Optional: Fehler werfen oder loggen und abbrechen
        throw new ConvexError(`Invalid status provided: ${args.status}`);
    }
    
    console.log(`Updating status for contract ${args.contractId} to ${args.status}, error: ${args.errorDetails}, step: ${args.currentProcessingStepDetail}`);
    
    const patchData: Partial<Doc<"contracts">> = { 
      status: args.status as ContractStatus, 
    };

    // Veraltete Zuweisung entfernt: totalChunks
    if (args.errorDetails !== undefined) {
      patchData.errorDetails = args.errorDetails;
    }
    if (args.currentProcessingStepDetail !== undefined) {
        patchData.currentProcessingStepDetail = args.currentProcessingStepDetail;
    }

    // Fortschritt zurücksetzen, wenn explizit angefordert oder bei bestimmten Statusübergängen
    const shouldResetProgress = args.resetProgress || [
        "pending", 
        "preprocessing_structure", // Beim Start der Textextraktion
        "stage1_chunking_inprogress", // Beim Start von Stufe 1
        "stage2_structuring_inprogress", // Beim Start von Stufe 2
        "stage3_analysis_inprogress" // Beim Start von Stufe 3
    ].includes(args.status as ContractStatus);

    if (shouldResetProgress) {
        // Setze die relevanten Zähler zurück
        patchData.structuredLargeChunks = 0;
        patchData.analyzedElements = 0;
        // Optional: Auch die Arrays leeren? Hängt von der Logik ab, ob sie überschrieben werden.
        // patchData.structuredContractElements = []; 
        // patchData.largeChunks = [];
        console.log(`Progress counters reset for contract ${args.contractId} due to status ${args.status} or resetProgress flag.`);
    }
    
    // Initialisiere Gesamtzahlen, wenn sie übergeben werden (z.B. nach Abschluss einer Stufe)
    if (args.totalLargeChunks !== undefined) {
        patchData.totalLargeChunks = args.totalLargeChunks;
    }
     if (args.totalElementsToAnalyze !== undefined) {
        patchData.totalElementsToAnalyze = args.totalElementsToAnalyze;
    }
    
    // Veraltete Felder nicht mehr zurücksetzen: analysisProtocol, processedChunks
    
    await ctx.db.patch(args.contractId, patchData);
  },
});

/* --- VERALTETE MUTATIONEN (auskommentiert nach Implementierung der neuen Stufen) ---

// VERALTET: Nutzt analysisProtocol, processedChunks, totalChunks
// export const appendChunkAnalysis = internalMutation({
//   args: {
//     contractId: v.id("contracts"),
//     chunkNumber: v.number(),
//     totalChunks: v.number(),
//     chunkResult: v.array(
//       v.object({
//         clauseText: v.string(),
//         evaluation: v.string(),
//         reason: v.string(),
//         recommendation: v.string(),
//       })
//     ),
//     error: v.optional(v.string()),
//   },
//   handler: async (ctx, args) => {
//     // ... alter Code ...
//     console.log("VERALTETE MUTATION: appendChunkAnalysis");
//   },
// });

// VERALTET: Ruft alte createAnalysisChunksFromStructuredElements auf
// export const storeStructuredElementsAndTriggerAnalysis = internalMutation({
//   args: {
//     contractId: v.id("contracts"),
//     structuredElements: v.array(v.any()), // Typ war hier schon unspezifisch
//     fullMarkdownText: v.string(),
//   },
//   handler: async (ctx, args) => {
//     // ... alter Code ...
//     console.log("VERALTETE MUTATION: storeStructuredElementsAndTriggerAnalysis");
//   }
// });

// VERALTET: Verwendet processedChunks
// export const updateProcessedChunks = internalMutation({
//     args: {
//         contractId: v.id("contracts"),
//         processedChunks: v.number(),
//     },
//     handler: async (ctx, args) => {
//         // ... alter Code ...
//         console.log("VERALTETE MUTATION: updateProcessedChunks");
//     }
// });

// VERALTET: Wurde durch finalizeAnalysis ersetzt
// Typ für das Ergebnis-Objekt, das die Bulk-Mutation erwartet
// type ElementAnalysisResultInput = { ... };
// export const bulkMergeAnalysisResults = internalMutation({ ... });

--- ENDE VERALTETE MUTATIONEN ---
*/

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
            status: "pending", // Startstatus
            uploadedAt: Date.now(),
            // Veraltete Felder entfernt: processedChunks, totalChunks, analysisProtocol
            // Neue Felder initialisieren
            totalLargeChunks: 0, 
            structuredLargeChunks: 0,
            totalElementsToAnalyze: 0,
            analyzedElements: 0,
            largeChunks: [], // Initial leeres Array für Stufe 1 Ergebnisse
            structuredContractElements: [], // Initial leeres Array für Stufe 2/3 Ergebnisse
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

// VERALTET: updateContractProcessingProgress - ist korrekt auskommentiert
/*
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
*/

export const updateContractWithStructuredData = internalMutation({
  args: {
    contractId: v.id("contracts"),
    fullMarkdownText: v.string(),
    structuredContractElements: v.array(
      v.object({
        elementType: v.string(), 
        elementId: v.string(),
        markdownContent: v.string(),
        originalOrderInChunk: v.number(),
        globalChunkNumber: v.number(), // Feld hinzugefügt
        globalOriginalOrder: v.number(),
        // Die folgenden Felder sind für spätere Analysestufen und hier optional
        evaluation: v.optional(v.string()),
        reason: v.optional(v.string()),
        recommendation: v.optional(v.string()),
        // Füge isError und errorMessage hinzu, um dem Schema zu entsprechen
        isError: v.optional(v.boolean()),
        errorMessage: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    console.log(`Storing structured data for contract ${args.contractId}. Markdown length: ${args.fullMarkdownText.length}, Elements: ${args.structuredContractElements.length}`);
    await ctx.db.patch(args.contractId, {
      fullMarkdownText: args.fullMarkdownText,
      structuredContractElements: args.structuredContractElements,
      // Fortschrittsfelder (processedChunks, totalChunks) werden nicht mehr hier gesetzt
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

// Typdefinition für die Analyseergebnisse, die von Stufe 3 kommen
const analysisResultInputSchema = v.object({
    elementId: v.string(),
    evaluation: v.string(),
    reason: v.string(),
    recommendation: v.string(),
    isError: v.boolean(),
    errorMessage: v.optional(v.string())
});

// NEUE Mutation zum Zusammenführen der Analyseergebnisse aus Stufe 3 und Abschließen des Prozesses
export const finalizeAnalysis = internalMutation({
    args: {
        contractId: v.id("contracts"),
        analysisResults: v.array(analysisResultInputSchema), // Array der Ergebnisse für jedes Element
        stage3Errors: v.optional(v.array(v.string())), // Optionale Liste von Fehlermeldungen aus Stufe 3
    },
    handler: async (ctx, args) => {
        console.log(`Finalizing analysis for contract ${args.contractId} with ${args.analysisResults.length} element results.`);

        const contract = await ctx.db.get(args.contractId);
        if (!contract) {
            console.error(`Contract ${args.contractId} not found in finalizeAnalysis.`);
            return; // Nicht fatal
        }

        if (!contract.structuredContractElements) {
             console.error(`Contract ${args.contractId} has no structured elements to merge analysis results into.`);
            // Setze Status auf Fehler, da etwas schiefgelaufen sein muss
            await ctx.db.patch(args.contractId, {
                status: "failed", // Generischer Fehler
                errorDetails: (contract.errorDetails || "") + "\nError in finalizeAnalysis: structuredContractElements missing.",
                currentProcessingStepDetail: "Finalizing Analysis FAILED (No elements)"
            });
            return;
        }

        // 1. Erstelle eine Map der Analyseergebnisse für schnellen Zugriff via elementId
        const resultsMap = new Map<string, typeof args.analysisResults[0]>();
        for (const result of args.analysisResults) {
            resultsMap.set(result.elementId, result);
        }

        // 2. Merge Analyseergebnisse in structuredContractElements
        let updatedElements = contract.structuredContractElements.map((element: any) => {
            const analysis = resultsMap.get(element.elementId);
            if (analysis) {
                return {
                    ...element,
                    evaluation: analysis.evaluation,
                    reason: analysis.reason,
                    recommendation: analysis.recommendation,
                    isError: analysis.isError,
                    errorMessage: analysis.errorMessage
                };
            }
            return element;
        });

        // 3. Finalen Status bestimmen
        let finalStatus: Doc<"contracts">["status"] = "completed";
        let errorDetails = contract.errorDetails || "";
        const analyzedCount = args.analysisResults.length; // Anzahl der zurückgegebenen Ergebnisse
        const elementsWithError = args.analysisResults.filter(r => r.isError).length;

        if (args.stage3Errors && args.stage3Errors.length > 0) {
            finalStatus = "failed_partial_analysis";
            errorDetails += `\nStage 3 Orchestration Errors: ${args.stage3Errors.join("; ")}`;
        } else if (elementsWithError > 0) {
             finalStatus = "failed_partial_analysis";
             errorDetails += `\nStage 3 Analysis Errors: ${elementsWithError} elements failed analysis (see error fields in elements).`;
        }
        
        if (analyzedCount !== contract.totalElementsToAnalyze) {
             console.warn(`Mismatch in element count during finalizeAnalysis for ${args.contractId}. Expected ${contract.totalElementsToAnalyze}, got ${analyzedCount} results.`);
             if (finalStatus === "completed") { 
                 finalStatus = "failed_partial_analysis";
                 errorDetails += `\nStage 3 Warning: Element count mismatch (Expected ${contract.totalElementsToAnalyze}, Got ${analyzedCount}).`;
             }
        }

        console.log(`Final status for contract ${args.contractId}: ${finalStatus}. Analyzed: ${analyzedCount}, Errors: ${elementsWithError}.`);

        // 4. Update durchführen
        await ctx.db.patch(args.contractId, {
            structuredContractElements: updatedElements,
            analyzedElements: analyzedCount - elementsWithError, // Anzahl erfolgreich analysierter Elemente
            status: finalStatus,
            errorDetails: errorDetails.trim(),
            currentProcessingStepDetail: `Analysis finished. Status: ${finalStatus}. ${analyzedCount - elementsWithError}/${contract.totalElementsToAnalyze || analyzedCount} elements analyzed successfully.`
        });

        console.log(`Contract ${args.contractId} analysis finalized.`);
    },
});

// Bestehende Mutation bulkMergeAnalysisResults (wird durch Stufe 3 ersetzt)
// ... (kann später entfernt werden)

// Mutation zum Aktualisieren eines spezifischen Abschnitts im Frontend-Editor (Beispiel)
// ... existing code ... 

// NEU: Speichert das Ergebnis von Stufe 1 (largeChunks) und triggert Stufe 2
export const saveLargeChunks = internalMutation({
  args: {
    contractId: v.id("contracts"),
    largeChunks: v.array(v.object({
        chunkNumber: v.number(),
        identifiedSections: v.array(v.string()),
        chunkContent: v.string()
    })),
  },
  handler: async (ctx, args) => {
    console.log(`Saving ${args.largeChunks.length} large chunks for contract ${args.contractId}`);
    await ctx.db.patch(args.contractId, {
        largeChunks: args.largeChunks,
        totalLargeChunks: args.largeChunks.length,
        status: "stage1_chunking_completed", // Status aktualisieren
        currentProcessingStepDetail: `Stage 1 completed. ${args.largeChunks.length} large chunks identified.`
    });

    // Trigger Stufe 2
    await ctx.scheduler.runAfter(0, internal.contractActions.startStage2Structuring, {
      contractId: args.contractId,
    });
    console.log(`Scheduled Stage 2 structuring for contract ${args.contractId}`);
  },
});

// NEU: Speichert die Ergebnisse von Stufe 2 (structuredElements) und triggert Stufe 3
export const saveStructuredElements = internalMutation({
  args: {
    contractId: v.id("contracts"),
    structuredElements: v.array(
        v.object({ // Stelle sicher, dass dies mit dem Schema übereinstimmt
            elementType: v.string(),
            elementId: v.string(),
            markdownContent: v.string(),
            originalOrderInChunk: v.number(),
            globalChunkNumber: v.number(), 
            globalOriginalOrder: v.number(),
            // Analysefelder sind hier noch leer/optional
            evaluation: v.optional(v.string()),
            reason: v.optional(v.string()),
            recommendation: v.optional(v.string()),
            isError: v.optional(v.boolean()),
            errorMessage: v.optional(v.string()),
        })
    ),
    stage2Errors: v.optional(v.array(v.string())), // Optionale Fehler aus der Stage 2 Orchestrierung
    successfulChunksCount: v.number(), // Anzahl der erfolgreich strukturierten Chunks
  },
  handler: async (ctx, args) => {
    console.log(`Saving ${args.structuredElements.length} structured elements for contract ${args.contractId} from ${args.successfulChunksCount} successful chunks.`);

    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
        console.error(`Contract ${args.contractId} not found in saveStructuredElements.`);
        return;
    }
    
    let finalStatus: ContractStatus = "stage2_structuring_completed";
    let errorDetails = contract.errorDetails || "";

    if (args.stage2Errors && args.stage2Errors.length > 0) {
        finalStatus = "stage2_structuring_failed"; // Setze Fehlerstatus, wenn Orchestrierungsfehler auftraten
        errorDetails += `
Stage 2 Structuring Errors: ${args.stage2Errors.join("; ")}`;
    } else if (args.successfulChunksCount !== contract.totalLargeChunks) {
         finalStatus = "stage2_structuring_failed"; // Setze Fehlerstatus, wenn nicht alle Chunks erfolgreich waren
         errorDetails += `
Stage 2 Structuring Error: Only ${args.successfulChunksCount} out of ${contract.totalLargeChunks} large chunks were structured successfully.`;
    }

    await ctx.db.patch(args.contractId, {
        structuredContractElements: args.structuredElements,
        totalElementsToAnalyze: args.structuredElements.length,
        structuredLargeChunks: args.successfulChunksCount, // Anzahl erfolgreicher Chunks speichern
        status: finalStatus,
        errorDetails: errorDetails.trim(),
        currentProcessingStepDetail: `Stage 2 finished. ${args.successfulChunksCount}/${contract.totalLargeChunks || '?'} chunks structured. ${args.structuredElements.length} elements ready for analysis.`
    });

    // Trigger Stufe 3 nur, wenn Stufe 2 erfolgreich war
    if (finalStatus === "stage2_structuring_completed") {
      await ctx.scheduler.runAfter(0, internal.contractActions.startStage3Analysis, {
        contractId: args.contractId,
      });
      console.log(`Scheduled Stage 3 analysis for contract ${args.contractId}`);
    } else {
       console.warn(`Stage 3 analysis not scheduled for contract ${args.contractId} due to errors in Stage 2.`);
    }
  },
});

// --- ENDE NEUE MUTATIONEN ---

// ... restliche Mutationen (updateContractAnalysis, updateFileName etc.) ... 

/**
 * INTERNAL MUTATION: Entfernt veraltete Felder aus einem einzelnen Vertragsdokument.
 * Wird von der `migrateRemoveObsoleteFields`-Action aufgerufen.
 */
export const _removeObsoleteContractFields = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      console.warn(`Contract ${args.contractId} not found during migration. Skipping.`);
      return;
    }

    // Erstelle ein neues Objekt ohne die veralteten Felder
    // TypeScript wird hier meckern, da die Felder nicht im Typ sind,
    // aber wir wissen, dass sie im alten Dokument existieren könnten.
    const migratedContract: any = { ...contract };
    let updated = false;

    // Wir casten zu any um auf die veralteten Felder zuzugreifen
    const anyContract: any = migratedContract;
    
    if (anyContract.analysisProtocol !== undefined) {
      delete anyContract.analysisProtocol;
      updated = true;
    }
    
    if (anyContract.processedChunks !== undefined) {
      delete anyContract.processedChunks;
      updated = true;
    }
    
    if (anyContract.totalChunks !== undefined) {
      delete anyContract.totalChunks;
      updated = true;
    }

    if (updated) {
      // Ersetze das alte Dokument mit dem bereinigten
      await ctx.db.replace(args.contractId, migratedContract);
      console.log(`Removed obsolete fields from contract ${args.contractId}.`);
    } else {
       // console.log(`No obsolete fields found in contract ${args.contractId}. No update needed.`);
    }
  },
}); 