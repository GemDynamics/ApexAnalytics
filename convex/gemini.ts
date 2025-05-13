import { GoogleGenerativeAI } from "@google/generative-ai";
import { action, internalAction } from "./_generated/server";
import { ConvexError, v } from "convex/values";

// --- SYSTEM PROMPTS FOR MULTI-STAGE ANALYSIS ---

// System-Prompt für Agent 1 (Stufe 1: Globale Struktur & Grob-Chunking)
export const SYSTEM_PROMPT_AGENT1_CHUNK = `Du bist eine KI, spezialisiert auf die Analyse von Rechtsdokumenten, insbesondere Werkverträgen im Baubereich. Deine Aufgabe ist es, die **globale Hauptstruktur** eines gegebenen Vertragstextes zu identifizieren und den Text basierend auf dieser Struktur in **große, logische Chunks** aufzuteilen.

**Ziel:** Erstelle eine Liste von Objekten zurück, wobei jedes Objekt einen Chunk repräsentiert:

\`\`\`json
[
  {
    "chunkNumber": 1,
    "identifiedSections": ["§ 1 Vertragsgrundlagen", "§ 2 Preise"], // Beispiel mit existierender Nummerierung
    // "identifiedSections": ["Abschnitt 1: Einleitung", "Abschnitt 2: Definitionen"], // Beispiel mit generierter Nummerierung
    "chunkContent": "Der vollständige Text des ersten Chunks..."
  },
  {
    "chunkNumber": 2,
    "identifiedSections": ["§ 3 Leistungsumfang"],
    "chunkContent": "Der vollständige Text des zweiten Chunks..."
  }
  // ... weitere Chunks
]
\`\`\`

Stelle sicher, dass der gesamte Originaltext lückenlos auf die Chunks aufgeteilt wird und die Reihenfolge erhalten bleibt. Das JSON muss valide sein.
`;

// System-Prompt für Agent 2 (Stufe 2: Detaillierte Strukturierung pro Chunk)
export const SYSTEM_PROMPT_AGENT2_STRUCTURE = `Du bist eine KI, spezialisiert auf die detaillierte Strukturierung von Abschnitten aus Rechtsdokumenten (Werkverträgen). Deine Aufgabe ist es, einen gegebenen Text-Chunk (der einem oder mehreren Hauptabschnitten eines Vertrages entspricht) zu analysieren und dessen **detaillierte hierarchische Struktur** in einem JSON-Format abzubilden. Du erhältst auch die Information, zu welchem Haupt-Chunk (globalChunkNumber) dieser Text gehört und welche Hauptüberschriften (\`identifiedSectionsOfParentChunk\`) dieser Haupt-Chunk umfasst.

**Ziel:** Wandle den Input-Chunk in ein strukturiertes JSON-Objekt um, das die Hierarchie von Überschriften (Hauptabschnitte, Paragraphen, Klauseln, Unterpunkte) und den dazugehörigen Textinhalt (Markdown) präzise wiedergibt. Behalte die Originalreihenfolge bei.

**Vorgehensweise zur Identifizierung der Struktur:**

1.  **Identifiziere alle Strukturelemente:** Suche nach Überschriften, Paragraphen, Klauseln, Artikeln, Punkten und Unterpunkten innerhalb des Chunks.
2.  **Erkenne Hierarchieebenen:** Achte auf Nummerierungs- und Formatierungsmuster, um die Hierarchie zu bestimmen:
    *   **Nummerierung:** Dezimalzahlen (1.1, 1.1.1), Buchstaben (a, b, i, ii), römische Ziffern, arabische Ziffern.
    *   **Formatierung:** Fettung, Unterstreichung, Einrückung, Großschreibung.
    *   **Schlüsselwörter:** Begriffe wie "§", "Artikel", "Absatz", "Punkt".
3.  **Sei flexibel:** Die Strukturierung kann uneinheitlich sein. Interpretiere die wahrscheinlichste Hierarchie basierend auf visuellen und textuellen Hinweisen.
4.  **Inhalt zuordnen:** Ordne den Text (Markdown-Inhalt) korrekt dem jeweiligen Strukturelement (Überschrift, Klausel, Absatz) zu.

**Output-Format:** Gib ein JSON-Objekt zurück, das die Struktur des Chunks abbildet. Verwende folgendes Format für jedes Strukturelement:

\`\`\`json
[
  {
    "elementType": "z.B. titleH1, sectionH2, clauseH3, paragraph, listitem",
    "elementId": "Generiere eine ID, idealerweise aus Titel/Nummer und globalChunkNumber, z.B. chunk1_sec1_par1",
    "markdownContent": "Der Markdown-formatierte Text dieses Elements...",
    "originalOrderInChunk": 0 // Fortlaufende Nummer (0-basiert) für die Reihenfolge innerhalb dieses Chunks
    // globalChunkNumber und identifiedSectionsOfParentChunk werden vom aufrufenden Code hinzugefügt/sind bereits Kontext
  },
  // ... weitere Elemente in korrekter Reihenfolge
]
\`\`\`

**Wichtige Hinweise:**

*   Die \`elementId\` sollte möglichst sprechend sein (z.B. aus der Überschrift generiert) und eindeutig innerhalb des Dokuments. Verwende die dir bekannte \`globalChunkNumber\` als Präfix (z.B. \`chunk<globalChunkNumber>_...\`). Wenn keine natürliche ID vorhanden ist (z.B. bei normalen Absätzen), verwende einen generischen Bezeichner mit fortlaufender Nummer (z.B. \`chunk1_par_001\`).
*   \`elementType\` sollte die Hierarchieebene widerspiegeln (z.B. \`sectionH1\`, \`sectionH2\`, \`subsectionH3\`, \`paragraph\`, \`listitem\`). Wähle konsistente Bezeichner.
*   Der gesamte Text des Chunks muss in den \`markdownContent\`-Feldern der Elemente enthalten sein, ohne Verluste und in der korrekten Reihenfolge.
*   Achte darauf, Markdown-Formatierungen im \`markdownContent\` beizubehalten.

Stelle sicher, dass das resultierende JSON valide ist und die Struktur des Input-Chunks präzise und vollständig abbildet.
`;

