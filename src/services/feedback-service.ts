import { FeedbackModel } from '../models/feedback.model';
import { SimulationModel } from '../models/simulation.model';
import { VertragModel } from '../models/vertrag.model';
import { VorbereitungModel } from '../models/vorbereitung.model';
import { VerhandlungsFeedback, Bewertungspunkt, SimulationsAnalyse, KommunikationsMetriken } from '../types/feedback';
import { connectToDatabase, generateId, isValidObjectId, toObjectId } from '../lib/db';
import { LLMService } from './llm-service';

/**
 * Service zur Generierung und Verwaltung von Feedback
 */
export class FeedbackService {
  /**
   * Gibt ein Feedback anhand der Simulations-ID zurück
   */
  static async getFeedbackBySimulationId(simulationId: string): Promise<VerhandlungsFeedback | null> {
    if (!isValidObjectId(simulationId)) {
      return null;
    }
    
    await connectToDatabase();
    
    // Prüfen, ob bereits ein Feedback existiert
    const existingFeedback = await FeedbackModel.findOne({ 
      simulationId: toObjectId(simulationId) 
    });
    
    if (existingFeedback) {
      return existingFeedback.toJSON() as VerhandlungsFeedback;
    }
    
    // Neues Feedback erstellen
    return await this.generiereFeedback(simulationId);
  }

  /**
   * Generiert ein neues Feedback anhand der Simulation
   */
  static async generiereFeedback(simulationId: string): Promise<VerhandlungsFeedback> {
    if (!isValidObjectId(simulationId)) {
      throw new Error('Ungültige Simulations-ID');
    }
    
    await connectToDatabase();
    
    // Simulation abrufen
    const simulation = await SimulationModel.findById(simulationId)
      .populate('vertragId');
    
    if (!simulation) {
      throw new Error('Simulation nicht gefunden');
    }
    
    if (simulation.status !== 'beendet') {
      throw new Error('Die Simulation wurde noch nicht beendet');
    }
    
    // Simulationsanalyse durchführen
    const analyse = await this.analysiereSimulation(simulation);
    
    // Stärken und Verbesserungspotenzial ermitteln
    const stärken = await this.identifiziereStärken(analyse);
    const verbesserungen = await this.identifiziereVerbesserungen(analyse);
    const emotionaleIntelligenz = await this.bewerteEmotionaleIntelligenz(analyse);
    
    // Tipps für die nächste Verhandlung generieren
    const tipps = await this.generiereTipps(analyse);
    
    // Gesamtbewertung berechnen
    const gesamtBewertung = this.berechneGesamtbewertung(analyse);
    
    // Empfohlenes Übungsintervall basierend auf der Gesamtbewertung
    const nächsteÜbungEmpfohlenIn = Math.max(1, Math.round((gesamtBewertung / 100) * 7) + 1);
    
    // Feedback erstellen und speichern
    const feedback = await FeedbackModel.create({
      simulationId: toObjectId(simulationId),
      erstelltAm: new Date(),
      gesamtBewertung,
      stärken,
      verbesserungsPotenzial: verbesserungen,
      emotionaleIntelligenz,
      tippsNächsteVerhandlung: tipps,
      nächsteÜbungEmpfohlenIn
    });
    
    return feedback.toJSON() as VerhandlungsFeedback;
  }

  /**
   * Analysiert eine Simulation und erstellt eine Analysezusammenfassung
   */
  private static async analysiereSimulation(simulation: any): Promise<SimulationsAnalyse> {
    // Bauunternehmer-Nachrichten für Analyse extrahieren
    const bauunternehmerNachrichten = simulation.nachrichten.filter(
      (n: any) => n.absender === 'bauunternehmer'
    );
    
    // Kommunikationsmetriken analysieren
    const kommunikationsMetriken = await this.analysiereKommunikation(bauunternehmerNachrichten);
    
    // Klauselbezogene Analyse
    const klauselBewertungen = await this.analysiereKlauselVerhandlungen(
      simulation.nachrichten,
      simulation.vertragId.klauseln
    );
    
    return {
      simulationId: simulation._id.toString(),
      klauselBewertungen,
      kommunikationsMetriken
    };
  }

