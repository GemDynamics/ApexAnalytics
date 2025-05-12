# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [Unreleased]

### Added
- **Stufe 5: Export-Funktionalität**
    - **`components/contract-editor-with-contract.tsx`**:
        - **`components/contract-editor-with-contract.tsx`**:
            - Export-Button öffnet nun ein Modal (`Dialog`) zur Auswahl des Exportformats (PDF/DOCX).
            - Platzhalter-Funktionen (`handleExportPdf`, `handleExportDocx`) für client-seitige PDF- und DOCX-Generierung hinzugefügt.
            - Kommentare zur Notwendigkeit der Installation von `marked`, `html-to-docx` und `html2pdf.js` hinzugefügt.
            - Rudimentäre Markdown-zu-HTML-Konvertierungslogik als Platzhalter in den Exportfunktionen implementiert.
            - Icons für PDF- und DOCX-Auswahl im Modal hinzugefügt.
- **Stufe 4: Frontend-Integration `structuredContractElements`**
    - **`components/contract-editor-with-contract.tsx`**:
        - `useEffect`-Hook überarbeitet, um primär `contract.structuredContractElements` als Datenquelle zu laden und in das `EditorSection`-Format zu transformieren.
        - Logik zur Titel-Extraktion aus Markdown-Headern (H1, H2, H3) implementiert.
        - Ableitung von Risiko-Status (`risk`, `needsRenegotiation`, `urgentAttention`) aus `evaluation`.
        - `elementType` aus `structuredContractElements` wird nun im `EditorSection`-Objekt gespeichert.
        - Fallbacks für ältere Datenstrukturen (`editedAnalysis`, `analysisProtocol`) beibehalten.
        - KI-Handler (`handleOptimizeWithAI`, `handleGenerateAlternatives`) nutzen nun die korrekten Daten (`elementId`, `markdownContent`).
        - `handleSaveContract`-Funktion angepasst, um `sections` (im `EditorSection`-Format) an die Mutation `updateContractAnalysis` zu senden (Backend-Anpassung der Mutation für `structuredContractElements` noch erforderlich).
        - Import und Vorbereitung für `ReactMarkdown` hinzugefügt (Paket muss manuell installiert werden: `npm install react-markdown`).

### Changed
- **Export:**
    - **`components/contract-editor-with-contract.tsx`**:
        - Die ursprüngliche `handleDownloadContract`-Funktion (reiner Markdown-Export) wurde durch die neue Modal-Logik ersetzt.
- **UI/UX:**
    - **`components/contract-editor-with-contract.tsx`**:
        - "Löschen"-Button in der Toolbar und Detailkarte markiert Klauseln nun als "entfernt" (`removed: true`) statt sie sofort zu löschen.
        - Risikozusammenfassung und Liste der kritischen Klauseln im rechten Panel filtern nun entfernte Klauseln heraus.
        - Kritische Klauseln werden nun nach Schweregrad (Fehler > Hoch > Mittel) sortiert.
        - Titel des Vertragsdokuments im Header ist nun mit Doppelklick bearbeitbar.
        - Kleinere Anpassungen an Button-Texten und Tooltips.
- **KI-Interaktion:**
    - **`components/contract-editor-with-contract.tsx` (`handleOptimizeWithAI`):** 
        - Unterscheidet nun klar zwischen dem Optimieren von benutzerdefiniertem Text und dem Generieren von Alternativen für bestehenden Klauselinhalt.
        - Zusätzliche Prüfungen für Rückgabetypen der KI-Actions hinzugefügt (String vs. Array).
- **Code Struktur:**
    - **`components/contract-editor-with-contract.tsx`**: `stripFileExtension`-Hilfsfunktion hinzugefügt.
- **KI-Modell Korrektur**:
    - Modellname für Flash-Modell korrigiert von `gemini-2.0-flash-live-001` (fehlerhaft) zu `gemini-1.5-flash-latest` und dann final zu `gemini-2.0-flash` auf Wunsch des Benutzers.
    - **`convex/gemini.ts`**: Standardmodell und Modell in `generateAnalysisWithPro` auf `gemini-2.0-flash` geändert.
    - **`convex/contractActions.ts`**: Modellnamen in Aufrufen von `generateStructuredJson`, `generateAnalysisWithPro` sowie in direkten `fetch`-Aufrufen für `optimizeClauseWithAI` und `generateAlternativeFormulations` auf `gemini-2.0-flash` geändert.