// System-Prompt für Agent 3 (Stufe 3: Element-Analyse - Placeholder, ggf. anpassen)
// Dieser Prompt ist wahrscheinlich sehr ähnlich zum bestehenden Prompt für die Risikoanalyse.
export const SYSTEM_PROMPT_AGENT3_ANALYZE = `Du bist eine KI zur Risikoanalyse von Vertragsklauseln.
Analysiere die folgende Klausel und bewerte sie als Rot, Gelb oder Grün.
Gib deine Bewertung und eine kurze Begründung sowie eine Handlungsempfehlung aus.
Stelle die Informationen als valides JSON-Objekt bereit, das die Felder "evaluation" (string, einer von "Rot", "Gelb", "Grün", "Info"), "reason" (string) und "recommendation" (string) enthält.
Optional können die Felder "isError" (boolean) und "errorMessage" (string) für Verarbeitungsfehler hinzugefügt werden.

Beispiel:
{
  "evaluation": "Gelb",
  "reason": "Die Klausel X ist unklar formuliert und könnte zu Y führen.",
  "recommendation": "Präzisierung von X wird empfohlen."
}
`;


// --- Bestehende Gemini Actions ---

// Erstelle eine Einbettung für einen Text mit Gemini
export const createEmbedding = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // API-Schlüssel aus Umgebungsvariablen lesen (jetzt GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY ist nicht konfiguriert für Embedding");
      throw new ConvexError("GEMINI_API_KEY is not configured for embedding.");
    }

    // Google AI SDK initialisieren
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      // Einbettungs-Modell initialisieren (jetzt text-embedding-004 für 768 Dimensionen)
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
      
      // Einbettung erstellen
      console.log("Generating embedding with text-embedding-004...");
      const result = await embeddingModel.embedContent(args.text);
      const embedding = result.embedding.values;

      // Sicherstellen, dass ein Array zurückgegeben wird
      if (!Array.isArray(embedding)) {
        console.error("Embedding result is not an array:", embedding);
        throw new Error("Failed to generate a valid embedding array.");
      }

      // Einbettungsvektor zurückgeben
      console.log(`Embedding generated successfully (length: ${embedding.length})`);
      return embedding;
    } catch (error: any) {
      console.error("Fehler bei der Erstellung der Einbettung mit text-embedding-004:", error);
      // Gib den Fehler weiter
      throw new ConvexError(`Embedding generation failed: ${error.message || 'Unknown error'}`);
    }
  },
});

