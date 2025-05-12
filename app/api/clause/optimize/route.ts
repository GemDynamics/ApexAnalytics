import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI-Client initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Request-Body parsen
    const body = await req.json();
    const { clauseText, preferredStatus = 'green', optimizationNotes = '' } = body;

    if (!clauseText) {
      return NextResponse.json(
        { error: 'Klauseltext ist erforderlich' },
        { status: 400 }
      );
    }

    // Systemanweisung für die Optimierung
    const systemPrompt = `Du bist ein KI-Rechtsexperte für Vertragsoptimierung.
Deine Aufgabe ist es, die gegebene Vertragsklausel zu optimieren, um sie rechtssicherer und ausgewogener zu gestalten.

Die optimierte Klausel soll folgende Kriterien erfüllen:
- Sie soll den Status "${preferredStatus}" erreichen (grün = unbedenklich, gelb = verhandelbar, rot = kritisch)
- Sie soll den gleichen grundlegenden Sinn und Zweck beibehalten
- Sie soll klarer und präziser formuliert sein
- Sie soll rechtssicher sein
- Sie soll die Interessen beider Vertragsparteien angemessen berücksichtigen

Berücksichtige bei der Optimierung auch die vom Benutzer angegebenen Optimierungshinweise.`;

    // OpenAI API aufrufen
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Zu optimierende Klausel:\n\n${clauseText}\n\nOptimierungshinweise:\n${optimizationNotes || 'Keine speziellen Hinweise angegeben.'}` 
        }
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    // Antwort extrahieren
    const optimizedText = response.choices[0].message.content?.trim();
    
    if (!optimizedText) {
      return NextResponse.json(
        { error: 'Keine Antwort vom KI-Modell erhalten' },
        { status: 500 }
      );
    }

    // Erfolgreiche Antwort
    return NextResponse.json({
      originalClauseText: clauseText,
      optimizedClauseText: optimizedText,
      optimizationNotes: optimizationNotes
    });
    
  } catch (error) {
    console.error('Fehler bei der Klauseloptimierung:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler bei der Klauseloptimierung' },
      { status: 500 }
    );
  }
} 