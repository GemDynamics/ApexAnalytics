import { SimulationModel } from '../models/simulation.model';
import { VertragModel } from '../models/vertrag.model';
import { VorbereitungModel } from '../models/vorbereitung.model';
import { Simulation, ChatNachricht } from '../types/simulation';
import { KIService } from './ki-service';
import { connectToDatabase, generateId, isValidObjectId, toObjectId } from '../lib/db';

/**
 * Service zur Verwaltung von Simulationen
 */
export class SimulationService {
  /**
   * Startet eine neue Simulation für einen Vertrag
   */
  static async startSimulation(vertragId: string): Promise<Simulation> {
    if (!isValidObjectId(vertragId)) {
      throw new Error('Ungültige Vertrags-ID');
    }
    
    await connectToDatabase();
    
    // Vertrag und Vorbereitung laden
    const vertrag = await VertragModel.findById(vertragId);
    
    if (!vertrag) {
      throw new Error('Vertrag nicht gefunden');
    }
    
    const vorbereitung = await VorbereitungModel.findOne({ vertragId: vertragId });
    
    if (!vorbereitung) {
      throw new Error('Keine Vorbereitung gefunden. Bitte zuerst Vorbereitung abschließen.');
    }
    
    // Klauseln-IDs extrahieren
    const klauselIds = vertrag.klauseln.map((k: { _id: { toString: () => string } }) => k._id.toString());
    
    if (klauselIds.length === 0) {
      throw new Error('Der Vertrag enthält keine Klauseln');
    }
    
    // Neue Simulation erstellen
    const simulation = await SimulationModel.create({
      vertragId: toObjectId(vertragId),
      status: 'aktiv',
      startZeit: new Date(),
      nachrichten: [],
      aktiverKlauselIndex: klauselIds[0],
      fortschritt: {
        behandelteKlauseln: [],
        offeneKlauseln: klauselIds,
        aktuelleKlausel: klauselIds[0]
      }
    });
    
    // Begrüßungsnachricht vom KI-Service generieren
    const begrüßung = await KIService.generiereBauherrAntwort(
      simulation._id.toString(),
      null,
      "Begrüßung und Einstieg in die Verhandlung"
    );
    
    // Zur Simulation hinzufügen
    simulation.nachrichten.push(begrüßung);
    await simulation.save();
    
    return simulation.toJSON() as Simulation;
  }

  /**
   * Verarbeitet eine Nachricht des Bauunternehmers und generiert eine Antwort
   */
  static async verarbeiteNachricht(simulationId: string, nachrichtText: string): Promise<ChatNachricht> {
    if (!isValidObjectId(simulationId)) {
      throw new Error('Ungültige Simulations-ID');
    }
    
    await connectToDatabase();
    
    // Simulation laden
    const simulation = await SimulationModel.findById(simulationId);
    
    if (!simulation) {
      throw new Error('Simulation nicht gefunden');
    }
    
    if (simulation.status !== 'aktiv') {
      throw new Error('Die Simulation ist nicht aktiv');
    }
    
    // Bauunternehmer-Nachricht erstellen
    const userNachricht: ChatNachricht = {
      id: generateId(),
      absender: 'bauunternehmer',
      inhalt: nachrichtText,
      zeitstempel: new Date(),
      bezugKlauselId: simulation.aktiverKlauselIndex?.toString()
    };
    
    // Nachricht zur Simulation hinzufügen
    simulation.nachrichten.push(userNachricht);
    await simulation.save();
    
    // Antwort vom KI-Service generieren
    const antwort = await KIService.generiereBauherrAntwort(
      simulationId,
      simulation.aktiverKlauselIndex?.toString() || null,
      nachrichtText
    );
    
    // Antwort zur Simulation hinzufügen
    simulation.nachrichten.push(antwort);
    
    // Fortschritt prüfen und aktualisieren
    await this.aktualisiereKlauselFortschritt(simulationId);
    
    await simulation.save();
    
    return antwort;
  }