// Hilfsfunktion zum Aufruf der Gemini API für strukturierte JSON-Generierung
export const generateStructuredJson = internalAction({
  args: {
    textInput: v.string(),
    maxOutputTokens: v.optional(v.number()),
    systemPrompt: v.optional(v.string()),
    modelName: v.optional(v.string()), // Optional: Erlaube Überschreiben des Modells
  },
  handler: async (ctx, args) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable not set.");
    }

    // Verwende übergebenes Modell oder Fallback auf Flash
    const model = args.modelName ?? "gemini-2.0-flash"; // Default auf Flash
    const max_output_tokens = args.maxOutputTokens ?? 2048; // Standard-Token-Limit

    // System-Prompt standardmäßig oder übergebenen verwenden
    const systemPrompt = args.systemPrompt ?? "You are a helpful assistant.";

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const generativeModel = genAI.getGenerativeModel({
       model: model,
       systemInstruction: systemPrompt,
       generationConfig: {
           responseMimeType: "application/json", // Wichtig: Fordert JSON-Ausgabe an!
       },
    });

    try {
      console.log(`Calling Gemini (${model}) for structured JSON generation...`);
      const result = await generativeModel.generateContent(args.textInput);
      const response = result.response;
      
      // Überprüfung, ob eine Antwort vorhanden ist
      if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
        console.error("Gemini API response is empty or not in the expected format.", response);
        // Versuche, Finish Reason auszulesen, falls vorhanden
        const finishReason = response?.candidates?.[0]?.finishReason;
        const safetyRatings = response?.candidates?.[0]?.safetyRatings;
        console.error(`Finish Reason: ${finishReason}, Safety Ratings: ${JSON.stringify(safetyRatings)}`);
        throw new Error(`Unexpected Gemini API response format or empty response. Finish Reason: ${finishReason}`);
      }

      const jsonText = response.candidates[0].content.parts[0].text;
      
      // WICHTIG: Das Modell sollte dank "application/json" valides JSON liefern.
      // Wir parsen es hier, um sicherzustellen, dass es valide ist, bevor wir es zurückgeben.
      // Die aufrufende Funktion (`structureContractIncrementallyAndCreateJsonElements`)
      // muss das Ergebnis dann noch als den erwarteten Typ (z.B. RawStructuredElement[]) behandeln.
      let parsedJson;
      try {
        // Stelle sicher, dass jsonText ein String ist, bevor geparst wird
        if (typeof jsonText !== 'string') {
            console.error("jsonText is not a string, cannot parse:", jsonText);
            throw new Error("Received non-string content part from Gemini API.");
        }
        parsedJson = JSON.parse(jsonText);
        console.log(`Successfully parsed JSON response from Gemini (${model}).`);
        return parsedJson; // Gib das geparste JSON-Objekt/Array zurück
      } catch (parseError: any) {
        console.error("Failed to parse JSON response from Gemini, despite requesting JSON mime type:", jsonText, "Error:", parseError);
        throw new Error(`Failed to parse JSON response from Gemini: ${parseError.message}`);
      }

    } catch (error: any) {
      console.error(`Error calling Gemini API (${model}):`, error);
      // Gib den Fehler weiter, damit die aufrufende Funktion ihn behandeln kann
      throw new ConvexError(`Gemini API call failed (${model}): ${error.message || 'Unknown error'}`);
    }
  },
});