  /**
   * Analysiert die Kommunikation des Bauunternehmers
   */
  private static async analysiereKommunikation(nachrichten: any[]): Promise<KommunikationsMetriken> {
    // Prompt für die KI-basierte Analyse erstellen
    const nachrichtenText = nachrichten.map(n => n.inhalt).join('\n\n');
    
    const prompt = `
Analysiere diese Nachrichten eines Bauunternehmers in einer Vertragsverhandlung:

${nachrichtenText}

Bewerte folgende Aspekte quantitativ auf einer Skala von 0 bis 10:
1. Verwendung positiver Formulierungen statt Konfrontation
2. Unterstützung mit konkreten Fakten und Zahlen
3. Empathisches Eingehen auf Bedenken des Gegenübers
4. Häufigkeit und Qualität von Kompromissangeboten
5. Klarheit der eigenen Position

Antworte nur im folgenden JSON-Format ohne weitere Erklärungen:
{
  "positiveFormulierungen": ZAHL,
  "konkreteFakten": ZAHL,
  "empathischeAussagen": ZAHL,
  "kompromissAngebote": ZAHL,
  "klarePositionen": ZAHL
}
`;
    
    try {
      // Gemini API über LLMService aufrufen
      const analysisResult = await LLMService.getJsonResponse<{
        positiveFormulierungen: number;
        konkreteFakten: number;
        empathischeAussagen: number;
        kompromissAngebote: number;
        klarePositionen: number;
      }>(prompt, 0.3, 500);
      
      return {
        positiveFormulierungen: analysisResult.positiveFormulierungen || 5,
        konkreteFakten: analysisResult.konkreteFakten || 5,
        empathischeAussagen: analysisResult.empathischeAussagen || 5,
        kompromissAngebote: analysisResult.kompromissAngebote || 5,
        klarePositionen: analysisResult.klarePositionen || 5
      };
    } catch (error) {
      console.error('Fehler bei der KI-Analyse der Kommunikation:', error);
      
      // Fallback-Werte bei Fehler
      return {
        positiveFormulierungen: 5,
        konkreteFakten: 5,
        empathischeAussagen: 5,
        kompromissAngebote: 5,
        klarePositionen: 5
      };
    }
  }

  /**
   * Analysiert die Verhandlungen zu einzelnen Klauseln
   */
  private static async analysiereKlauselVerhandlungen(nachrichten: any[], klauseln: any[]): Promise<any[]> {
    // Nachrichten nach Klausel gruppieren
    const nachrichtenProKlausel: Record<string, any[]> = {};
    
    nachrichten.forEach((nachricht: any) => {
      if (nachricht.bezugKlauselId) {
        const klauselId = nachricht.bezugKlauselId.toString();
        
        if (!nachrichtenProKlausel[klauselId]) {
          nachrichtenProKlausel[klauselId] = [];
        }
        
        nachrichtenProKlausel[klauselId].push(nachricht);
      }
    });
    
    // Ergebnisarray für die Bewertungen
    const bewertungen = [];
    
    // Jede Klausel bewerten, zu der Nachrichten existieren
    for (const klausel of klauseln) {
      const klauselId = klausel._id.toString();
      
      // Nur Klauseln mit Nachrichten bewerten
      if (nachrichtenProKlausel[klauselId] && nachrichtenProKlausel[klauselId].length > 0) {
        const klauselNachrichten = nachrichtenProKlausel[klauselId];
        
        // Bauunternehmer-Nachrichten zu dieser Klausel
        const bauunternehmerNachrichten = klauselNachrichten.filter(
          (n: any) => n.absender === 'bauunternehmer'
        );
        
        // Nur bewerten, wenn der Bauunternehmer etwas geschrieben hat
        if (bauunternehmerNachrichten.length > 0) {
          // Einfache heuristische Bewertung
          const erfolgsgrad = await this.bewerteErfolgsgrad(klauselNachrichten, klausel);
          const stärken = await this.ermittleKlauselStärken(bauunternehmerNachrichten, klausel);
          const verbesserungen = await this.ermittleKlauselVerbesserungen(bauunternehmerNachrichten, klausel);
          
          // Numerische Bewertung basierend auf Erfolgsgrad
          let bewertung = 0;
          switch (erfolgsgrad) {
            case 'erfolgreich':
              bewertung = 85 + Math.floor(Math.random() * 15); // 85-100
              break;
            case 'teilweise':
              bewertung = 50 + Math.floor(Math.random() * 35); // 50-85
              break;
            case 'nicht_erfolgreich':
              bewertung = 30 + Math.floor(Math.random() * 20); // 30-50
              break;
          }
          
          bewertungen.push({
            klauselId,
            klauselTitel: klausel.titel,
            erfolgsgrad,
            stärken,
            verbesserungen,
            bewertung
          });
        }
      }
    }
    
    return bewertungen;
  }

