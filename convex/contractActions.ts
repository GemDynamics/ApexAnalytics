"use node";

import { action, internalAction } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import fs from 'fs';
import path from 'path';
// PDF-Parser ändern
import { PDFDocument } from 'pdf-lib';
import extract from 'pdf-text-extract';
import mammoth from 'mammoth';
import { Id } from "./_generated/dataModel";
import { promisify } from 'util';

// Umwandlung des callback-basierten pdf-text-extract in eine Promise-basierte Version
const extractTextFromPDF = promisify(extract);

const CHUNK_SIZE_WORDS = 1500; // Ungefähre Wortanzahl pro Chunk, muss experimentell angepasst werden!

async function getBuffer(file: Blob | ArrayBuffer): Promise<Buffer> {
    if (file instanceof ArrayBuffer) {
        return Buffer.from(file);
    }
    // Für Blob, konvertiere zu ArrayBuffer zuerst
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Teilt einen Text in Chunks basierend auf Wortanzahl und versucht, an Satzenden zu trennen.
 */
function splitTextIntoChunks(text: string, chunkSizeInWords: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/); // Einfache Satz-Tokenisierung
  const chunks: string[] = [];
  let currentChunk = "";
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWordCount = sentence.split(/\s+/).length;
    if (currentWordCount + sentenceWordCount > chunkSizeInWords && currentWordCount > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
      currentWordCount = 0;
    }
    currentChunk += sentence + " ";
    currentWordCount += sentenceWordCount;
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

export const startFullContractAnalysis = action({
  args: { 
    storageId: v.id("_storage"), // Wir verwenden nur noch echte Storage-IDs
    contractId: v.id("contracts") 
  },
  handler: async (ctx, args) => {
    console.log(`Starting full contract analysis for contractId: ${args.contractId}`);

    await ctx.runMutation(internal.contractMutations.updateContractStatus, {
      contractId: args.contractId,
      status: "processing",
      totalChunks: 0,
    });

    // Hole die tatsächliche Datei aus dem Storage
    const fileBlob = await ctx.storage.get(args.storageId);
    if (!fileBlob) {
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed",
      });
      throw new ConvexError("File not found in storage.");
    }
    const fileBuffer = await getBuffer(fileBlob);

    let extractedText = "";
    const contractDocument = await ctx.runQuery(api.contractsQueries.getContractById, { contractId: args.contractId });
    if (!contractDocument) {
        await ctx.runMutation(internal.contractMutations.updateContractStatus, {
            contractId: args.contractId, status: "failed",
        });
        throw new ConvexError("Contract document not found in DB for text extraction.");
    }
    const fileName = contractDocument.fileName.toLowerCase();
    
    console.log(`Attempting text extraction for: ${fileName}`); // Zusätzliches Logging

    try {
        if (fileName.endsWith(".pdf")) {
            // PDF-Support mit pdf-lib und pdf-text-extract
            console.log("Processing PDF file...");

            // Temporäre Datei erstellen, da pdf-text-extract mit Dateipfaden arbeitet
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const tempFilePath = path.join(tempDir, `temp_${Date.now()}.pdf`);
            fs.writeFileSync(tempFilePath, fileBuffer);
            
            try {
                // Text aus PDF extrahieren
                const pages = await extractTextFromPDF(tempFilePath);
                extractedText = pages.join('\n\n');
                
                // Prüfen, ob Text erfolgreich extrahiert wurde
                if (!extractedText || extractedText.trim().length === 0) {
                    // Wenn pdf-text-extract keinen Text findet, versuchen wir es mit pdf-lib
                    console.log("No text extracted from pdf-text-extract, trying pdf-lib...");
                    const pdfDoc = await PDFDocument.load(fileBuffer);
                    
                    // Anzahl der Seiten ausgeben (zur Information)
                    console.log(`PDF has ${pdfDoc.getPageCount()} pages.`);
                    
                    // HINWEIS: pdf-lib kann standardmäßig keinen Text aus PDFs extrahieren.
                    // Es ist hauptsächlich zum Erstellen/Bearbeiten von PDFs gedacht, nicht zum Extrahieren von Text.
                    // Wir fügen hier einen Fallback-Text hinzu
                    extractedText = `PDF konnte nicht vollständig extrahiert werden. Die PDF hat ${pdfDoc.getPageCount()} Seiten.`;
                }
            } finally {
                // Temporäre Datei aufräumen, egal ob erfolgreich oder nicht
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (cleanupError) {
                    console.error("Failed to delete temporary PDF file:", cleanupError);
                }
            }
            
            console.log(`PDF text extracted. Length: ${extractedText.length} characters`);
        } else if (fileName.endsWith(".docx")) {
            console.log("Processing DOCX file...");
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
            console.log("DOCX text extracted successfully.");
        } else if (fileName.endsWith(".txt")) { 
            console.log("Processing TXT file...");
            extractedText = fileBuffer.toString('utf-8');
            console.log("TXT text extracted successfully.");
        } else {
            await ctx.runMutation(internal.contractMutations.updateContractStatus, {
                contractId: args.contractId, status: "failed",
            });
            // Angepasste Fehlermeldung
            throw new ConvexError(`Unsupported file type: ${contractDocument.fileName}. Only .pdf, .docx, and .txt are currently supported.`);
        }
    } catch (error: any) {
        console.error(`Error during text extraction for ${fileName}:`, error);
        await ctx.runMutation(internal.contractMutations.updateContractStatus, {
            contractId: args.contractId, status: "failed",
        });
        // Detailliertere Fehlermeldung
        throw new ConvexError(`Failed to extract text from ${fileName}: ${error.message || 'Unknown error'}`);
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed",
      });
      throw new ConvexError(`Extracted text from ${fileName} is empty.`);
    }
    console.log(`Text extracted (length: ${extractedText.length}) from ${fileName}`);

    let rulesText = "";
    let legalBasisText = "";
    try {
      const baseDir = process.cwd(); 
      const rulesFilePath = path.join(baseDir, 'ai-knowledge-base', 'Regeln für die Analyse.md');
      const legalBasisFilePath = path.join(baseDir, 'ai-knowledge-base', 'juristischer_basis_extrakt.md');
      rulesText = fs.readFileSync(rulesFilePath, 'utf-8');
      legalBasisText = fs.readFileSync(legalBasisFilePath, 'utf-8');
      console.log("Knowledge base files loaded successfully.");
    } catch (error) {
      console.error("Error loading knowledge base files:", error);
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed",
      });
      throw new ConvexError("Failed to load knowledge base.");
    }

    const chunks = splitTextIntoChunks(extractedText, CHUNK_SIZE_WORDS);
    if (chunks.length === 0) {
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed",
      });
      throw new ConvexError("No chunks created from text.");
    }
    console.log(`Text split into ${chunks.length} chunks.`);

    await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "chunking",
        totalChunks: chunks.length,
    });

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Scheduling analysis for chunk ${i + 1}/${chunks.length}`);
      await ctx.scheduler.runAfter(0, internal.contractActions.analyzeContractChunk, {
        contractId: args.contractId,
        chunkText: chunks[i],
        rulesText: rulesText,
        legalBasisText: legalBasisText,
        chunkNumber: i + 1,
        totalChunks: chunks.length,
      });
    }
    console.log(`All chunks scheduled for contractId: ${args.contractId}`);
    return { message: `Analysis process started for ${chunks.length} chunks.` };
  },
});

export const analyzeContractChunk = internalAction({
  args: {
    contractId: v.id("contracts"),
    chunkText: v.string(),
    rulesText: v.string(),
    legalBasisText: v.string(),
    chunkNumber: v.number(),
    totalChunks: v.number(),
  },
  handler: async (ctx, args) => {
    console.log(`Analyzing chunk ${args.chunkNumber}/${args.totalChunks} for contract ${args.contractId}`);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables.");
      await ctx.runMutation(internal.contractMutations.appendChunkAnalysis, {
        contractId: args.contractId,
        chunkNumber: args.chunkNumber,
        totalChunks: args.totalChunks,
        chunkResult: [],
        error: "GEMINI_API_KEY missing"
      });
      throw new ConvexError("GEMINI_API_KEY is not configured.");
    }

    const systemPrompt = `Du bist ein spezialisierter KI-Assistent für die automatisierte Prüfung von deutschsprachigen Bauverträgen und Allgemeinen Geschäftsbedingungen (AGBs), insbesondere im Kontext des deutschen und österreichischen Baurechts (BGB, VOB, ÖNORM). Deine Hauptaufgabe ist es, Nutzern zu helfen, Verträge schnell zu analysieren, Risiken zu identifizieren und Compliance sicherzustellen.
    Gib als Ergebnis NUR ein valides JSON-Array zurück, das die analysierten Klauseln dieses Chunks enthält. Jedes Objekt im Array MUSS folgende Felder haben: "clauseText" (string), "evaluation" (string: "Rot", "Gelb" oder "Grün"), "reason" (string), "recommendation" (string). Wenn keine identifizierbaren Klauseln in diesem Chunk sind, gib ein leeres JSON-Array zurück: []. Beispiel für ein einzelnes Klauselobjekt: {"clauseText": "Text der Klausel...", "evaluation": "Rot", "reason": "Verstößt gegen Regel X...", "recommendation": "Entfernen oder neu verhandeln..."}`;

    const userPrompt = `Du analysierst einen Teil eines größeren Bauvertrags (Chunk ${args.chunkNumber}/${args.totalChunks}). Identifiziere alle Klauseln innerhalb dieses Textabschnitts, bewerte sie gemäß den beigefügten "Regeln für die Analyse" und erstelle ein Protokoll für die Klauseln in diesem Chunk. Berücksichtige bei deiner Bewertung auch die beigefügten juristischen Referenzinformationen.