// Hilfsfunktion zum Aufruf der Gemini API für Analyse mit Pro-Modell (oder überschriebenem Modell)
export const generateAnalysisWithPro = internalAction({
  args: {
    elementMarkdownContent: v.string(),
    elementId: v.string(),
  },
  handler: async (ctx, args) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable not set for Stage 3 element analysis.");
      throw new ConvexError("GEMINI_API_KEY environment variable not set.");
    }

    // Modell gemäß Implementierungsanleitung für Stufe 3
    const modelName = "gemini-2.5-flash-preview-04-17"; 

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const generativeModel = genAI.getGenerativeModel({
       model: modelName,
       systemInstruction: SYSTEM_PROMPT_AGENT3_ANALYZE, // Neuer System-Prompt für Stufe 3
       generationConfig: {
           responseMimeType: "application/json",
       },
    });

    try {
      const result = await generativeModel.generateContent(args.elementMarkdownContent);
      const response = result.response;

      if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
        console.error(`Gemini (${modelName}) API response for Stage 3 (Element ${args.elementId}) is empty or not in the expected format.`, response);
        const finishReason = response?.candidates?.[0]?.finishReason;
        const safetyRatings = response?.candidates?.[0]?.safetyRatings;
        console.error(`Finish Reason: ${finishReason}, Safety Ratings: ${JSON.stringify(safetyRatings)}`);
        return {
            evaluation: "Fehler",
            reason: `Unexpected Gemini API response format or empty response. Finish Reason: ${finishReason}`,
            recommendation: "Analyse konnte nicht durchgeführt werden.",
            isError: true,
            errorMessage: `Unexpected Gemini API response format or empty response. Finish Reason: ${finishReason}`
        };
      }

      const jsonText = response.candidates[0].content.parts[0].text;
      let parsedAnalysisResult;
      try {
        if (typeof jsonText !== 'string') {
            console.error(`jsonText from Stage 3 Gemini (Element ${args.elementId}) is not a string:`, jsonText);
            throw new Error("Received non-string content part from Gemini API for analysis.");
        }
        parsedAnalysisResult = JSON.parse(jsonText);
        
        if (!parsedAnalysisResult.evaluation || !parsedAnalysisResult.reason || !parsedAnalysisResult.recommendation) {
            console.warn(`Parsed JSON from Stage 3 (Element ${args.elementId}) does not match expected analysis format:`, parsedAnalysisResult);
            return {
                evaluation: "Fehler",
                reason: "KI-Antwort für Analyse hatte nicht das erwartete Format.",
                recommendation: "Erneute Analyse versuchen oder Prompt anpassen.",
                isError: true,
                errorMessage: "Parsed JSON from Stage 3 analysis does not match expected format."
            };
        }
        return { 
            ...parsedAnalysisResult, 
            isError: parsedAnalysisResult.isError || false,
            errorMessage: parsedAnalysisResult.errorMessage
        }; 

      } catch (parseError: any) {
        console.error(`Failed to parse JSON response from Gemini Stage 3 (${modelName}, Element ${args.elementId}):`, jsonText, "Error:", parseError);
        return {
            evaluation: "Fehler",
            reason: `Failed to parse JSON response from Gemini Stage 3: ${parseError.message}`,
            recommendation: "Überprüfung der KI-Antwort und des Parsers notwendig.",
            isError: true,
            errorMessage: `Failed to parse JSON response from Gemini Stage 3: ${parseError.message}`
        };
      }

    } catch (error: any) {
      console.error(`Error calling Gemini API (${modelName}) for Stage 3 Analysis (Element ${args.elementId}):`, error);
      return {
            evaluation: "Fehler",
            reason: `Gemini API call failed for Stage 3: ${error.message || 'Unknown error'}`,
            recommendation: "API-Verbindung oder Konfiguration prüfen.",
            isError: true,
            errorMessage: `Gemini API call failed for Stage 3: ${error.message || 'Unknown error'}`
        };
    }
  },
});

// --- NEUE ACTIONS FÜR MEHRSTUFIGE ANALYSE ---

