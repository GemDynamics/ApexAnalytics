import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Umgebungsvariable für den API-Schlüssel
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

// GoogleGenerativeAI Client initialisieren
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-preview-0514" }); // Modell hier anpassbar

// Sicherheits-Einstellungen (optional, aber empfohlen)
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Definition der erwarteten Antwortstruktur (ggf. anpassen)
interface ClauseAnalysisResponse {
  status: 'green' | 'yellow' | 'red';
  explanation: string;
  detailedAnalysis?: string; // Zusätzliche Details, falls vom Modell generiert
  alternativeSuggestions?: string[];
  relevantKnowledgeBaseChunks?: string[]; // IDs oder Referenzen
}

export async function POST(req: Request) {
  try {
    const { clauseText, contractContext } = await req.json();

    if (!clauseText) {
      return new Response(JSON.stringify({ error: 'Clause text is required' }), { status: 400 });
    }

    // HIER IHREN SPEZIFISCHEN PROMPT FÜR GEMINI EINFÜGEN
    // Passen Sie den Prompt an, um die gewünschte JSON-Struktur zu erhalten.
    const promptForGemini = `Analysiere die folgende Vertragsklausel im Kontext des Gesamtvertrages.
    Klausel: "${clauseText}"
    Kontext des Vertrags: "${contractContext || 'Kein zusätzlicher Kontext gegeben.'}"
    
    Bewerte die Klausel nach dem Ampelsystem (status: 'green', 'yellow', 'red').
    Gib eine detaillierte Erklärung (explanation) für deine Bewertung.
    Optional: Gib eine ausführlichere Analyse (detailedAnalysis).
    Optional: Schlage alternative Formulierungen vor (alternativeSuggestions als Array von Strings).
    Optional: Nenne relevante Wissensdatenbank-Chunks (relevantKnowledgeBaseChunks als Array von Strings).
    
    Gib das Ergebnis als JSON-Objekt mit den Feldern status, explanation, detailedAnalysis, alternativeSuggestions, relevantKnowledgeBaseChunks zurück.
    Beispiel für die Antwortstruktur:
    {
      "status": "red",
      "explanation": "Diese Klausel ist kritisch, weil...",
      "detailedAnalysis": "Weitere Details zur Analyse...",
      "alternativeSuggestions": ["Vorschlag 1", "Vorschlag 2"],
      "relevantKnowledgeBaseChunks": ["chunk_id_1", "chunk_id_2"]
    }`;

    // Gemini API aufrufen
    const generationConfig = {
      // temperature: 0.5, // Anpassen nach Bedarf
      // maxOutputTokens: 1500, // Anpassen nach Bedarf
      responseMimeType: "application/json", // Wichtig für JSON-Antwort
    };
    
    const chat = model.startChat({
        generationConfig,
        safetySettings,
    });

    const result = await chat.sendMessage(promptForGemini);
    const response = result.response;
    
    // Stellen Sie sicher, dass response.text() die erwartete JSON-Struktur zurückgibt
    const analysisResult: ClauseAnalysisResponse = JSON.parse(response.text());

    return new Response(JSON.stringify(analysisResult), { status: 200 });
  } catch (error) {
    console.error('Error analyzing clause with Gemini:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: 'Failed to analyze clause', details: errorMessage }), { status: 500 });
  }
} 