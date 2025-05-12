import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Typen
interface KnowledgeChunk {
  id: string;
  textContent: string;
  metadata: {
    source: string;
    type: string;
    keywords: string[];
    last_updated: string;
  };
}

interface ElementAnalysis {
  status: 'green' | 'yellow' | 'red';
  explanation: string;
  relevantChunks: string[];
  alternativeSuggestions?: string[];
}

// OpenAI-Client initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Dummy-Funktionen, die in einer echten Implementierung mit einer Vektordatenbank arbeiten würden
async function getRelevantKnowledgeChunks(clauseText: string, limit = 5): Promise<KnowledgeChunk[]> {
  // Hier würde normalerweise ein Vektorähnlichkeitssuche-API-Aufruf erfolgen
  
  // Dummy-Daten zurückgeben
  return [
    {
      id: "rule_yellow_flag_003",
      textContent: "Vertragserfüllungsbürgschaften über 10% der Auftragssumme sind verhandelbar, aber kritisch zu prüfen. Eine Reduzierung auf maximal 10% sollte angestrebt werden. Erfüllungsgarantien von 20% oder mehr sind zu hoch angesetzt und sollten reduziert werden.",
      metadata: {
        source: "Regeln für die Analyse.md",
        type: "Verhandelbare Klausel",
        keywords: ["Vertragserfüllungsbürgschaft", "Erfüllungsgarantie", "Bürgschaft", "Sicherheiten", "verhandelbare Klausel"],
        last_updated: "2024-07-15"
      }
    },
    {
      id: "legal_de_005",
      textContent: "Nach deutschem Recht kann die formularmäßige Forderung einer Bürgschaft 'auf erstes Anfordern' in AGB gemäß § 307 BGB häufig unwirksam sein, insbesondere wenn der Sicherungszweck unklar ist oder die Klausel mit anderen Sicherheiten kumuliert wird. Sie benachteiligt den Bürgen (und damit indirekt den Auftragnehmer) unangemessen, da sie dessen Einwendungsmöglichkeiten stark beschneidet. Der BGH prüft solche Klauseln sehr kritisch wegen des Missbrauchspotenzials und der Verlagerung des Risikos auf den Bürgen. Bezüglich der Höhe hat der BGH 10% der Auftragssumme für Vertragserfüllungsbürgschaften in AGB gebilligt. Die VOB/B sieht für die Gewährleistungssicherheit i.d.R. 5% der Abrechnungssumme vor (§ 17 VOB/B).",
      metadata: {
        source: "Juristische Analyse des deutschen Vertragsrechts.md",
        type: "Gesetzliche Regelung",
        keywords: ["Bürgschaft", "auf erstes Anfordern", "Sicherheiten", "§ 307 BGB", "Erfüllungsbürgschaft", "deutsches Recht"],
        last_updated: "2024-07-15"
      }
    }
  ];
}

export async function POST(req: NextRequest) {
  try {
    // Request-Body parsen
    const body = await req.json();
    const { clauseId, clauseText, contractTitle } = body;

    if (!clauseText) {
      return NextResponse.json(
        { error: 'Klauseltext ist erforderlich' },
        { status: 400 }
      );
    }

    // Relevante Wissens-Chunks aus der Vektordatenbank abrufen
    const relevantChunks = await getRelevantKnowledgeChunks(clauseText);
    
    // Kontext für die Analyse vorbereiten
    const contextInfo = relevantChunks.map(chunk => 
      `[${chunk.id}] ${chunk.textContent}`
    ).join('\n\n');

    // Systemanweisung für die Analyse
    const systemPrompt = `Du bist ein KI-Rechtsexperte für Vertragsanalyse.
Deine Aufgabe ist es, die gegebene Vertragsklausel zu analysieren und zu bewerten.

Du erhältst als Kontext relevante rechtliche Regelungen, Urteile und Analysestandards, die du für deine Bewertung nutzen sollst.

Bewerte die Klausel nach folgendem System:
- ROT: Kritische Klausel, die abgelehnt oder grundlegend überarbeitet werden sollte
- GELB: Verhandelbare Klausel, die angepasst werden sollte
- GRÜN: Akzeptable Klausel, die ohne Änderungen angenommen werden kann

Formatiere deine Ausgabe als JSON-Objekt mit folgender Struktur:
{
  "status": "red" | "yellow" | "green",
  "explanation": "Detaillierte Erklärung deiner Bewertung",
  "relevantChunks": ["IDs der relevanten Wissens-Chunks", "z.B. rule_red_flag_001"],
  "alternativeSuggestions": ["Vorschlag 1 für eine bessere Formulierung", "Vorschlag 2", "Vorschlag 3"]
}`;

    // OpenAI API aufrufen
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Vertragsklausel aus dem Vertrag "${contractTitle || 'Unbenannter Vertrag'}":\n\n${clauseText}\n\nRelevante rechtliche Regelungen und Standards:\n\n${contextInfo}` 
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    // Antwort extrahieren und parsen
    const analysisText = response.choices[0].message.content;
    
    if (!analysisText) {
      return NextResponse.json(
        { error: 'Keine Antwort vom KI-Modell erhalten' },
        { status: 500 }
      );
    }

    // Analyse parsen
    let analysis: ElementAnalysis;
    
    try {
      analysis = JSON.parse(analysisText) as ElementAnalysis;
      
      // Validierung der Analyse
      if (!analysis.status || !analysis.explanation || !analysis.relevantChunks) {
        throw new Error('Unvollständige Analyse');
      }
    } catch (parseError) {
      console.error('Fehler beim Parsen der Analyse:', parseError);
      return NextResponse.json(
        { error: 'Fehler beim Verarbeiten der Analysedaten' },
        { status: 500 }
      );
    }

    // Erfolgreiche Antwort
    return NextResponse.json({
      clauseId,
      analysis,
      knowledgeChunks: relevantChunks
    });
    
  } catch (error) {
    console.error('Fehler bei der Klauselanalyse:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler bei der Klauselanalyse' },
      { status: 500 }
    );
  }
} 