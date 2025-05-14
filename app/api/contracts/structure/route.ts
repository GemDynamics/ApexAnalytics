import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Typen
interface ContractElement {
  id: string;
  type: string; // "title", "heading", "clause", "text", etc.
  content: string;
  level?: number;
  parentId?: string;
}

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

export async function POST(req: NextRequest) {
  try {
    // Request-Body parsen
    const body = await req.json();
    const { title, contractText } = body;

    if (!contractText) {
      return NextResponse.json(
        { error: 'Vertragstext ist erforderlich' },
        { status: 400 }
      );
    }

    // HIER IHREN SPEZIFISCHEN PROMPT FÜR GEMINI EINFÜGEN
    const promptForGemini = `Analysiere den folgenden Vertragstext und extrahiere die Struktur.
    Vertragstext:
    ${contractText}
    
    Gib das Ergebnis als JSON-Objekt zurück, das eine Liste von Elementen enthält. Jedes Element sollte 'id', 'type', 'content' und optional 'level' und 'parentId' haben.
    Beispiel für ein Element: { "id": "clause_1", "type": "clause", "content": "Inhalt der Klausel...", "parentId": "heading_2" }`;
    
    // Gemini API aufrufen
    const generationConfig = {
      // temperature: 0.9, // Anpassen nach Bedarf
      // topK: 1,
      // topP: 1,
      // maxOutputTokens: 2048, // Anpassen nach Bedarf
      responseMimeType: "application/json", // Wichtig, wenn Sie JSON erwarten!
    };

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [ // Optional: Bisherige Konversationsteile, falls relevant
        // {
        //   role: "user",
        //   parts: [{ text: "Vorherige Benutzeranfrage" }],
        // },
        // {
        //   role: "model",
        //   parts: [{ text: "Vorherige Modellantwort" }],
        // },
      ],
    });

    const result = await chat.sendMessage(promptForGemini);
    const response = result.response;
    
    // Stellen Sie sicher, dass response.text() die erwartete JSON-Struktur zurückgibt
    // Eventuell müssen Sie hier noch response.candidates[0].content.parts[0].text oder ähnlich verwenden,
    // je nachdem, wie das Gemini SDK die Antwort genau strukturiert.
    const structuredData = JSON.parse(response.text());

    // Erfolgreiche Antwort
    return NextResponse.json({
      title,
      originalText: contractText,
      structuredElements: structuredData.elements || []
    });
  } catch (error) {
    console.error('Error processing contract structure with Gemini:', error);
    // Typ-Überprüfung für den Fehler und detailliertere Fehlermeldung
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: 'Failed to process contract structure', details: errorMessage },
      { status: 500 }
    );
  }
} 