--- VERTRAGSTEXT-CHUNK ANFANG ---
${args.chunkText}
--- VERTRAGSTEXT-CHUNK ENDE ---

--- REGELN FÜR DIE ANALYSE ANFANG ---
${args.rulesText}
--- REGELN FÜR DIE ANALYSE ENDE ---

--- JURISTISCHER BASIS-EXTRAKT ANFANG ---
${args.legalBasisText}
--- JURISTISCHER BASIS-EXTRAKT ENDE ---

Stelle sicher, dass deine Antwort ausschließlich ein valides JSON-Array ist, wie im Systemprompt beschrieben. Beginne deine Antwort direkt mit '[' und ende sie mit ']'.`;

    let analysisResultForChunk: any[] = [];
    try {
      console.log(`Calling Gemini for chunk ${args.chunkNumber} of contract ${args.contractId}...`);
      const requestBody = {
        contents: [
          { role: "user", parts: [{ text: systemPrompt }, { text: userPrompt }] }
        ],
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Gemini API error for chunk ${args.chunkNumber}: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}. Body: ${errorBody}`);
      }
      const responseData = await response.json();
      if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content || !responseData.candidates[0].content.parts || !responseData.candidates[0].content.parts[0]) {
        console.error("Gemini API response is not in the expected format for chunk " + args.chunkNumber, responseData);
        throw new Error("Unexpected Gemini API response format.");
      }
      const geminiOutput = responseData.candidates[0].content.parts[0].text;
      let cleanedOutput = geminiOutput.trim();
      if (cleanedOutput.startsWith("```json")) {
        cleanedOutput = cleanedOutput.substring(7);
      }
      if (cleanedOutput.endsWith("```")) {
        cleanedOutput = cleanedOutput.substring(0, cleanedOutput.length - 3);
      }
      cleanedOutput = cleanedOutput.trim(); 
      try {
        analysisResultForChunk = JSON.parse(cleanedOutput);
        if (!Array.isArray(analysisResultForChunk)) {
            console.warn(`Gemini output for chunk ${args.chunkNumber} was valid JSON but not an array. Wrapping in array. Output:`, analysisResultForChunk);
            analysisResultForChunk = [analysisResultForChunk]; 
        }
      } catch (parseError: any) {
        console.error(`Failed to parse Gemini JSON output for chunk ${args.chunkNumber}. Output was:`, cleanedOutput, "Error:", parseError);
         analysisResultForChunk = [{ 
            clauseText: `Fehler beim Parsen der KI-Antwort für Chunk ${args.chunkNumber}.`,
            evaluation: "Fehler",
            reason: `KI-Antwort war kein valides JSON: ${parseError.message}. Raw Output: ${geminiOutput.substring(0,200)}...`,
            recommendation: "Überprüfe die KI-Antwort und den Prompt."
        }];
      }
    } catch (error: any) {
      console.error(`Error analyzing chunk ${args.chunkNumber} for contract ${args.contractId}:`, error.message, error.stack);
      await ctx.runMutation(internal.contractMutations.appendChunkAnalysis, {
        contractId: args.contractId,
        chunkNumber: args.chunkNumber,
        totalChunks: args.totalChunks,
        chunkResult: [],
        error: error.message || "Unbekannter Fehler bei der Chunk-Analyse",
      });
      return; 
    }

    await ctx.runMutation(internal.contractMutations.appendChunkAnalysis, {
      contractId: args.contractId,
      chunkNumber: args.chunkNumber,
      totalChunks: args.totalChunks,
      chunkResult: analysisResultForChunk,
    });
    console.log(`Successfully processed and stored chunk ${args.chunkNumber} for contract ${args.contractId}`);
  },
});

