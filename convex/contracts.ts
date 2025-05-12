import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Struktur für die Vertragselemente
interface ContractElement {
  id: string;
  type: string; // "title", "heading", "clause", "text", etc.
  content: string;
  level?: number;
  parentId?: string;
}

// Vertrag erstellen oder aktualisieren
export const saveContract = mutation({
  args: {
    id: v.optional(v.id("contracts")),
    title: v.string(),
    originalText: v.string(),
    structuredElements: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        content: v.string(),
        level: v.optional(v.number()),
        parentId: v.optional(v.string())
      })
    )
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.id) {
      // Bestehenden Vertrag aktualisieren
      await ctx.db.patch(args.id, {
        title: args.title,
        originalText: args.originalText,
        structuredElements: args.structuredElements
      });
      return args.id;
    } else {
      // Neuen Vertrag erstellen
      return ctx.db.insert("contracts", {
        title: args.title,
        originalText: args.originalText,
        structuredElements: args.structuredElements,
        createdAt: now
      });
    }
  }
});

// Vertrag abrufen
export const getContract = query({
  args: {
    id: v.id("contracts")
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  }
});

// Alle Verträge abrufen
export const getAllContracts = query({
  handler: async (ctx) => {
    return ctx.db
      .query("contracts")
      .order("desc")
      .collect();
  }
});

// Vertrag strukturieren (Action)
export const structureContract = action({
  args: {
    title: v.string(),
    contractText: v.string()
  },
  handler: async (ctx, args) => {
    try {
      // OpenAI API für die Strukturierung des Vertrags aufrufen
      // Dies ist eine vereinfachte Version und würde in einem echten System
      // in Chunks verarbeitet und mit mehr Kontext angereichert werden
      
      // Systemanweisung für das Modell
      const systemPrompt = `Du bist ein KI-Assistent, der Verträge in strukturierte Elemente umwandelt.
Deine Aufgabe ist es, den Vertrag in die folgenden Elemente zu zerlegen:
- Titel
- Überschriften (mit hierarchischer Ebene)
- Klauseln/Abschnitte
- Normaler Text

Formatiere deine Ausgabe als JSON-Array, wobei jedes Element folgende Struktur hat:
{
  "id": "eindeutige ID",
  "type": "title" | "heading" | "clause" | "text",
  "content": "Text des Elements",
  "level": Hierarchieebene (nur für Überschriften),
  "parentId": "ID des übergeordneten Elements (falls vorhanden)"
}`;

      // In einem echten System würde hier ein Aufruf an OpenAI oder ein anderes KI-Modell erfolgen
      // Für dieses Beispiel verwenden wir Dummy-Daten
      const structuredElements: ContractElement[] = [
        {
          id: "title_1",
          type: "title",
          content: args.title
        },
        {
          id: "heading_1",
          type: "heading",
          content: "Vertragsparteien",
          level: 1
        },
        {
          id: "text_1",
          type: "text",
          content: "Zwischen Firma A und Firma B...",
          parentId: "heading_1"
        },
        {
          id: "heading_2",
          type: "heading",
          content: "Leistungsumfang",
          level: 1
        },
        {
          id: "clause_1",
          type: "clause",
          content: "Der Auftragnehmer verpflichtet sich zur Lieferung...",
          parentId: "heading_2"
        },
        {
          id: "heading_3",
          type: "heading",
          content: "Vergütung",
          level: 1
        },
        {
          id: "clause_2",
          type: "clause",
          content: "Die Vergütung erfolgt nach Abnahme...",
          parentId: "heading_3"
        }
      ];

      // Da wir in einer Action keinen direkten DB-Zugriff haben,
      // würden wir hier eine Mutation über ctx.runMutation aufrufen
      // Für dieses Beispiel geben wir nur die Daten zurück
      return { 
        title: args.title,
        contractText: args.contractText,
        structuredElements 
      };
    } catch (error) {
      console.error("Fehler bei der Vertragsstrukturierung:", error);
      throw error;
    }
  }
});

// Vertrag nach Strukturierung speichern
export const saveStructuredContract = mutation({
  args: {
    title: v.string(),
    originalText: v.string(),
    structuredElements: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        content: v.string(),
        level: v.optional(v.number()),
        parentId: v.optional(v.string())
      })
    )
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("contracts", {
      title: args.title,
      originalText: args.originalText,
      structuredElements: args.structuredElements,
      createdAt: now
    });
  }
});

// Klausel analysieren (Action)
export const analyzeClause = action({
  args: {
    contractId: v.id("contracts"),
    clauseId: v.string(),
    clauseText: v.string()
  },
  handler: async (ctx, args) => {
    try {
      // In einem echten System würden wir hier:
      // 1. Eine Vektor-Einbettung für die Klausel erstellen
      // 2. Ähnliche Wissens-Chunks in der Knowledge Base finden
      // 3. Das Ergebnis mit einem LLM zusammen mit dem rechtlichen Kontext analysieren

      // Für dieses Beispiel verwenden wir Dummy-Daten
      const analysisResult = {
        status: "yellow", // "red", "yellow", oder "green"
        relevantChunks: ["rule_yellow_flag_003", "legal_de_005"],
        explanation: "Die Klausel enthält eine Vertragserfüllungsbürgschaft, die kritisch geprüft werden sollte.",
        alternativeSuggestions: [
          "Die Vertragserfüllungsbürgschaft sollte auf maximal 10% der Auftragssumme begrenzt werden.",
          "Es sollte klargestellt werden, dass die Bürgschaft nicht 'auf erstes Anfordern' zu leisten ist.",
          "Die Bürgschaft sollte zeitlich begrenzt sein und mit der Abnahme enden."
        ]
      };

      // Da wir in einer Action keinen direkten DB-Zugriff haben,
      // würden wir hier eine Mutation über ctx.runMutation aufrufen
      // Für dieses Beispiel geben wir nur die Daten zurück
      return {
        contractId: args.contractId,
        clauseId: args.clauseId,
        analysis: analysisResult
      };
    } catch (error) {
      console.error("Fehler bei der Klauselanalyse:", error);
      throw error;
    }
  }
});

// Klauselanalyse speichern
export const saveClauseAnalysis = mutation({
  args: {
    contractId: v.id("contracts"),
    clauseId: v.string(),
    analysis: v.object({
      status: v.string(),
      relevantChunks: v.array(v.string()),
      explanation: v.string(),
      alternativeSuggestions: v.optional(v.array(v.string()))
    })
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Prüfen ob diese Klauselanalyse bereits existiert
    const existingAnalyses = await ctx.db
      .query("clauseAnalyses")
      .filter(q => q.eq(q.field("contractId"), args.contractId))
      .filter(q => q.eq(q.field("clauseId"), args.clauseId))
      .collect();

    if (existingAnalyses.length > 0) {
      // Bestehende Analyse aktualisieren
      return ctx.db.patch(existingAnalyses[0]._id, {
        analysis: args.analysis
      });
    } else {
      // Neue Analyse erstellen
      return ctx.db.insert("clauseAnalyses", {
        contractId: args.contractId,
        clauseId: args.clauseId,
        analysis: args.analysis,
        createdAt: now
      });
    }
  }
});

// Alle Klauselanalysen für einen Vertrag abrufen
export const getClauseAnalyses = query({
  args: {
    contractId: v.id("contracts")
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("clauseAnalyses")
      .filter(q => q.eq(q.field("contractId"), args.contractId))
      .collect();
  }
}); 