  /**
   * Bewertet den Erfolgsgrad einer Klauselverhandlung
   */
  private static async bewerteErfolgsgrad(klauselNachrichten: any[], klausel: any): Promise<string> {
    const nachrichtenText = klauselNachrichten.map(n => 
      `${n.absender === 'bauherr' ? 'Bauherr' : 'Bauunternehmer'}: ${n.inhalt}`
    ).join('\n\n');
    
    const klauselText = klausel.inhalt || 'Keine Klauseldetails verfügbar';
    const klauselRisiko = klausel.risikoFarbe || 'Risiko unbekannt';
    
    const prompt = `
Analysiere die folgende Verhandlung über eine Vertragsklausel zwischen einem Bauunternehmer und einem Bauherrn:

Klausel: "${klauselText}"
Risiko: ${klauselRisiko}

Gesprächsverlauf:
${nachrichtenText}

Bewerte den Erfolgsgrad des Bauunternehmers bei der Verhandlung dieser Klausel.
- "erfolgreich" = Der Bauunternehmer hat seine Interessen durchgesetzt und eine vorteilhafte Einigung erzielt
- "teilweise" = Der Bauunternehmer hat Kompromisse erreicht, aber nicht alle Ziele durchgesetzt
- "nicht_erfolgreich" = Der Bauunternehmer konnte kaum Zugeständnisse erreichen

Antworte NUR mit einem der drei Werte: "erfolgreich", "teilweise" oder "nicht_erfolgreich"
`;
    
    try {
      const ergebnis = await LLMService.getChatResponse(prompt, "", 0.3, 100);
      const bereinigt = ergebnis.trim().toLowerCase().replace(/["\s]/g, '');
      
      // Validiere das Ergebnis
      if (['erfolgreich', 'teilweise', 'nicht_erfolgreich'].includes(bereinigt)) {
        return bereinigt;
      } else {
        // Fallback bei unerwarteter Antwort
        return 'teilweise';
      }
    } catch (error) {
      console.error('Fehler bei der Erfolgsbewertung:', error);
      return 'teilweise'; // Fallback
    }
  }

  /**
   * Ermittelt Stärken in der Verhandlung einer spezifischen Klausel
   */
  private static async ermittleKlauselStärken(bauunternehmerNachrichten: any[], klausel: any): Promise<string[]> {
    const nachrichtenText = bauunternehmerNachrichten.map(n => n.inhalt).join('\n\n');
    const klauselText = klausel.inhalt || 'Keine Klauseldetails verfügbar';
    
    const prompt = `
Analysiere die Verhandlungstaktik des Bauunternehmers für diese Vertragsklausel:

Klausel: "${klauselText}"

Nachrichten des Bauunternehmers:
${nachrichtenText}

Nenne die 2-3 größten Stärken in der Verhandlungsführung des Bauunternehmers.
Antworte AUSSCHLIESSLICH im JSON-Format als Array von Strings:
["Stärke 1", "Stärke 2", "Stärke 3"]
`;
    
    try {
      const stärken = await LLMService.getJsonResponse<string[]>(prompt, 0.3, 300);
      return Array.isArray(stärken) ? stärken.slice(0, 3) : ['Konstruktive Kommunikation'];
    } catch (error) {
      console.error('Fehler bei der Stärkenanalyse:', error);
      return ['Konstruktive Kommunikation']; // Fallback
    }
  }

  /**
   * Ermittelt Verbesserungspotenziale in der Verhandlung einer spezifischen Klausel
   */
  private static async ermittleKlauselVerbesserungen(bauunternehmerNachrichten: any[], klausel: any): Promise<string[]> {
    const nachrichtenText = bauunternehmerNachrichten.map(n => n.inhalt).join('\n\n');
    const klauselText = klausel.inhalt || 'Keine Klauseldetails verfügbar';
    
    const prompt = `
Analysiere die Verhandlungstaktik des Bauunternehmers für diese Vertragsklausel:

Klausel: "${klauselText}"

Nachrichten des Bauunternehmers:
${nachrichtenText}

Nenne 2-3 konkrete Verbesserungsvorschläge für die Verhandlungsführung des Bauunternehmers.
Antworte AUSSCHLIESSLICH im JSON-Format als Array von Strings:
["Verbesserungsvorschlag 1", "Verbesserungsvorschlag 2", "Verbesserungsvorschlag 3"]
`;
    
    try {
      const verbesserungen = await LLMService.getJsonResponse<string[]>(prompt, 0.3, 300);
      return Array.isArray(verbesserungen) ? verbesserungen.slice(0, 3) : ['Konkretere Alternativvorschläge machen'];
    } catch (error) {
      console.error('Fehler bei der Verbesserungsanalyse:', error);
      return ['Konkretere Alternativvorschläge machen']; // Fallback
    }
  }

  /**
   * Identifiziert die Hauptstärken des Bauunternehmers in der Simulation
   */
  private static async identifiziereStärken(analyse: SimulationsAnalyse): Promise<Bewertungspunkt[]> {
    // Kommunikationsmetriken in eine sortierte Liste umwandeln
    const metriken = [
      { name: "Positive Formulierung", wert: analyse.kommunikationsMetriken.positiveFormulierungen },
      { name: "Faktenbasis", wert: analyse.kommunikationsMetriken.konkreteFakten },
      { name: "Empathische Kommunikation", wert: analyse.kommunikationsMetriken.empathischeAussagen },
      { name: "Kompromissbereitschaft", wert: analyse.kommunikationsMetriken.kompromissAngebote },
      { name: "Klarheit der Position", wert: analyse.kommunikationsMetriken.klarePositionen }
    ].sort((a, b) => b.wert - a.wert);
    
    // Die beiden stärksten Kommunikationsaspekte als Stärken übernehmen
    const kommunikationsStärken = metriken
      .slice(0, 2)
      .filter(m => m.wert >= 6) // Nur echte Stärken hervorheben
      .map(m => ({
        id: generateId(),
        titel: m.name,
        beschreibung: this.getStärkenBeschreibung(m.name)
      }));
    
    // Klauselstärken sammeln
    const klauselStärken: Bewertungspunkt[] = [];
    
    // Die Stärken aus den Klauselbewertungen zusammenführen
    analyse.klauselBewertungen.forEach(bewertung => {
      if (bewertung.stärken && bewertung.stärken.length > 0) {
        bewertung.stärken.forEach(stärke => {
          // Prüfen, ob eine ähnliche Stärke bereits existiert
          const existiert = klauselStärken.some(
            ks => this.ähnlicheStärke(ks.titel || "", stärke)
          );
          
          if (!existiert) {
            klauselStärken.push({
              id: generateId(),
              titel: stärke,
              beschreibung: ""
            });
          }
        });
      }
    });
    
    // Die häufigsten/wichtigsten Klauselstärken extrahieren
    // In einer realen Implementierung würde hier KI verwendet werden
    
    // Kombiniere alle Stärken und begrenze auf max. 5
    const alleStärken = [...kommunikationsStärken, ...klauselStärken].slice(0, 5);
    
    if (alleStärken.length === 0) {
      // Fallback, wenn keine Stärken identifiziert wurden
      return [{
        id: generateId(),
        titel: "Konstruktive Gesprächsführung",
        beschreibung: "Sie haben die Verhandlung konstruktiv geführt und sich auf Lösungen konzentriert."
      }];
    }
    
    return alleStärken;
  }
  
  /**
   * Gibt eine Beschreibung für eine identifizierte Stärke zurück
   */
  private static getStärkenBeschreibung(stärke: string): string {
    const beschreibungen: Record<string, string> = {
      "Positive Formulierung": "Sie verwenden positive Formulierungen und vermeiden Konfrontation, was die Verhandlungsatmosphäre verbessert.",
      "Faktenbasis": "Sie untermauern Ihre Argumente mit konkreten Fakten und Zahlen, was Ihre Position stärkt.",
      "Empathische Kommunikation": "Sie gehen einfühlsam auf die Bedenken Ihres Gegenübers ein und zeigen Verständnis.",
      "Kompromissbereitschaft": "Sie signalisieren Bereitschaft zu Kompromissen, ohne Ihre Kerninteressen aufzugeben.",
      "Klarheit der Position": "Sie kommunizieren Ihre Position klar und unmissverständlich, was Missverständnisse vermeidet."
    };
    
    return beschreibungen[stärke] || 
      "Sie haben in diesem Bereich eine besondere Stärke gezeigt, die zum Verhandlungserfolg beigetragen hat.";
  }
  
  /**
   * Prüft, ob zwei Stärken inhaltlich ähnlich sind
   */
  private static ähnlicheStärke(stärke1: string, stärke2: string): boolean {
    // Einfache Implementierung basierend auf gemeinsamen Schlüsselwörtern
    const keywords1 = stärke1.toLowerCase().split(/\s+/);
    const keywords2 = stärke2.toLowerCase().split(/\s+/);
    
    // Zähle gemeinsame Wörter
    const gemeinsameWörter = keywords1.filter(w => keywords2.includes(w)).length;
    
    // Als ähnlich betrachten, wenn mindestens 30% der Wörter übereinstimmen
    const ähnlichkeitsQuote = gemeinsameWörter / Math.min(keywords1.length, keywords2.length);
    
    return ähnlichkeitsQuote >= 0.3;
  }
  
  /**
   * Identifiziert Verbesserungspotenziale in der Simulation
   */
  private static async identifiziereVerbesserungen(analyse: SimulationsAnalyse): Promise<Bewertungspunkt[]> {
    // JSON-String des gesamten Analyseprotokolls erstellen
    const analyseJson = JSON.stringify(analyse, null, 2);
    
    const prompt = `
Analysiere folgendes Protokoll einer Vertragsverhandlungssimulation zwischen Bauunternehmer und Bauherr:

${analyseJson}

Identifiziere die 3-4 wichtigsten Verbesserungspotenziale für den Bauunternehmer.
Gib für jedes Verbesserungspotenzial einen Titel und eine kurze Beschreibung.

Antworte ausschließlich im folgenden JSON-Format:
[
  {
    "titel": "Titel des Verbesserungspotenzials 1",
    "beschreibung": "Konkrete Beschreibung mit Handlungsempfehlung"
  },
  {
    "titel": "Titel des Verbesserungspotenzials 2",
    "beschreibung": "Konkrete Beschreibung mit Handlungsempfehlung"
  }
]
`;
    
    try {
      const verbesserungen = await LLMService.getJsonResponse<Bewertungspunkt[]>(prompt, 0.3, 800);
      
      if (Array.isArray(verbesserungen) && verbesserungen.length > 0) {
        // Füge IDs zu den Bewertungspunkten hinzu
        return verbesserungen.slice(0, 4).map(verbesserung => ({
          ...verbesserung,
          id: generateId()
        }));
      }
    } catch (error) {
      console.error('Fehler bei der Analyse der Verbesserungspotenziale:', error);
    }
    
    // Fallback: Kommunikations-Schwächen ermitteln
    const schwächen = Object.entries(analyse.kommunikationsMetriken)
      .filter(([_, wert]) => wert < 6)
      .map(([key, _]) => {
        switch (key) {
          case 'positiveFormulierungen':
            return {
              id: generateId(),
              titel: "Positivere Formulierungen",
              beschreibung: "Verwenden Sie positivere Formulierungen und vermeiden Sie konfrontative Aussagen."
            };
          case 'konkreteFakten':
            return {
              id: generateId(),
              titel: "Mehr Fakten und Zahlen",
              beschreibung: "Untermauern Sie Ihre Argumente stärker mit konkreten Fakten, Zahlen und Beispielen."
            };
          case 'empathischeAussagen':
            return {
              id: generateId(),
              titel: "Mehr Empathie zeigen",
              beschreibung: "Gehen Sie stärker auf die Bedenken und Bedürfnisse Ihres Gegenübers ein."
            };
          case 'kompromissAngebote':
            return {
              id: generateId(),
              titel: "Kompromissbereitschaft signalisieren",
              beschreibung: "Machen Sie öfter konkrete Kompromissvorschläge, um die Verhandlung voranzubringen."
            };
          case 'klarePositionen':
            return {
              id: generateId(),
              titel: "Klarere Positionierung",
              beschreibung: "Formulieren Sie Ihre Position und Ihre Forderungen deutlicher und präziser."
            };
          default:
            return null;
        }
      })
      .filter(item => item !== null) as Bewertungspunkt[];
    
    if (schwächen.length > 0) {
      return schwächen.slice(0, 3);
    }
    
    // Absoluter Fallback
    return [{
      id: generateId(),
      titel: "Detailliertere Argumentation",
      beschreibung: "Untermauern Sie Ihre Argumente mit mehr Details und konkreten Beispielen aus der Baubranche."
    }];
  }

  /**
   * Bewertet die emotionale Intelligenz in der Verhandlung
   */
  private static async bewerteEmotionaleIntelligenz(analyse: SimulationsAnalyse): Promise<Bewertungspunkt[]> {
    // Baue einen Prompt für die Analyse der emotionalen Intelligenz auf
    const analyseJson = JSON.stringify(analyse, null, 2);
    
    const prompt = `
Analysiere folgendes Protokoll einer Vertragsverhandlungssimulation zwischen Bauunternehmer und Bauherr:

${analyseJson}

Bewerte die emotionale Intelligenz des Bauunternehmers in der Verhandlung.
Identifiziere 2-3 Aspekte, in denen emotionale Intelligenz gezeigt wurde oder verbessert werden könnte.

Antworte ausschließlich im folgenden JSON-Format:
[
  {
    "titel": "Aspekt der emotionalen Intelligenz 1",
    "beschreibung": "Konkrete Beschreibung mit Beispiel oder Empfehlung"
  },
  {
    "titel": "Aspekt der emotionalen Intelligenz 2",
    "beschreibung": "Konkrete Beschreibung mit Beispiel oder Empfehlung"
  }
]
`;
    
    try {
      const emotionaleIntelligenz = await LLMService.getJsonResponse<Bewertungspunkt[]>(prompt, 0.4, 600);
      
      if (Array.isArray(emotionaleIntelligenz) && emotionaleIntelligenz.length > 0) {
        // Füge IDs zu den Bewertungspunkten hinzu
        return emotionaleIntelligenz.slice(0, 3).map(punkt => ({
          ...punkt,
          id: generateId()
        }));
      }
    } catch (error) {
      console.error('Fehler bei der Analyse der emotionalen Intelligenz:', error);
    }
    
    // Fallback für emotionale Intelligenz
    return [
      {
        id: generateId(),
        titel: "Empathisches Zuhören",
        beschreibung: "Sie haben Verständnis für die Perspektive des Bauherrn gezeigt und aktiv zugehört."
      },
      {
        id: generateId(),
        titel: "Positive Gesprächsatmosphäre",
        beschreibung: "Trotz teilweise unterschiedlicher Positionen haben Sie eine konstruktive Gesprächsatmosphäre aufrechterhalten."
      }
    ];
  }

  /**
   * Generiert Tipps für die nächste Verhandlung
   */
  private static async generiereTipps(analyse: SimulationsAnalyse): Promise<string> {
    // Baue einen Prompt für die Generierung von Tipps auf
    const analyseJson = JSON.stringify(analyse, null, 2);
    
    const prompt = `
Analysiere folgendes Protokoll einer Vertragsverhandlungssimulation zwischen Bauunternehmer und Bauherr:

${analyseJson}

Basierend auf dieser Analyse, formuliere 3-4 konkrete, praktische Tipps für den Bauunternehmer für seine nächste Vertragsverhandlung.
Die Tipps sollten spezifisch, umsetzbar und auf die identifizierten Verbesserungspotenziale ausgerichtet sein.

Gib die Antwort als zusammenhängenden Paragraph ohne Aufzählungszeichen.
`;
    
    try {
      // Hier verwenden wir direkt getChatResponse, da wir keinen JSON-Output erwarten
      const tipps = await LLMService.getChatResponse(prompt, "", 0.5, 400);
      return tipps;
    } catch (error) {
      console.error('Fehler bei der Generierung von Tipps:', error);
      
      // Fallback für Tipps
      return "Bereiten Sie Ihre Argumente besser vor und untermauern Sie diese mit konkreten Zahlen und Fakten. Zeigen Sie mehr Verständnis für die Perspektive des Bauherrn und gehen Sie auf seine Bedenken ein. Formulieren Sie Ihre Vorschläge positiv und lösungsorientiert, um eine konstruktive Gesprächsatmosphäre zu fördern.";
    }
  }

  /**
   * Berechnet die Gesamtbewertung auf Basis der Analyse
   */
  private static berechneGesamtbewertung(analyse: SimulationsAnalyse): number {
    // Durchschnittliche Bewertung der Klauseln berechnen
    let klauselBewertungSumme = 0;
    const klauselBewertungen = analyse.klauselBewertungen.map(k => k.bewertung);
    
    if (klauselBewertungen.length > 0) {
      klauselBewertungSumme = klauselBewertungen.reduce((a, b) => a + b, 0) / klauselBewertungen.length;
    }
    
    // Kommunikationsmetrik-Punkte (0-100 Skala)
    const kommunikationsPunkte = 
      (analyse.kommunikationsMetriken.positiveFormulierungen + 
       analyse.kommunikationsMetriken.konkreteFakten + 
       analyse.kommunikationsMetriken.empathischeAussagen + 
       analyse.kommunikationsMetriken.kompromissAngebote + 
       analyse.kommunikationsMetriken.klarePositionen) * 2;
    
    // Gewichteter Durchschnitt: 60% Klauseln, 40% Kommunikation
    const gesamtBewertung = Math.round(klauselBewertungSumme * 0.6 + (kommunikationsPunkte / 10) * 0.4);
    
    // Begrenze die Bewertung auf 0-100
    return Math.min(100, Math.max(0, gesamtBewertung));
  }
} 