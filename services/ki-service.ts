export interface ChatNachricht {
  id: string;
  absender: 'bauunternehmer' | 'bauherr';
  inhalt: string;
  zeitstempel: string;
  bezugKlauselId?: string | null;
}

export class KIService {
  async generiereBauherrNachricht(
    simulationId: string, 
    klauselId: string | null, 
    nutzerNachricht: string
  ): Promise<ChatNachricht> {
    // In einer realen Implementierung würde hier ein Aufruf an einen KI-Service stehen
    // Für Demozwecke erstellen wir eine einfache Antwort
    
    console.log(`KI-Anfrage für Simulation ${simulationId}, Klausel ${klauselId || 'keine'}`);
    
    // Simulierte Antwort nach einer kurzen Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: this.generateId(),
      absender: 'bauherr',
      inhalt: `Als Bauherr antworte ich auf: "${nutzerNachricht}"\n\nWir können gerne über diesen Punkt verhandeln, aber ich möchte darauf hinweisen, dass die vorgeschlagenen Bedingungen für mich nicht optimal sind.`,
      zeitstempel: new Date().toISOString(),
      bezugKlauselId: klauselId
    };
  }
  
  async generiereFeedback(simulationId: string): Promise<any> {
    // Simulierte Antwort mit Feedback
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      gesamtBewertung: Math.floor(Math.random() * 30) + 60, // Zufallswert zwischen 60-90
      stärken: [
        { id: '1', text: 'Gute Argumentation bei Haftungsfragen', gewichtung: 4, kategorie: 'Argumentation' },
        { id: '2', text: 'Klare Kommunikation der eigenen Positionen', gewichtung: 5, kategorie: 'Kommunikation' }
      ],
      verbesserungsPotenzial: [
        { id: '1', text: 'Höhere Flexibilität bei Zahlungsbedingungen zeigen', gewichtung: 3, kategorie: 'Verhandlung' },
        { id: '2', text: 'Mehr Kompromissbereitschaft bei Randthemen', gewichtung: 2, kategorie: 'Strategie' }
      ],
      emotionaleIntelligenz: [
        { id: '1', text: 'Sachlich auch bei kontroversen Themen geblieben', gewichtung: 4, kategorie: 'Emotion' }
      ],
      tippsNächsteVerhandlung: 'Bereiten Sie konkrete Alternativvorschläge vor, besonders bei Zahlungsbedingungen. Identifizieren Sie frühzeitig Punkte für mögliche Zugeständnisse.',
      nächsteÜbungEmpfohlenIn: Math.floor(Math.random() * 6) + 3 // 3-8 Tage
    };
  }
  
  protected generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
} 