### Fixed
- **Linter-Fehler**:
    - **`app/analytik/[id]/page.tsx`**:
        - Typfehler bei `contract.uploadedAt` (potenziell `undefined`) behoben.
        - Fehlende `elementType`-Eigenschaft bei Transformation von `analysisProtocol` zu `chartAnalysisData` hinzugefügt.
    - **`components/contracts-list.tsx`**:
        - Typfehler bei `contract.fileName` und `contract.uploadedAt` (potenziell `undefined`) behoben durch Hinzufügen von Fallbacks.
    - **`convex/gemini.ts`**:
        - Typfehler bei `generateContent` behoben (Fallback für optionales `knowledgeContext` hinzugefügt).
    - **`convex/contractActions.ts`**:
        - Argumentnamen (`userPrompt` -> `textInput`, `userPrompt` -> `contextPrompt`) in Aufrufen von `generateStructuredJson` und `generateAnalysisWithPro` korrigiert.
        - Pfad für `generateStructuredJson`-Aufruf von `api.` zu `internal.` korrigiert.
        - Syntaxfehler und Typfehler in `fetch`-Aufrufen innerhalb von `optimizeClauseWithAI` und `generateAlternativeFormulations` korrigiert.

### Removed
- **`components/contract-detail.tsx`**: Diese Komponente wurde als veraltet identifiziert, da die Editor-Funktionalität in `contract-editor-with-contract.tsx` implementiert ist. Die Darstellung der Analyse erfolgt nun direkt im Editor bzw. über die anderen Tabs im `AnalyticsLayout`. (Hinweis: Datei existiert noch, wird aber nicht mehr primär für die Darstellung genutzt).

### Fixed
- Problem behoben, bei dem das Skript `scripts/prepare_knowledge_base.mjs` die Convex Actions/Mutations aufgrund eines falschen Pfades nach einer Datei-Umbenennung nicht finden konnte.

### Changed
- Die Convex-Funktionen zur Verarbeitung der Wissensbasis (`getEmbeddings`, `storeKnowledgeChunkBatch`) befinden sich nun in `convex/kbProcessing.ts` (vorher `convex/knowledgeBase.ts`).
- Das Skript `scripts/prepare_knowledge_base.mjs` wurde aktualisiert, um die Funktionen aus `convex/kbProcessing.ts` zu verwenden.
- `convex/kbProcessing.ts` wiederhergestellt, um die eigentlichen Embedding- und Speicherfunktionen anstelle einer temporären `testAction` zu enthalten.

### Added
- Diese `CHANGELOG.md` Datei wurde hinzugefügt, um Änderungen am Projekt zu verfolgen.

## JJJJ-MM-TT - Konsolidierung KI-Modelle

### Changed
- **Alle KI-Aufrufe**: Vereinheitlicht auf die Verwendung von `gemini-2.0-flash-live-001` (vorher fälschlicherweise `gemini-1.5-flash-latest`).
    - **`convex/gemini.ts`**: Standardmodelle für `generateStructuredJson` und `generateAnalysisWithPro` auf `gemini-2.0-flash-live-001` geändert.
    - **`convex/contractActions.ts`**:
        - Expliziter Aufruf in `structureContractIncrementallyAndCreateJsonElements` auf `gemini-2.0-flash-live-001` aktualisiert.
        - Hardcodierte Modellnamen in den `fetch`-Aufrufen von `optimizeClauseWithAI` und `generateAlternativeFormulations` auf `gemini-2.0-flash-live-001` aktualisiert.

## JJJJ-MM-TT - Implementierung Stufe 1: KI-Strukturierung

### Added
- **`convex/gemini.ts`**: Neue `internalAction` `generateStructuredJson` hinzugefügt, um Text mit Gemini Flash zu generieren und explizit JSON-Antworten anzufordern.

