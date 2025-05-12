import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Typen
interface ContractElement {
  id: string;
  type: string; // "title", "heading", "clause", "text", etc.
  content: string;
  level?: number;
  parentId?: string;
}

// OpenAI-Client initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Systemanweisung für strukturierte Verarbeitung
    const systemPrompt = `Du bist ein KI-Assistent, der Verträge in strukturierte Elemente umwandelt.
Deine Aufgabe ist es, den Vertrag in die folgenden Elemente zu zerlegen:
- Titel
- Überschriften (mit hierarchischer Ebene)
- Klauseln/Abschnitte
- Normaler Text

Formatiere deine Ausgabe als JSON-Array, wobei jedes Element folgende Struktur hat:
{
  "id": "eindeutige ID",
  "type": "title" | "heading" | "clause" | "text",
  "content": "Text des Elements",
  "level": Hierarchieebene (nur für Überschriften),
  "parentId": "ID des übergeordneten Elements (falls vorhanden)"
}

Achte darauf, dass du komplexe Klauseln und Abschnitte korrekt identifizierst. Eine Klausel ist typischerweise ein rechtlich verbindlicher Teil eines Vertrags, der Rechte und Pflichten definiert.`;

    // OpenAI API aufrufen
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Titel: ${title || 'Vertrag'}\n\nInhalt:\n${contractText}` 
        }
      ],
      temperature: 0.2, // Niedriger für strukturiertere Antworten
      response_format: { type: 'json_object' },
    });

    // Antwort extrahieren und parsen
    const structureText = response.choices[0].message.content;
    
    if (!structureText) {
      return NextResponse.json(
        { error: 'Keine Antwort vom KI-Modell erhalten' },
        { status: 500 }
      );
    }

    let structuredElements: ContractElement[] = [];
    
    try {
      const parsedResponse = JSON.parse(structureText);
      structuredElements = parsedResponse.elements || [];
      
      // Fallback, falls das Format nicht korrekt ist
      if (!Array.isArray(structuredElements)) {
        structuredElements = [];
      }
    } catch (parseError) {
      console.error('Fehler beim Parsen der API-Antwort:', parseError);
      return NextResponse.json(
        { error: 'Fehler beim Verarbeiten der strukturierten Daten' },
        { status: 500 }
      );
    }

    // Erfolgreiche Antwort
    return NextResponse.json({
      title,
      originalText: contractText,
      structuredElements
    });
    
  } catch (error) {
    console.error('Fehler bei der Vertragsstrukturierung:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler bei der Vertragsstrukturierung' },
      { status: 500 }
    );
  }
} 