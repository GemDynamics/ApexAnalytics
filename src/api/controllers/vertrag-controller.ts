import { Request, Response } from 'express';
import { VertragService } from '../../services/vertrag-service';

/**
 * Controller für Vertragsoperationen
 */
export class VertragController {
  /**
   * Alle Verträge abrufen
   */
  static async getAllVertraege(req: Request, res: Response): Promise<void> {
    try {
      const vertraege = await VertragService.getAllVertraege();
      res.status(200).json(vertraege);
    } catch (error) {
      console.error('Fehler beim Abrufen der Verträge:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die Verträge konnten nicht abgerufen werden.'
      });
    }
  }

  /**
   * Vertrag anhand der ID abrufen
   */
  static async getVertragById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vertrag = await VertragService.getVertragById(id);
      
      if (!vertrag) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Vertrag mit ID ${id} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(200).json(vertrag);
    } catch (error) {
      console.error('Fehler beim Abrufen eines Vertrags:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Der Vertrag konnte nicht abgerufen werden.'
      });
    }
  }

  /**
   * Neuen Vertrag erstellen
   */
  static async createVertrag(req: Request, res: Response): Promise<void> {
    try {
      const vertragData = req.body;
      const neuerVertrag = await VertragService.createVertrag(vertragData);
      res.status(201).json(neuerVertrag);
    } catch (error) {
      console.error('Fehler beim Erstellen eines Vertrags:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Der Vertrag konnte nicht erstellt werden.'
      });
    }
  }

  /**
   * Vertrag aktualisieren
   */
  static async updateVertrag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const aktualisierterVertrag = await VertragService.updateVertrag(id, updates);
      
      if (!aktualisierterVertrag) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Vertrag mit ID ${id} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(200).json(aktualisierterVertrag);
    } catch (error) {
      console.error('Fehler beim Aktualisieren eines Vertrags:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Der Vertrag konnte nicht aktualisiert werden.'
      });
    }
  }

  /**
   * Vertrag löschen
   */
  static async deleteVertrag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const erfolg = await VertragService.deleteVertrag(id);
      
      if (!erfolg) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Vertrag mit ID ${id} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Fehler beim Löschen eines Vertrags:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Der Vertrag konnte nicht gelöscht werden.'
      });
    }
  }

  /**
   * Klausel abrufen
   */
  static async getKlausel(req: Request, res: Response): Promise<void> {
    try {
      const { vertragId, klauselId } = req.params;
      const klausel = await VertragService.getKlausel(vertragId, klauselId);
      
      if (!klausel) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Klausel mit ID ${klauselId} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(200).json(klausel);
    } catch (error) {
      console.error('Fehler beim Abrufen einer Klausel:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die Klausel konnte nicht abgerufen werden.'
      });
    }
  }

  /**
   * Klausel hinzufügen
   */
  static async addKlausel(req: Request, res: Response): Promise<void> {
    try {
      const { vertragId } = req.params;
      const klauselData = req.body;
      
      const neueKlausel = await VertragService.addKlausel(vertragId, klauselData);
      
      if (!neueKlausel) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Vertrag mit ID ${vertragId} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(201).json(neueKlausel);
    } catch (error) {
      console.error('Fehler beim Hinzufügen einer Klausel:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die Klausel konnte nicht hinzugefügt werden.'
      });
    }
  }

  /**
   * Klausel aktualisieren
   */
  static async updateKlausel(req: Request, res: Response): Promise<void> {
    try {
      const { vertragId, klauselId } = req.params;
      const updates = req.body;
      
      const aktualisierteKlausel = await VertragService.updateKlausel(
        vertragId, 
        klauselId, 
        updates
      );
      
      if (!aktualisierteKlausel) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Klausel mit ID ${klauselId} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(200).json(aktualisierteKlausel);
    } catch (error) {
      console.error('Fehler beim Aktualisieren einer Klausel:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die Klausel konnte nicht aktualisiert werden.'
      });
    }
  }

  /**
   * Klausel entfernen
   */
  static async removeKlausel(req: Request, res: Response): Promise<void> {
    try {
      const { vertragId, klauselId } = req.params;
      const erfolg = await VertragService.removeKlausel(vertragId, klauselId);
      
      if (!erfolg) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Klausel mit ID ${klauselId} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Fehler beim Entfernen einer Klausel:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Die Klausel konnte nicht entfernt werden.'
      });
    }
  }
} 