### Changed
- **`convex/contractActions.ts`**:
    - Funktion `splitTextIntoPreChunks` aktualisiert, um absatzbasiertes Chunking (Trennung bei doppelten Zeilenumbrüchen) zu implementieren und das Zerreißen von Absätzen zu verhindern.
    - `internalAction` `structureContractIncrementallyAndCreateJsonElements` überarbeitet:
        - Simulierter KI-Aufruf durch echten Aufruf an `internal.gemini.generateStructuredJson` ersetzt.
        - System-Prompt für KI-Agent 1 gemäß aktualisiertem Gesamtplan verwendet.
        - Programmatische Generierung von `elementId` (Format: `sType_c{chunkIndex}_e{elemIndexInChunk}`) nach Erhalt der KI-Antwort implementiert.
        - Fehlerbehandlung für den KI-Aufruf und die Antwortverarbeitung verbessert.
        - Linter-Fehler in der Typ-Validierungslogik des `filter`-Callbacks behoben.

## JJJJ-MM-TT - Anpassungen Gesamtplan für Stufe 1

### Geändert
- **Gesamtplan zur Optimierung der KI-Vertragsanalyse.md:**
    - Stufe 1: KI-Modell für Strukturierungs-Agent (Agent 1) von Gemini 1.5 Pro auf Gemini 2.0 Flash geändert.
    - Stufe 1: Vor-Chunking präzisiert: Muss an Absatzenden erfolgen und darf Absätze/Klauseln nicht zerreißen (Zielgröße ~2500 Wörter).
    - Stufe 1: System-Prompt für Strukturierungs-Agent (Agent 1) aktualisiert, um explizit die standardisierte Markdown-Ausgabe (`# Titel`, `## § N Abschnitt`, `### § N.M Klausel`) zu fordern und JSON-Ausgabe angepasst (KI liefert `elementId` nicht mehr).

## JJJJ-MM-TT - Anpassungen Vektor-Datenbank und Aufräumarbeiten

### Änderungen und Feststellungen:

1.  **Vektor-Datenbank Implementierung (Stufe 0 Gesamtplan):**
    *   Der für die Wissens-Chunks verwendete Tabellenname in der Convex-Datenbank ist `knowledgeChunks` (definiert in `convex/schema.ts` und verwendet in `convex/kbProcessing.ts` bei `storeKnowledgeChunkBatch`).
    *   Der Vektorindex auf dieser Tabelle heißt `embedding` und ist auf dem Feld `embedding` definiert (`convex/schema.ts`).
    *   Dies weicht vom ursprünglichen `Gesamtplan` ab, der `knowledge_base_entries` als Tabellennamen und `by_embedding` als Indexnamen (bezogen auf das Feld `embedding`) spezifizierte.
    *   Der `Gesamtplan zur Optimierung der KI-Vertragsanalyse.md` wurde entsprechend aktualisiert, um die tatsächliche Implementierung (`knowledgeChunks` als Tabelle, `embedding` als Indexname auf Feld `embedding`) widerzuspiegeln.

2.  **Archivierung veralteter Dateien:**
    *   Die folgenden Dateien wurden als veraltet identifiziert, da sie sich auf eine frühere Datenstruktur mit manuellen `id`-Feldern beziehen (anstelle der von Convex generierten `_id`) oder ihre Logik (wie bei `analysis_rules.json`) nicht im aktuellen RAG-basierten Analyseprozess (Stufe 3) verwendet wird:
        *   `knowledge_base/analysis_rules.json`
        *   `knowledge_base/schema.json`
    *   Diese Dateien sollten in ein neu zu erstellendes Verzeichnis `/archiv` verschoben werden, um die Projektstruktur sauber zu halten.

### Durchgeführte Aufräumarbeiten und verbleibende Empfehlungen:

*   Das Verzeichnis `/archiv` im Workspace-Root wurde erstellt.
*   Die Dateien `knowledge_base/analysis_rules.json` und `knowledge_base/schema.json` wurden in das Verzeichnis `/archiv` verschoben.
*   Das Verzeichnis `knowledge_base/` wurde gelöscht.
*   **Empfehlung:** Sicherstellen, dass alle zukünftigen Entwicklungen (insbesondere Stufe 3: `analyzeContractChunkWithStructureAndVectorKB`) den korrekten Tabellennamen (`knowledgeChunks`) und Indexnamen (`embedding`) verwenden.