// Stufe 1: Grob-Chunking mit Gemini Pro
export const runStage1Chunking = internalAction({
  args: {
    contractText: v.string(),
  },
  handler: async (ctx, args) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable not set for Stage 1.");
      throw new ConvexError("GEMINI_API_KEY environment variable not set.");
    }

    const modelName = "gemini-2.5-pro-preview-05-06"; // Korrektes Pro-Modell

    console.log(`Starting Stage 1 Chunking with ${modelName}...`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const generativeModel = genAI.getGenerativeModel({
       model: modelName,
       systemInstruction: SYSTEM_PROMPT_AGENT1_CHUNK,
       generationConfig: {
           responseMimeType: "application/json",
           // Ggf. Temperature anpassen, falls nötig (Standard ist oft ok für strukturierte Aufgaben)
           // temperature: 0.2,
       },
    });

    try {
      const result = await generativeModel.generateContent(args.contractText);
      const response = result.response;

      if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
        console.error(`Gemini (${modelName}) API response for Stage 1 is empty or not in the expected format.`, response);
        const finishReason = response?.candidates?.[0]?.finishReason;
        const safetyRatings = response?.candidates?.[0]?.safetyRatings;
        console.error(`Finish Reason: ${finishReason}, Safety Ratings: ${JSON.stringify(safetyRatings)}`);
        throw new Error(`Unexpected Gemini API response format or empty response. Finish Reason: ${finishReason}`);
      }

      const jsonText = response.candidates[0].content.parts[0].text;
      let parsedChunks;
      try {
        if (typeof jsonText !== 'string') {
             console.error("jsonText from Stage 1 Gemini is not a string:", jsonText);
             throw new Error("Received non-string content part from Gemini API.");
         }
        parsedChunks = JSON.parse(jsonText);
        // Validierung (optional aber empfohlen): Überprüfen, ob es ein Array ist und die erwarteten Felder hat
        if (!Array.isArray(parsedChunks) || parsedChunks.length === 0 || !parsedChunks[0].chunkNumber || !parsedChunks[0].identifiedSections || !parsedChunks[0].chunkContent) {
             console.warn("Parsed JSON from Stage 1 does not match expected chunk format:", parsedChunks);
             // Ggf. trotzdem zurückgeben und die aufrufende Funktion validieren lassen, oder hier Fehler werfen
             // throw new Error("Parsed JSON does not match expected chunk format.");
        }
        console.log(`Successfully parsed ${parsedChunks.length} large chunks from Gemini (${modelName}) Stage 1.`);
        return parsedChunks; // Gib das Array der Chunk-Objekte zurück
      } catch (parseError: any) {
        console.error(`Failed to parse JSON response from Gemini Stage 1 (${modelName}), despite requesting JSON mime type:`, jsonText, "Error:", parseError);
        throw new Error(`Failed to parse JSON response from Gemini Stage 1: ${parseError.message}`);
      }

    } catch (error: any) {
      console.error(`Error calling Gemini API (${modelName}) for Stage 1 Chunking:`, error);
      throw new ConvexError(`Gemini API call failed for Stage 1 (${modelName}): ${error.message || 'Unknown error'}`);
    }
  },
});

