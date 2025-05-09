declare namespace GeminiAPI {
  interface Part {
    text: string;
  }

  interface Content {
    role: "user" | "model";
    parts: Part[];
  }

  interface RequestBody {
    contents: Content[];
    // Optionale Parameter für die API
    generationConfig?: {
      temperature?: number;
      topP?: number;
      topK?: number;
      maxOutputTokens?: number;
    };
    safetySettings?: Array<{
      category: string;
      threshold: string;
    }>;
  }

  interface ContentPart {
    text: string;
  }

  interface Content {
    parts: ContentPart[];
    role?: string;
  }

  interface Candidate {
    content: Content;
    finishReason?: "STOP" | "MAX_TOKENS" | "SAFETY" | "RECITATION" | "OTHER";
    index?: number;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }

  interface GenerateContentResponse {
    candidates?: Candidate[];
    promptFeedback?: {
      blockReason?: string;
      safetyRatings?: Array<{
        category: string;
        probability: string;
      }>;
    };
  }

  // Typ für unsere analysierten Vertragsergebnisse
  interface ContractClauseAnalysis {
    clauseText: string;
    evaluation: "Rot" | "Gelb" | "Grün" | "Fehler";
    reason: string;
    recommendation: string;
  }
}

// Erweitert den globalen Bereich mit diesen Typen
declare global {
  // Diese Typen können direkt im Code verwendet werden ohne Import
  namespace Gemini {
    type Part = GeminiAPI.Part;
    type Content = GeminiAPI.Content;
    type RequestBody = GeminiAPI.RequestBody;
    type GenerateContentResponse = GeminiAPI.GenerateContentResponse;
    type ContractClauseAnalysis = GeminiAPI.ContractClauseAnalysis;
  }
}

export {}; 