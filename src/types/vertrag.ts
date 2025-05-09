/**
 * Vertragsverwaltung Typdefinitionen
 */

export interface Klausel {
  id: string;
  chunkNr: number;
  index: number;
  titel: string;
  inhalt: string;
  risiko: 'hoch' | 'mittel' | 'niedrig' | 'fehler';
  risikoFarbe: 'rot' | 'gelb' | 'grün' | 'fehler';
  analyse: KlauselAnalyse;
  verhandlungsZiel: string;
}

export interface KlauselAnalyse {
  begründung: string;
  empfehlung: string;
  problemPunkte: string[];
}

export interface Vertrag {
  id: string;
  titel: string;
  status: 'entwurf' | 'analysiert' | 'verhandelt' | 'abgeschlossen';
  erstelltAm: Date;
  klauseln: Klausel[];
}

/**
 * Verhandlungsvorbereitung
 */
export interface VerhandlungsVorbereitung {
  id: string;
  vertragId: string;
  globaleZiele: string;
  nichtVerhandelbarePunkte: string;
  klauselStrategien: KlauselStrategie[];
}

export interface KlauselStrategie {
  id: string;
  klauselId: string;
  argumente: string;
  strategie: string;
} 