import { RateLimiterMemory } from 'rate-limiter-flexible';
import { KIService } from './ki-service';
import { ChatNachricht } from '../types/simulation';

export class OptimizedKIService extends KIService {
  private promptCache = new Map<string, string>();
  private rateLimiter: RateLimiterMemory;
  
  constructor() {
    super();
    // Implementierung des Rate-Limiters
    this.rateLimiter = new RateLimiterMemory({
      points: 50, // Anpassen je nach OpenAI-Limits
      duration: 60, // in Sekunden
    });
  }
  
  // Erweiterung der generiereBauherrNachricht-Methode
  async generiereBauherrNachricht(
    simulationId: string, 
    klauselId: string | null, 
    nutzerNachricht: string
  ): Promise<ChatNachricht> {
    // Rate-Limit prüfen
    try {
      await this.rateLimiter.consume('global', 1);
    } catch (error) {
      console.warn('Rate limit erreicht, warte kurz...');
      // Kurze Verzögerung einbauen
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Cache-Key erstellen
    const cacheKey = this.generateCacheKey(simulationId, klauselId, nutzerNachricht);
    
    // Wenn möglich, aus Cache laden
    if (this.promptCache.has(cacheKey)) {
      const cachedPrompt = this.promptCache.get(cacheKey);
      // Cache nur für identische Eingaben verwenden
      if (cachedPrompt === nutzerNachricht) {
        console.log('KI-Anfrage aus Cache bedient');
        return {
          id: this.generateId(),
          absender: 'bauherr',
          inhalt: cachedPrompt,
          zeitstempel: new Date().toISOString(),
          bezugKlauselId: klauselId
        };
      }
    }
    
    // Falls nicht im Cache, normale Anfrage durchführen
    const antwort = await super.generiereBauherrNachricht(simulationId, klauselId, nutzerNachricht);
    
    // Ergebnis cachen (mit Zeitbegrenzung)
    this.promptCache.set(cacheKey, antwort.inhalt);
    setTimeout(() => {
      this.promptCache.delete(cacheKey);
    }, 5 * 60 * 1000); // Cache für 5 Minuten behalten
    
    return antwort;
  }
  
  private generateCacheKey(simulationId: string, klauselId: string | null, nachricht: string): string {
    // Hash-Funktion für Cache-Key
    return `${simulationId}:${klauselId}:${this.hashString(nachricht)}`;
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  // Hilfsfunktion zum Hashen von Strings
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
} 