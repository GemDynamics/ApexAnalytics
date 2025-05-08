import { mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

// Typ für den Status, um Typsicherheit zu gewährleisten
type ContractStatus = Doc<"contracts">["status"];

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