// Neue Action zur Datei-Hochladung über fetch, da fetch() nur in Actions verfügbar ist
export const uploadFileAction = action({
  args: {
    fileName: v.string(),
    fileType: v.string(),
    fileBuffer: v.any(), // Wir akzeptieren unterschiedliche Buffer-Typen
  },
  handler: async (ctx, args): Promise<{ success: boolean; contractId?: string; storageId?: Id<"_storage">; error?: string }> => {
    console.log(`Uploading file via action: ${args.fileName} (${args.fileType})`);
    
    // Authentifizierung prüfen
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("User not authenticated to upload files.");
    }
    
    try {
      // 1. Upload-URL generieren
      const uploadUrl = await ctx.storage.generateUploadUrl();
      console.log("Generated upload URL:", uploadUrl);
      
      // 2. Blob aus dem ArrayBuffer erstellen
      let blob;
      if (args.fileBuffer instanceof ArrayBuffer) {
        blob = new Blob([new Uint8Array(args.fileBuffer)]);
      } else if (args.fileBuffer instanceof Uint8Array) {
        blob = new Blob([args.fileBuffer]);
      } else {
        blob = new Blob([args.fileBuffer]);
      }
      
      // 3. Upload zur URL durchführen (mit fetch, was nur in Actions erlaubt ist)
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: blob
      });
      
      if (!uploadResult.ok) {
        throw new Error(`Failed to upload file: ${uploadResult.status} ${uploadResult.statusText}`);
      }
      
      // 4. StorageId aus der URL extrahieren
      const urlObj = new URL(uploadUrl);
      const pathParts = urlObj.pathname.split('/');
      
      // Die Storage-ID ist im Pfad. Wir parsen sie heraus.
      let storageId: string | undefined;
      for (let i = pathParts.length - 1; i >= 0; i--) {
        if (pathParts[i] && !['api', 'storage', 'upload', ''].includes(pathParts[i])) {
          storageId = pathParts[i];
          break;
        }
      }
      
      if (!storageId) {
        throw new ConvexError("Failed to extract valid storage ID from upload URL");
      }
      
      console.log(`File uploaded successfully with storageId: ${storageId}`);
      
      // 5. Vertrag in der Datenbank erstellen
      const contractId: string = await ctx.runMutation(api.contractMutations.createContractRecord, {
        fileName: args.fileName,
        storageId: storageId as Id<"_storage">
      });
      
      console.log(`Contract record created with ID: ${contractId}`);
      
      return { 
        success: true, 
        contractId, 
        storageId: storageId as Id<"_storage"> 
      };
    } catch (error) {
      console.error("Error in upload action:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
}); 