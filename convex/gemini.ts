import { GoogleGenerativeAI } from "@google/generative-ai";
import { action, internalAction } from "./_generated/server";
import { ConvexError, v } from "convex/values";

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
    contextPrompt: v.string(), // Der Hauptprompt/Anweisung für die Analyse
    knowledgeContext: v.optional(v.string()), // Der abgerufene Kontext aus der Vektor-DB
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
    const model = args.modelName ?? "gemini-2.0-flash"; // Standard auf Flash
    const max_output_tokens = args.maxOutputTokens ?? 2048;

    let fullPrompt = args.contextPrompt; 

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const generativeModel = genAI.getGenerativeModel({
       model: model,
       systemInstruction: fullPrompt,
       generationConfig: {
            temperature: 0.3, // Eher präzise als kreativ
       }
    });

    try {
      const result = await generativeModel.generateContent(args.knowledgeContext ?? "");
      const response = result.response;

      if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
        console.error(`Gemini (${model}) API response is empty or not in the expected format for analysis.`, response);
        const finishReason = response?.candidates?.[0]?.finishReason;
        const safetyRatings = response?.candidates?.[0]?.safetyRatings;
        console.error(`Finish Reason: ${finishReason}, Safety Ratings: ${JSON.stringify(safetyRatings)}`);
        throw new Error(`Unexpected Gemini API response format or empty response. Finish Reason: ${finishReason}`);
      }

      const responseText = response.candidates[0].content.parts[0].text;
      
      // Hier geben wir den rohen Text zurück.
      // Die aufrufende Funktion (`analyzeContractChunkWithStructureAndVectorKB`)
      // ist verantwortlich für das Extrahieren und Parsen des JSON aus diesem Text.
      if (typeof responseText !== 'string') {
           console.error("Gemini response text is not a string:", responseText);
           throw new Error("Gemini API response part was not text.");
      }
      
      console.log(`Received text response from Gemini (${model}) for analysis.`);
      return responseText;

    } catch (error: any) {
      console.error(`Error calling Gemini API (${model}) for analysis:`, error);
      throw new ConvexError(`Gemini API call for analysis failed (${model}): ${error.message || 'Unknown error'}`);
    }
  },
}); 