import { Vertrag } from '../types/vertrag';

export class VertragService {
  // Statische Methode zum Abrufen eines Vertrags anhand seiner ID
  static async getVertragById(vertragId: string): Promise<Vertrag> {
    try {
      const response = await fetch(`/api/v1/vertraege/${vertragId}`);
      
      if (!response.ok) {
        throw new Error(`Fehler beim Abrufen des Vertrags: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fehler in VertragService.getVertragById:', error);
      throw error;
    }
  }
  
  // Weitere Vertragsbezogene Methoden könnten hier hinzugefügt werden
} 