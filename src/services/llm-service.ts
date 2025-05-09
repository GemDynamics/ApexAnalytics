/**
 * LLM-Service für die Integration der Gemini API
 * (Ersatz für die bisherige OpenAI-Integration)
 */

interface GeminiRequestBody {
  contents: {
    parts: {
      text: string
    }[]
    role?: string
  }[];
  generationConfig: {
    temperature: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

export class LLMService {
  private static readonly API_KEY = process.env.GEMINI_API_KEY;
  private static readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  /**
   * Sendet einen Chat-Prompt an die Gemini API und gibt die Antwort zurück
   */
  static async getChatResponse(
    systemPrompt: string,
    userMessage: string,
    temperature = 0.7,
    maxOutputTokens = 500
  ): Promise<string> {
    if (!this.API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      throw new Error('GEMINI_API_KEY is not configured');
    }

    try {
      // Gemini API-Anfrage vorbereiten
      const requestBody: GeminiRequestBody = {
        contents: [
          {
            parts: [{ text: systemPrompt }]
          },
          {
            parts: [{ text: userMessage }]
          }
        ],
        generationConfig: {
          temperature,
          maxOutputTokens
        }
      };

      // API-Aufruf durchführen
      const response = await fetch(`${this.GEMINI_API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Gemini API error: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();

      if (!responseData.candidates || !responseData.candidates[0]?.content?.parts || 
          !responseData.candidates[0].content.parts[0]?.text) {
        console.error("Gemini API response is not in the expected format", responseData);
        throw new Error("Unexpected Gemini API response format");
      }

      return responseData.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error('Gemini API Fehler:', error);
      throw error;
    }
  }

  /**
   * Sendet eine JSON-genererende Anfrage an die Gemini API
   */
  static async getJsonResponse<T>(
    prompt: string, 
    temperature = 0.3,
    maxOutputTokens = 500
  ): Promise<T> {
    // Ergänze den Prompt um die JSON-Anweisung
    const jsonPrompt = `${prompt}\n\nAntworte NUR im JSON-Format ohne weitere Erklärungen.`;
    
    const jsonResponseText = await this.getChatResponse(jsonPrompt, "", temperature, maxOutputTokens);
    
    try {
      // Entferne eventuell vorhandene Markdown-Code-Block-Marker
      const cleanedText = jsonResponseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
        
      return JSON.parse(cleanedText) as T;
    } catch (error) {
      console.error('JSON Parsing Fehler:', error, 'Erhaltener Text:', jsonResponseText);
      throw new Error('Konnte das JSON nicht parsen: ' + error);
    }
  }
} 