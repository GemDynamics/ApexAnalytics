/**
 * Simulationstypen für die Verhandlungssimulation
 */

export interface Simulation {
  id: string;
  vertragId: string;
  status: 'vorbereitet' | 'aktiv' | 'beendet';
  startZeit: Date;
  endeZeit?: Date;
  nachrichten: ChatNachricht[];
  aktiverKlauselIndex?: string;
  fortschritt: SimulationsFortschritt;
}

export interface SimulationsFortschritt {
  behandelteKlauseln: string[];
  offeneKlauseln: string[];
  aktuelleKlausel?: string;
}

export interface ChatNachricht {
  id: string;
  absender: 'bauherr' | 'bauunternehmer';
  inhalt: string;
  zeitstempel: Date;
  bezugKlauselId?: string;
} 