  /**
   * Aktualisiert den Fortschritt der Klauselverhandlung
   */
  private static async aktualisiereKlauselFortschritt(simulationId: string): Promise<void> {
    await connectToDatabase();
    
    const simulation = await SimulationModel.findById(simulationId);
    
    if (!simulation || simulation.status !== 'aktiv') {
      return;
    }
    
    // Prüfen, ob aktuelle Klausel abgeschlossen ist
    const istAbgeschlossen = await this.istKlauselAbgeschlossen(simulation);
    
    if (istAbgeschlossen) {
      // Aktuelle Klausel als behandelt markieren
      const aktuelleKlauselId = simulation.fortschritt.aktuelleKlausel?.toString();
      
      if (aktuelleKlauselId) {
        // Aus offenen Klauseln entfernen und zu behandelten hinzufügen
        simulation.fortschritt.behandelteKlauseln.push(aktuelleKlauselId);
        simulation.fortschritt.offeneKlauseln = simulation.fortschritt.offeneKlauseln.filter(
          (id: { toString: () => string }) => id.toString() !== aktuelleKlauselId
        );
        
        // Nächste Klausel auswählen
        if (simulation.fortschritt.offeneKlauseln.length > 0) {
          simulation.fortschritt.aktuelleKlausel = simulation.fortschritt.offeneKlauseln[0];
          simulation.aktiverKlauselIndex = simulation.fortschritt.aktuelleKlausel;
          
          // Übergangs-Nachricht generieren
          const übergangsNachricht = await KIService.generiereBauherrAntwort(
            simulationId,
            simulation.fortschritt.aktuelleKlausel.toString(),
            "Übergang zur nächsten Klausel"
          );
          
          simulation.nachrichten.push(übergangsNachricht);
        } else {
          // Alle Klauseln behandelt
          simulation.fortschritt.aktuelleKlausel = undefined;
          simulation.aktiverKlauselIndex = undefined;
          
          // Abschluss-Nachricht generieren
          const abschlussNachricht = await KIService.generiereBauherrAntwort(
            simulationId,
            null,
            "Abschluss der Verhandlung"
          );
          
          simulation.nachrichten.push(abschlussNachricht);
        }
        
        await simulation.save();
      }
    }
  }

  /**
   * Prüft, ob die aktuelle Klausel abgeschlossen ist
   * In einer echten Implementierung würde hier eine komplexere Logik stehen
   */
  private static async istKlauselAbgeschlossen(simulation: any): Promise<boolean> {
    // Vereinfachte Implementierung: Klausel gilt als abgeschlossen, wenn
    // mindestens 4 Nachrichten zur aktuellen Klausel ausgetauscht wurden
    
    if (!simulation.aktiverKlauselIndex) {
      return false;
    }
    
    const aktuelleKlauselId = simulation.aktiverKlauselIndex.toString();
    const klauselNachrichten = simulation.nachrichten.filter(
      (n: any) => n.bezugKlauselId === aktuelleKlauselId
    );
    
    // Mindestens 4 Nachrichten (2 Hin und Her)
    return klauselNachrichten.length >= 4;
  }

  /**
   * Beendet eine Simulation
   */
  static async beendeSimulation(simulationId: string): Promise<void> {
    if (!isValidObjectId(simulationId)) {
      throw new Error('Ungültige Simulations-ID');
    }
    
    await connectToDatabase();
    
    // Simulation laden
    const simulation = await SimulationModel.findById(simulationId);
    
    if (!simulation) {
      throw new Error('Simulation nicht gefunden');
    }
    
    // Simulation als beendet markieren
    simulation.status = 'beendet';
    simulation.endeZeit = new Date();
    
    await simulation.save();
  }

  /**
   * Gibt eine Simulation anhand ihrer ID zurück
   */
  static async getSimulationById(id: string): Promise<Simulation | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    
    await connectToDatabase();
    const simulation = await SimulationModel.findById(id);
    return simulation ? simulation.toJSON() as Simulation : null;
  }

  /**
   * Gibt alle aktiven Simulationen für einen Vertrag zurück
   */
  static async getAktiveSimulationByVertragId(vertragId: string): Promise<Simulation | null> {
    if (!isValidObjectId(vertragId)) {
      return null;
    }
    
    await connectToDatabase();
    const simulation = await SimulationModel.findOne({ 
      vertragId: toObjectId(vertragId),
      status: 'aktiv'
    });
    
    return simulation ? simulation.toJSON() as Simulation : null;
  }

  /**
   * Löscht eine Simulation
   */
  static async deleteSimulation(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) {
      return false;
    }
    
    await connectToDatabase();
    const result = await SimulationModel.findByIdAndDelete(id);
    return !!result;
  }
} 