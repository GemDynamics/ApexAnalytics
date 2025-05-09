import { Request, Response } from 'express';
import { SimulationService } from '../../services/simulation-service';

/**
 * Controller für Simulationsoperationen
 */
export class SimulationController {
  /**
   * Simulation starten
   */
  static async startSimulation(req: Request, res: Response): Promise<void> {
    try {
      const { vertragId } = req.params;
      
      const simulation = await SimulationService.startSimulation(vertragId);
      res.status(201).json(simulation);
    } catch (error) {
      console.error('Fehler beim Starten der Simulation:', error);
      const message = error instanceof Error ? error.message : 'Die Simulation konnte nicht gestartet werden.';
      
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message
      });
    }
  }

  /**
   * Nachricht verarbeiten
   */
  static async verarbeiteNachricht(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nachricht } = req.body;
      
      if (!nachricht) {
        res.status(400).json({ 
          error: 'Ungültige Anfrage',
          message: 'Der Nachrichtentext ist erforderlich.'
        });
        return;
      }
      
      const antwort = await SimulationService.verarbeiteNachricht(id, nachricht);
      res.status(200).json(antwort);
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Nachricht:', error);
      const message = error instanceof Error ? error.message : 'Die Nachricht konnte nicht verarbeitet werden.';
      
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message
      });
    }
  }

  /**
   * Simulation beenden
   */
  static async beendeSimulation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await SimulationService.beendeSimulation(id);
      res.status(200).json({ message: 'Simulation erfolgreich beendet.' });
    } catch (error) {
      console.error('Fehler beim Beenden der Simulation:', error);
      const message = error instanceof Error ? error.message : 'Die Simulation konnte nicht beendet werden.';
      
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message
      });
    }
  }

  /**
   * Simulation anhand der ID abrufen
   */
  static async getSimulationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const simulation = await SimulationService.getSimulationById(id);
      
      if (!simulation) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Simulation mit ID ${id} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(200).json(simulation);
    } catch (error) {
      console.error('Fehler beim Abrufen der Simulation:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die Simulation konnte nicht abgerufen werden.'
      });
    }
  }

  /**
   * Aktive Simulation für einen Vertrag abrufen
   */
  static async getAktiveSimulationByVertragId(req: Request, res: Response): Promise<void> {
    try {
      const { vertragId } = req.params;
      const simulation = await SimulationService.getAktiveSimulationByVertragId(vertragId);
      
      if (!simulation) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Keine aktive Simulation für Vertrag mit ID ${vertragId} gefunden.`
        });
        return;
      }
      
      res.status(200).json(simulation);
    } catch (error) {
      console.error('Fehler beim Abrufen der aktiven Simulation:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die aktive Simulation konnte nicht abgerufen werden.'
      });
    }
  }

  /**
   * Simulation löschen
   */
  static async deleteSimulation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const erfolg = await SimulationService.deleteSimulation(id);
      
      if (!erfolg) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Simulation mit ID ${id} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Fehler beim Löschen der Simulation:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die Simulation konnte nicht gelöscht werden.'
      });
    }
  }
} 