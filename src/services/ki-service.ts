import { ChatNachricht } from '../types/simulation';
import { Klausel } from '../types/vertrag';
import { SimulationModel } from '../models/simulation.model';
import { VertragModel } from '../models/vertrag.model';
import { VorbereitungModel } from '../models/vorbereitung.model';
import { connectToDatabase, generateId } from '../lib/db';
import { LLMService } from './llm-service';

/**
 * KI-Service für die Verhandlungssimulation
 */
export class KIService {
  /**
   * Generiert eine Antwort des Bauherrn basierend auf dem Kontext
   */
  static async generiereBauherrAntwort(
    simulationId: string,
    klauselId: string | null,
    nutzerNachricht: string
  ): Promise<ChatNachricht> {
    await connectToDatabase();
    
    // Simulation laden und mit Vertragsdaten anreichern
    const simulation = await SimulationModel.findById(simulationId);
    
    if (!simulation) {
      throw new Error('Simulation nicht gefunden');
    }
    
    const vertrag = await VertragModel.findById(simulation.vertragId);
    
    if (!vertrag) {
      throw new Error('Vertrag nicht gefunden');
    }
    
    // Vorbereitung laden
    const vorbereitung = await VorbereitungModel.findOne({ 
      vertragId: simulation.vertragId 
    });
    
    // Bisherige Nachrichten für den Kontext
    const bisherigeChatNachrichten = simulation.nachrichten.map((n: { absender: string; inhalt: string }) => ({
      absender: n.absender,
      inhalt: n.inhalt
    }));
    
    // Prompt vorbereiten
    let prompt: string;
    
    if (klauselId) {
      // Aktuelle Klausel finden
      const aktuelleKlausel = vertrag.klauseln.id(klauselId);
      
      if (!aktuelleKlausel) {
        throw new Error('Klausel nicht gefunden');
      }
      
      // Klausel-Strategie finden
      const klauselStrategie = vorbereitung?.klauselStrategien.find(
        (s: { klauselId: { toString: () => string } }) => s.klauselId.toString() === klauselId
      );
      
      prompt = this.erstelleVerhandlungsPrompt(
        aktuelleKlausel.toJSON() as Klausel,
        bisherigeChatNachrichten, 
        nutzerNachricht,
        klauselStrategie ? {
          argumente: klauselStrategie.argumente,
          strategie: klauselStrategie.strategie
        } : undefined
      );
    } else {
      // Begrüßungsprompt erstellen
      prompt = this.erstelleBegrüßungsPrompt(
        bisherigeChatNachrichten,
        nutzerNachricht,
        vorbereitung ? {
          globaleZiele: vorbereitung.globaleZiele,
          nichtVerhandelbarePunkte: vorbereitung.nichtVerhandelbarePunkte
        } : undefined
      );
    }
    
    // Gemini API über LLMService aufrufen
    try {
      const antwortText = await LLMService.getChatResponse(prompt, nutzerNachricht, 0.7, 500);
      
      // Antwort erstellen
      const antwort: ChatNachricht = {
        id: generateId(),
        absender: 'bauherr',
        inhalt: antwortText,
        zeitstempel: new Date(),
        bezugKlauselId: klauselId || undefined
      };
      
      return antwort;
    } catch (error) {
      console.error('Gemini API Fehler:', error);
      
      // Fallback-Antwort bei API-Fehler
      return {
        id: generateId(),
        absender: 'bauherr',
        inhalt: 'Ich muss kurz nachdenken... Können wir diesen Punkt später besprechen?',
        zeitstempel: new Date(),
        bezugKlauselId: klauselId || undefined
      };
    }
  }
  