## JJJJ-MM-TT - Korrektur & Konsolidierung KI-Modelle

### Changed
- **Alle KI-Aufrufe**: Korrigiert und vereinheitlicht auf die Verwendung von `gemini-2.0-flash-live-001` (vorher fälschlicherweise `gemini-1.5-flash-latest`).
    - **`convex/gemini.ts`**: Standardmodelle für `generateStructuredJson` und `generateAnalysisWithPro` auf `gemini-2.0-flash-live-001` geändert.
    - **`convex/contractActions.ts`**:
        - Expliziter Aufruf in `structureContractIncrementallyAndCreateJsonElements` auf `gemini-2.0-flash-live-001` aktualisiert.
        - Hardcodierte Modellnamen in den `fetch`-Aufrufen von `optimizeClauseWithAI` und `generateAlternativeFormulations` auf `gemini-2.0-flash-live-001` aktualisiert.

## JJJJ-MM-TT - Implementierung Stufe 2: Analyse-Chunking

### Added
- **`convex/contractActions.ts`**: Neue `internalAction` `createAnalysisChunksFromStructuredElements` hinzugefügt. Diese Funktion:
    - Ruft die in Stufe 1 generierten `structuredContractElements` ab.
    - Gruppiert diese Elemente in logische "Analyse-Chunks" basierend auf einer maximalen Zeichenzahl (`MAX_ANALYSIS_CHUNK_SIZE_CHARS`), wobei Elemente nicht zerrissen werden.
    - Aktualisiert den Vertragsstatus und `totalChunks` mit der Anzahl der erstellten Analyse-Chunks.

### Changed
- **`convex/contractActions.ts`**:
    - `createAnalysisChunksFromStructuredElements` plant nun am Ende mittels `ctx.scheduler.runAfter` für jeden erstellten Analyse-Chunk die Ausführung der Stufe 3 Action (`analyzeContractChunkWithStructureAndVectorKB`).
    - Linter-Fehler in Aufrufen von `updateContractStatus` behoben (überflüssiges `processedChunks`-Argument entfernt).

## JJJJ-MM-TT - Implementierung Stufe 3: Kontextualisierte Klauselanalyse (RAG)

### Added
- **`convex/gemini.ts`**: Neue `internalAction` `generateAnalysisWithPro` hinzugefügt für Aufrufe an Gemini Pro zur Klauselanalyse (ohne explizite JSON-Antwortanforderung).
- **`convex/knowledgeQueries.ts`**: Neue Datei hinzugefügt mit:
    - `internalAction` `findSimilarKnowledgeChunks`: Führt Vektorsuche mittels `ctx.vectorSearch` auf der `knowledgeChunks`-Tabelle durch, um relevante Wissens-Chunks für RAG zu finden. Ruft vollständige Dokumente nach der Suche ab.
    - `query` `getKnowledgeChunkById`: Hilfsfunktion zum Abrufen eines einzelnen Knowledge Chunks.
- **`convex/contractMutations.ts`**: Neue `internalMutation` `mergeAnalysisResult` hinzugefügt, um Analyseergebnisse (`evaluation`, `reason`, `recommendation`) für ein einzelnes Strukturelement zu speichern.
- **`convex/contractActions.ts`**: Neue `internalAction` `analyzeContractChunkWithStructureAndVectorKB` hinzugefügt. Diese Funktion:
    - Iteriert durch die Elemente eines Analyse-Chunks.
    - Ruft `createEmbedding` auf.
    - Ruft `findSimilarKnowledgeChunks` zur Wissensabfrage auf.
    - Ruft `generateAnalysisWithPro` mit dem Kontext zur Analyse auf.
    - Parst die JSON-Antwort von Gemini.
    - Ruft `mergeAnalysisResult` zum Speichern der Ergebnisse auf.
    - Implementiert Fehlerbehandlung pro Element.

### Changed
- **`convex/gemini.ts`**:
    - `createEmbedding`: Modell auf `text-embedding-004` aktualisiert.
