/**
 * Feedback-Typen für die Verhandlungsanalyse
 */

export interface VerhandlungsFeedback {
  id: string;
  simulationId: string;
  erstelltAm: Date;
  gesamtBewertung: number; // 0-100
  stärken: Bewertungspunkt[];
  verbesserungsPotenzial: Bewertungspunkt[];
  emotionaleIntelligenz: Bewertungspunkt[];
  tippsNächsteVerhandlung: string;
  nächsteÜbungEmpfohlenIn: number; // Tage
}

export interface Bewertungspunkt {
  id?: string;            // Wird für bestehende Implementierungen beibehalten
  titel?: string;         // Neues Format: Titel
  beschreibung?: string;  // Neues Format: Beschreibung
  text?: string;          // Altes Format: Text
  gewichtung?: number;    // Altes Format: 1-5
  kategorie?: 'stärke' | 'verbesserung' | 'emotionaleIntelligenz';  // Altes Format: Kategorie
}

export interface KlauselBewertung {
  klauselId: string;
  klauselTitel: string;
  erfolgsgrad: 'erfolgreich' | 'teilweise' | 'nicht_erfolgreich';
  stärken: string[];
  verbesserungen: string[];
  bewertung: number; // 0-100
}

export interface SimulationsAnalyse {
  simulationId: string;
  klauselBewertungen: KlauselBewertung[];
  kommunikationsMetriken: KommunikationsMetriken;
}

export interface KommunikationsMetriken {
  positiveFormulierungen: number;
  konkreteFakten: number;
  empathischeAussagen: number;
  kompromissAngebote: number;
  klarePositionen: number;
} 