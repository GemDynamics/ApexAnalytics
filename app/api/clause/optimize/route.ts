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

export async function POST(req: Request) {
  try {
    const { clause, issue, optimizationGoal } = await req.json();

    if (!clause || !issue) {
      return new Response(JSON.stringify({ error: 'Clause and issue description are required' }), { status: 400 });
    }

    // HIER IHREN SPEZIFISCHEN PROMPT FÜR GEMINI EINFÜGEN
    const promptForGemini = `Optimiere die folgende Vertragsklausel.
    Originalklausel: "${clause}"
    Problembeschreibung: "${issue}"
    Optimierungsziel: "${optimizationGoal || 'Risikominimierung für den Auftragnehmer und Verbesserung der rechtlichen Klarheit.'}"
    
    Schlage eine optimierte Version der Klausel vor. Gib nur den Text der optimierten Klausel zurück.`;

    // Gemini API aufrufen
    const generationConfig = {
      // temperature: 0.7, // Anpassen nach Bedarf
      // maxOutputTokens: 1024, // Anpassen nach Bedarf
    };

    const chat = model.startChat({
        generationConfig,
        safetySettings,
    });

    const result = await chat.sendMessage(promptForGemini);
    const response = result.response;
    const optimizedClause = response.text(); // Annahme: Gemini gibt direkt den Text zurück

    return new Response(JSON.stringify({ optimizedClause }), { status: 200 });
  } catch (error) {
    console.error('Error optimizing clause with Gemini:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: 'Failed to optimize clause', details: errorMessage }), { status: 500 });
  }
} 