- **`convex/knowledgeQueries.ts`**:
    - `findSimilarKnowledgeChunks`: Implementierung korrigiert, verwendet nun `internalAction` mit `ctx.vectorSearch` und nachgelagertem Abruf der Dokumente via `ctx.runQuery` (behebt vorherige Linter-Fehler).
- **Verarbeitung von Analyse-Chunks**: Umgestellt von paralleler Planung mit `ctx.scheduler` auf eine rein sequenzielle Verarbeitung innerhalb der `createAnalysisChunksFromStructuredElements`-Action in `convex/contractActions.ts`. Dies soll API-Rate-Limits und Datenbank-Concurrency-Probleme vermeiden. Die ursprüngliche `analyzeContractChunkWithStructureAndVectorKB`-Action wurde dafür auskommentiert und ihre Logik in eine interne Helper-Funktion überführt.

## JJJJ-MM-TT - Anpassungen Gesamtplan für Stufe 1

### Geändert
- **Gesamtplan zur Optimierung der KI-Vertragsanalyse.md:**
    - Stufe 1: KI-Modell für Strukturierungs-Agent (Agent 1) von Gemini 1.5 Pro auf Gemini 2.0 Flash geändert.
    - Stufe 1: Vor-Chunking präzisiert: Muss an Absatzenden erfolgen und darf Absätze/Klauseln nicht zerreißen (Zielgröße ~2500 Wörter).
    - Stufe 1: System-Prompt für Strukturierungs-Agent (Agent 1) aktualisiert, um explizit die standardisierte Markdown-Ausgabe (`# Titel`, `## § N Abschnitt`, `### § N.M Klausel`) zu fordern und JSON-Ausgabe angepasst (KI liefert `elementId` nicht mehr).

## JJJJ-MM-TT - Anpassungen Vektor-Datenbank und Aufräumarbeiten

### Änderungen und Feststellungen:

1.  **Vektor-Datenbank Implementierung (Stufe 0 Gesamtplan):**
    *   Der für die Wissens-Chunks verwendete Tabellenname in der Convex-Datenbank ist `knowledgeChunks` (definiert in `convex/schema.ts` und verwendet in `convex/kbProcessing.ts` bei `storeKnowledgeChunkBatch`).
    *   Der Vektorindex auf dieser Tabelle heißt `embedding` und ist auf dem Feld `embedding` definiert (`convex/schema.ts`).
    *   Dies weicht vom ursprünglichen `Gesamtplan` ab, der `knowledge_base_entries` als Tabellennamen und `by_embedding` als Indexnamen (bezogen auf das Feld `embedding`) spezifizierte.
    *   Der `Gesamtplan zur Optimierung der KI-Vertragsanalyse.md` wurde entsprechend aktualisiert, um die tatsächliche Implementierung (`knowledgeChunks` als Tabelle, `embedding` als Indexname auf Feld `embedding`) widerzuspiegeln.

2.  **Archivierung veralteter Dateien:**
    *   Die folgenden Dateien wurden als veraltet identifiziert, da sie sich auf eine frühere Datenstruktur mit manuellen `id`-Feldern beziehen (anstelle der von Convex generierten `_id`) oder ihre Logik (wie bei `analysis_rules.json`) nicht im aktuellen RAG-basierten Analyseprozess (Stufe 3) verwendet wird:
        *   `knowledge_base/analysis_rules.json`
        *   `knowledge_base/schema.json`
    *   Diese Dateien sollten in ein neu zu erstellendes Verzeichnis `/archiv` verschoben werden, um die Projektstruktur sauber zu halten.

### Durchgeführte Aufräumarbeiten und verbleibende Empfehlungen:

*   Das Verzeichnis `/archiv` im Workspace-Root wurde erstellt.
*   Die Dateien `knowledge_base/analysis_rules.json` und `knowledge_base/schema.json` wurden in das Verzeichnis `/archiv` verschoben.
*   Das Verzeichnis `knowledge_base/` wurde gelöscht.
*   **Empfehlung:** Sicherstellen, dass alle zukünftigen Entwicklungen (insbesondere Stufe 3: `analyzeContractChunkWithStructureAndVectorKB`) den korrekten Tabellennamen (`knowledgeChunks`) und Indexnamen (`embedding`) verwenden. 