  /**
   * Erstellt einen Prompt für die Verhandlung über eine bestimmte Klausel
   */
  private static erstelleVerhandlungsPrompt(
    klausel: Klausel,
    bisherigeChatNachrichten: Array<{ absender: string; inhalt: string }>,
    neueNachricht: string,
    klauselStrategie?: { argumente: string; strategie: string }
  ): string {
    // Risikobewertung für den Prompt
    const risikoBeschreibung = this.getRisikoBeschreibung(klausel.risikoFarbe);
    
    // Formatiere bisherige Nachrichten
    const chatVerlauf = bisherigeChatNachrichten
      .map(msg => `${msg.absender === 'bauherr' ? 'Bauherr' : 'Bauunternehmer'}: ${msg.inhalt}`)
      .join('\n\n');
    
    // Prompt zusammenbauen
    return `
Du bist der Bauherr in einer Vertragsverhandlung mit einem Bauunternehmen.

Die aktuelle Klausel, über die verhandelt wird, lautet:
"${klausel.inhalt}"

Deine Risikobewertung zu dieser Klausel: ${risikoBeschreibung}

${klauselStrategie?.argumente ? `
Der Bauunternehmer wird vermutlich mit folgenden Argumenten argumentieren:
${klauselStrategie.argumente}
` : ''}

${klauselStrategie?.strategie ? `
Der Verhandlungsstil soll dem angepasst werden:
${klauselStrategie.strategie}
` : ''}

Bisheriger Chatverlauf:
${chatVerlauf}

Reagiere jetzt als Bauherr auf die letzte Nachricht des Bauunternehmers. Du bist dabei:
- Fachkundig im Bauwesen und Vertragsrecht
- Vorsichtig bei risikoreichen Klauseln (Rot)
- Verhandlungsbereit, aber bedacht bei mittlerem Risiko (Gelb)
- Offen und konstruktiv bei geringem Risiko (Grün)
- Immer darauf bedacht, einen fairen Vertrag zu erreichen, aber primär deine eigenen Interessen zu schützen

Antworte in natürlichem, geschäftlichem Deutsch wie ein echter Bauherr. Du darfst auch nachfragen und um Erklärungen bitten.
`;
  }
  
  /**
   * Erstellt einen Prompt für die Begrüßung/Einleitung
   */
  private static erstelleBegrüßungsPrompt(
    bisherigeChatNachrichten: Array<{ absender: string; inhalt: string }>,
    neueNachricht: string,
    vorbereitungsDaten?: { globaleZiele: string; nichtVerhandelbarePunkte: string }
  ): string {
    // Formatiere bisherige Nachrichten
    const chatVerlauf = bisherigeChatNachrichten
      .map(msg => `${msg.absender === 'bauherr' ? 'Bauherr' : 'Bauunternehmer'}: ${msg.inhalt}`)
      .join('\n\n');
    
    // Prompt zusammenbauen
    return `
Du bist der Bauherr in einer Vertragsverhandlung mit einem Bauunternehmen.

${vorbereitungsDaten?.globaleZiele ? `
Der Bauunternehmer hat folgende Ziele für die Verhandlung:
${vorbereitungsDaten.globaleZiele}
` : ''}

${vorbereitungsDaten?.nichtVerhandelbarePunkte ? `
Für den Bauunternehmer sind folgende Punkte nicht verhandelbar:
${vorbereitungsDaten.nichtVerhandelbarePunkte}
` : ''}

${chatVerlauf ? `
Bisheriger Chatverlauf:
${chatVerlauf}
` : `
Dies ist der Beginn der Verhandlung. Begrüße den Bauunternehmer, stelle dich vor und erkläre, dass du über bestimmte Vertragsklauseln sprechen möchtest, die dir Sorgen bereiten. Sei höflich, aber bestimmt.
`}

Reagiere jetzt als Bauherr auf die letzte Nachricht des Bauunternehmers oder beginne die Verhandlung mit einer Begrüßung. Du bist dabei:
- Professionell und geschäftlich
- An einer konstruktiven Zusammenarbeit interessiert
- Aber auch bestrebt, deine Interessen zu schützen
- Besorgt über potenzielle Risiken im Vertrag

Antworte in natürlichem, geschäftlichem Deutsch wie ein echter Bauherr.
`;
  }
  
  /**
   * Liefert eine Beschreibung des Risikos basierend auf der Risiko-Farbe
   */
  private static getRisikoBeschreibung(risikoFarbe: string): string {
    switch (risikoFarbe) {
      case 'rot':
        return 'HOHES RISIKO - Diese Klausel ist für dich sehr problematisch und sollte in dieser Form nicht akzeptiert werden. Bestehe auf wesentlichen Änderungen.';
      
      case 'gelb':
        return 'MITTLERES RISIKO - Diese Klausel enthält Aspekte, die für dich nachteilig sein könnten. Verhandle Anpassungen, um das Risiko zu minimieren.';
      
      case 'grün':
        return 'GERINGES RISIKO - Diese Klausel ist weitgehend akzeptabel, könnte aber in einzelnen Punkten noch verbessert werden.';
      
      default:
        return 'Risikobewertung unklar - Wende Vorsicht an und kläre unklare Aspekte.';
    }
  }
} 