import { VerhandlungsFeedback } from '../types/feedback';
import { KIService } from './ki-service';

export class FeedbackService {
  private kiService: KIService;
  
  constructor() {
    this.kiService = new KIService();
  }
  
  // Feedback für eine Simulation abrufen oder generieren
  async getFeedbackBySimulationId(simulationId: string): Promise<VerhandlungsFeedback> {
    try {
      // Versuche zuerst, vorhandenes Feedback abzurufen
      const response = await fetch(`/api/v1/feedback/${simulationId}`);
      
      if (response.ok) {
        // Wenn Feedback existiert, gib es zurück
        return await response.json();
      }
      
      // Wenn kein Feedback existiert, generiere es
      if (response.status === 404) {
        console.log('Kein bestehendes Feedback gefunden, generiere neues Feedback...');
        return this.generateFeedback(simulationId);
      }
      
      // Bei anderen Fehlern einen entsprechenden Fehler werfen
      throw new Error(`Fehler beim Abrufen des Feedbacks: ${response.statusText}`);
    } catch (error) {
      console.error('Fehler in FeedbackService.getFeedbackBySimulationId:', error);
      throw error;
    }
  }
  
  // Generiere neues Feedback für eine Simulation
  private async generateFeedback(simulationId: string): Promise<VerhandlungsFeedback> {
    try {
      // API-Aufruf zur Feedback-Generierung
      const response = await fetch(`/api/v1/simulationen/${simulationId}/generate-feedback`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Fehler bei der Feedback-Generierung: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fehler in FeedbackService.generateFeedback:', error);
      throw error;
    }
  }
} 