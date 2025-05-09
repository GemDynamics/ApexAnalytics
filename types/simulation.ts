export interface ChatNachricht {
  id: string;
  absender: 'bauunternehmer' | 'bauherr';
  inhalt: string;
  zeitstempel: string;
  bezugKlauselId?: string | null;
}

export interface Simulation {
  id: string;
  vertragId: string;
  status: 'aktiv' | 'beendet';
  nachrichten: ChatNachricht[];
  erstelltAm: string;
  beendetAm?: string;
}

export interface SimulationStartRequest {
  vertragId: string;
}

export interface SimulationNachrichtRequest {
  nachricht: string;
  klauselId?: string | null;
}

export interface SimulationBeendenRequest {
  bewertung?: number;
  kommentar?: string;
} 