// Stufe 2: Detaillierte Strukturierung eines großen Chunks mit Gemini Pro
export const runStage2Structuring = internalAction({
  args: {
    chunkContent: v.string(),
    globalChunkNumber: v.number(),
    identifiedSectionsOfParentChunk: v.array(v.string()), // Zur Kontextgabe an das Modell
  },
  handler: async (ctx, args) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable not set for Stage 2.");
      throw new ConvexError("GEMINI_API_KEY environment variable not set.");
    }

    const modelName = "gemini-2.5-pro-preview-05-06"; // Korrektes Pro-Modell

    console.log(`Starting Stage 2 Structuring for global chunk ${args.globalChunkNumber} with ${modelName}...`);

    // Kontext für das Modell vorbereiten (wird im Prompt selbst nicht explizit verwendet,
    // aber es ist gut, ihn ggf. zur Verfügung zu haben oder in Zukunft einzubauen)
    const contextPromptPart = `Dieser Text ist Teil des globalen Chunks Nr. ${args.globalChunkNumber}, welcher folgende Hauptabschnitte umfasst: ${args.identifiedSectionsOfParentChunk.join(", ")}. Strukturiere nun den folgenden Inhalt detailliert:`;

    const userPrompt = `${contextPromptPart}\n\n--- TEXT-CHUNK ZUR STRUKTURIERUNG ---\n${args.chunkContent}\n--- ENDE TEXT-CHUNK ---`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const generativeModel = genAI.getGenerativeModel({
       model: modelName,
       systemInstruction: SYSTEM_PROMPT_AGENT2_STRUCTURE,
       generationConfig: {
           responseMimeType: "application/json",
           // Ggf. Temperature anpassen
           // temperature: 0.2,
       },
    });

    try {
      const result = await generativeModel.generateContent(userPrompt); // Verwende den kombinierten Prompt
      const response = result.response;

      if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
        console.error(`Gemini (${modelName}) API response for Stage 2 (Chunk ${args.globalChunkNumber}) is empty or not in the expected format.`, response);
        const finishReason = response?.candidates?.[0]?.finishReason;
        const safetyRatings = response?.candidates?.[0]?.safetyRatings;
        console.error(`Finish Reason: ${finishReason}, Safety Ratings: ${JSON.stringify(safetyRatings)}`);
        throw new Error(`Unexpected Gemini API response format or empty response. Finish Reason: ${finishReason}`);
      }

      const jsonText = response.candidates[0].content.parts[0].text;
      let parsedStructuredElements;
      try {
         if (typeof jsonText !== 'string') {
             console.error(`jsonText from Stage 2 Gemini (Chunk ${args.globalChunkNumber}) is not a string:`, jsonText);
             throw new Error("Received non-string content part from Gemini API.");
         }
        parsedStructuredElements = JSON.parse(jsonText);
        // Validierung (optional aber empfohlen): Überprüfen, ob es ein Array ist und die erwarteten Felder hat
        if (!Array.isArray(parsedStructuredElements) /* || parsedStructuredElements.length === 0 */) { // Leere Arrays können gültig sein
             console.warn(`Parsed JSON from Stage 2 (Chunk ${args.globalChunkNumber}) is not an array:`, parsedStructuredElements);
             throw new Error("Parsed JSON from Stage 2 is not an array.");
        } else if (parsedStructuredElements.length > 0 && (!parsedStructuredElements[0].elementType || !parsedStructuredElements[0].elementId || !parsedStructuredElements[0].markdownContent || typeof parsedStructuredElements[0].originalOrderInChunk !== 'number')) {
             console.warn(`Parsed JSON from Stage 2 (Chunk ${args.globalChunkNumber}) does not match expected element format:`, parsedStructuredElements[0]);
            //  throw new Error("Parsed JSON elements do not match expected format."); // Ggf. weniger streng sein
        }

        console.log(`Successfully parsed ${parsedStructuredElements.length} structured elements from Gemini (${modelName}) Stage 2 for chunk ${args.globalChunkNumber}.`);
        // Füge globalChunkNumber zu jedem Element hinzu, bevor es zurückgegeben wird
        const elementsWithGlobalChunkNumber = parsedStructuredElements.map((element: any) => ({
            ...element,
            globalChunkNumber: args.globalChunkNumber
        }));
        return elementsWithGlobalChunkNumber; // Gib das Array der strukturierten Elemente zurück

      } catch (parseError: any) {
        console.error(`Failed to parse JSON response from Gemini Stage 2 (${modelName}, Chunk ${args.globalChunkNumber}):`, jsonText, "Error:", parseError);
        throw new Error(`Failed to parse JSON response from Gemini Stage 2: ${parseError.message}`);
      }

    } catch (error: any) {
      console.error(`Error calling Gemini API (${modelName}) for Stage 2 Structuring (Chunk ${args.globalChunkNumber}):`, error);
      throw new ConvexError(`Gemini API call failed for Stage 2 (${modelName}): ${error.message || 'Unknown error'}`);
    }
  },
});

// Stufe 3: Element-Analyse (wird in Schritt 3.3 angepasst/erstellt) 