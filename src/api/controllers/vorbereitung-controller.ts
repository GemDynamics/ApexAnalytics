import { Request, Response } from 'express';
import { VorbereitungService } from '../../services/vorbereitung-service';

/**
 * Controller für Verhandlungsvorbereitungen
 */
export class VorbereitungController {
  /**
   * Vorbereitung anhand der Vertrags-ID abrufen
   */
  static async getVorbereitungByVertragId(req: Request, res: Response): Promise<void> {
    try {
      const { vertragId } = req.params;
      const vorbereitung = await VorbereitungService.getVorbereitungByVertragId(vertragId);
      
      if (!vorbereitung) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Vorbereitung für Vertrag mit ID ${vertragId} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(200).json(vorbereitung);
    } catch (error) {
      console.error('Fehler beim Abrufen der Vorbereitung:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die Vorbereitung konnte nicht abgerufen werden.'
      });
    }
  }

  /**
   * Vorbereitung speichern oder aktualisieren
   */
  static async saveVorbereitung(req: Request, res: Response): Promise<void> {
    try {
      const vorbereitungData = req.body;
      
      if (!vorbereitungData.vertragId) {
        res.status(400).json({ 
          error: 'Ungültige Anfrage',
          message: 'Die Vertrags-ID ist erforderlich.'
        });
        return;
      }
      
      const vorbereitung = await VorbereitungService.saveVorbereitung(vorbereitungData);
      res.status(200).json(vorbereitung);
    } catch (error) {
      console.error('Fehler beim Speichern der Vorbereitung:', error);
      const message = error instanceof Error ? error.message : 'Die Vorbereitung konnte nicht gespeichert werden.';
      
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message
      });
    }
  }

  /**
   * Vorbereitung löschen
   */
  static async deleteVorbereitung(req: Request, res: Response): Promise<void> {
    try {
      const { vertragId } = req.params;
      const erfolg = await VorbereitungService.deleteVorbereitung(vertragId);
      
      if (!erfolg) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Vorbereitung für Vertrag mit ID ${vertragId} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Fehler beim Löschen der Vorbereitung:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die Vorbereitung konnte nicht gelöscht werden.'
      });
    }
  }

  /**
   * Klauselstrategie abrufen
   */
  static async getKlauselStrategie(req: Request, res: Response): Promise<void> {
    try {
      const { vertragId, klauselId } = req.params;
      const strategie = await VorbereitungService.getKlauselStrategie(vertragId, klauselId);
      
      if (!strategie) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Strategie für Klausel mit ID ${klauselId} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(200).json(strategie);
    } catch (error) {
      console.error('Fehler beim Abrufen der Klauselstrategie:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die Klauselstrategie konnte nicht abgerufen werden.'
      });
    }
  }

  /**
   * Klauselstrategie speichern oder aktualisieren
   */
  static async saveKlauselStrategie(req: Request, res: Response): Promise<void> {
    try {
      const { vertragId, klauselId } = req.params;
      const strategieData = req.body;
      
      const strategie = await VorbereitungService.saveKlauselStrategie(
        vertragId,
        klauselId,
        strategieData
      );
      
      if (!strategie) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Vertrag mit ID ${vertragId} oder Klausel mit ID ${klauselId} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(200).json(strategie);
    } catch (error) {
      console.error('Fehler beim Speichern der Klauselstrategie:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die Klauselstrategie konnte nicht gespeichert werden.'
      });
    }
  }
} 