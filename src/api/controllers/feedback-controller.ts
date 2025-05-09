import { Request, Response } from 'express';
import { FeedbackService } from '../../services/feedback-service';

/**
 * Controller für Feedback-Operationen
 */
export class FeedbackController {
  /**
   * Feedback anhand der Simulations-ID abrufen
   */
  static async getFeedbackBySimulationId(req: Request, res: Response): Promise<void> {
    try {
      const { simulationId } = req.params;
      const feedback = await FeedbackService.getFeedbackBySimulationId(simulationId);
      
      if (!feedback) {
        res.status(404).json({ 
          error: 'Nicht gefunden',
          message: `Feedback für Simulation mit ID ${simulationId} wurde nicht gefunden.`
        });
        return;
      }
      
      res.status(200).json(feedback);
    } catch (error) {
      console.error('Fehler beim Abrufen des Feedbacks:', error);
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message: 'Das Feedback konnte nicht abgerufen werden.'
      });
    }
  }

  /**
   * Feedback generieren
   */
  static async generiereFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { simulationId } = req.params;
      
      const feedback = await FeedbackService.generiereFeedback(simulationId);
      res.status(201).json(feedback);
    } catch (error) {
      console.error('Fehler beim Generieren des Feedbacks:', error);
      const message = error instanceof Error ? error.message : 'Das Feedback konnte nicht generiert werden.';
      
      res.status(500).json({ 
        error: 'Interner Serverfehler',
        message
      });
    }
  }
} 