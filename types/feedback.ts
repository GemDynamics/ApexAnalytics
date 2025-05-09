export interface Bewertungspunkt {
  id: string;
  text: string;
  gewichtung: number;
  kategorie: string;
}

export interface VerhandlungsFeedback {
  id: string;
  simulationId: string;
  erstelltAm: string;
  gesamtBewertung: number;
  stärken: Bewertungspunkt[];
  verbesserungsPotenzial: Bewertungspunkt[];
  emotionaleIntelligenz: Bewertungspunkt[];
  tippsNächsteVerhandlung: string;
  nächsteÜbungEmpfohlenIn: number;
} 