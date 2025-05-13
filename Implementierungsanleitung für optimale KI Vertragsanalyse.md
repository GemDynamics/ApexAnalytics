# Implementierungsanleitung für optimale KI Vertragsanalyse

## 1. Zielsetzung

Ziel ist die Umstellung des bestehenden Vertragsanalyse-Prozesses in Convex auf eine neue, dreistufige Architektur, die Gemini 2.5 Pro für verbesserte Strukturerkennung und Gemini 2.5 Flash für die Detailanalyse nutzt. Dies soll die Qualität der Strukturerkennung verbessern und gleichzeitig die Robustheit gegenüber Timeouts erhöhen.

**Neue Architektur:**

1.  **Stufe 1 (Agent 1 - Gemini 2.5 Pro):**
    *   **Input:** Gesamter Vertragstext.
    *   **Prozess:** Identifiziert globale Hauptabschnitte (mit Nummerierung, falls vorhanden, sonst generiert), teilt den Vertrag in 4-6 große, logische Text-Chunks (~8-10 Seiten pro Chunk, Priorität auf logischer Trennung).
    *   **Output:** Liste von Objekten mit `{ chunkNumber, identifiedSections[], chunkContent }`.
2.  **Stufe 2 (Agent 2 - Gemini 2.5 Pro):**
    *   **Input:** Jeder große Chunk aus Stufe 1 (parallele Verarbeitung).
    *   **Prozess:** Erstellt die detaillierte hierarchische JSON-Struktur für den jeweiligen Chunk (ähnlich der bisherigen Strukturierung, aber potenziell präziser).
    *   **Output:** Pro Chunk eine Liste von Strukturelement-Objekten `{ elementType, elementId, markdownContent, originalOrderInChunk, globalChunkNumber }`.
3.  **Stufe 3 (Agent 3 - Gemini 2.5 Flash):**
    *   **Input:** Alle einzelnen Strukturelemente aus Stufe 2 (nach Abschluss *aller* Stage 2-Prozesse, parallele Verarbeitung pro Element).
    *   **Prozess:** Führt die eigentliche Risiko-/Empfehlungsanalyse (Rot/Gelb/Grün) für jedes Element durch, nutzt Vektor-DB-Kontext.
    *   **Output:** Pro Element ein Ergebnisobjekt `{ elementId, evaluation, reason, recommendation, isError, errorMessage }`.

## 2. Vorbereitungen

### 2.1. Schema-Anpassungen (`convex/schema.ts`)

1.  **Neue Status-Literale hinzufügen:** Erweitere den `contractStatus` Union-Typ um Literale für die neuen Stufen und mögliche Fehlerzustände:
    ```typescript
    v.literal("stage1_chunking_inprogress"),
    v.literal("stage1_chunking_completed"),
    v.literal("stage1_chunking_failed"),
    v.literal("stage2_structuring_inprogress"),
    v.literal("stage2_structuring_completed"), // Wenn alle Chunks strukturiert sind
    v.literal("stage2_structuring_failed"), // Wenn Strukturierung eines Chunks fehlschlägt
    v.literal("stage3_analysis_inprogress"),
    // analysis_completed, analysis_failed_partial etc. können beibehalten/angepasst werden
    ```
2.  **Feld für große Chunks hinzufügen:** Füge ein neues optionales Feld zum `contracts`-Schema hinzu, um die Ergebnisse von Stufe 1 zu speichern:
    ```typescript
    largeChunks: v.optional(v.array(v.object({
        chunkNumber: v.number(),
        identifiedSections: v.array(v.string()), // Enthält nummerierte/benannte Hauptabschnitte
        chunkContent: v.string()
    }))),
    ```
3.  **Strukturierte Elemente anpassen (optional, aber empfohlen):** Erwäge, das `structuredContractElements`-Array anzupassen, um die Zugehörigkeit zu einem großen Chunk (`chunkNumber` aus Stufe 1) zu speichern. Dies erleichtert das spätere Zusammenfügen und die Fehlersuche. Füge `globalChunkNumber: v.number()` zur Objektdefinition hinzu. Passe auch `originalOrderInChunk` an, falls noch nicht vorhanden.
    ```typescript
    structuredContractElements: v.optional(v.array(
      v.object({
        // ... bestehende Felder ...
        elementType: v.string(),
        elementId: v.string(),
        markdownContent: v.string(),
        originalOrderInChunk: v.number(), // Reihenfolge innerhalb des Stage-2-JSON-Outputs
        globalChunkNumber: v.number(), // Nummer des großen Chunks aus Stage 1
        evaluation: v.optional(v.string()),
        // ... restliche Felder ...
      })
    )),
    ```
4.  **Fortschrittsfelder anpassen:** Entferne oder passe alte Felder wie `totalChunks`, `chunksProcessed` an, die sich auf die *kleinen* Analyse-Chunks bezogen. Füge ggf. neue Felder hinzu, um den Fortschritt von Stufe 2 (Anzahl strukturierter Chunks) und Stufe 3 (Anzahl analysierter Elemente) zu verfolgen. Z.B.:
    ```typescript
    totalLargeChunks: v.optional(v.number()),
    structuredLargeChunks: v.optional(v.number()),
    totalElementsToAnalyze: v.optional(v.number()),
    analyzedElements: v.optional(v.number()),
    ```

### 2.2. System Prompts Speichern

1.  Definiere die finalisierten System Prompts für Agent 1 (Stufe 1) und Agent 2 (Stufe 2) als Konstanten, idealerweise in `convex/gemini.ts` oder einer dedizierten `convex/prompts.ts`-Datei.
    *   `SYSTEM_PROMPT_AGENT1_CHUNK`: Der oben definierte Prompt für die globale Struktur und das Grob-Chunking.
    *   `SYSTEM_PROMPT_AGENT2_STRUCTURE`: Der oben definierte Prompt für die detaillierte Strukturierung pro Chunk.
    *   `SYSTEM_PROMPT_AGENT3_ANALYZE`: Der (wahrscheinlich bestehende oder leicht angepasste) Prompt für die Rot/Gelb/Grün-Analyse pro Element (Gemini Flash).

## 3. Implementierung der Stufen

### 3.1. Stufe 1: Globale Struktur & Grob-Chunking

1.  **Neue Gemini Action (`convex/gemini.ts`):**
    *   Erstelle eine neue `internalAction` namens `runStage1Chunking`.
    *   **Input:** `{ contractText: string }`.
    *   **Logik:** Ruft die Gemini API mit dem `gemini-2.5-pro` Modell und dem `SYSTEM_PROMPT_AGENT1_CHUNK` auf. Parst die JSON-Antwort.
    *   **Output:** Gibt die Liste der Chunk-Objekte `[{ chunkNumber, identifiedSections[], chunkContent }]` zurück oder wirft einen Fehler.
2.  **Anpassung Haupt-Action (`convex/contractActions.ts`):**
    *   Modifiziere `startFullContractAnalysis` (oder eine Kopie/neue Action, falls sauberer).
    *   **Erster Schritt:** Lade den Vertragstext.
    *   **Zweiter Schritt:** Rufe `ctx.runMutation(internal.contractMutations.updateContractStatus, { contractId, status: "stage1_chunking_inprogress" })` auf.
    *   **Dritter Schritt:** Rufe `ctx.runAction(internal.gemini.runStage1Chunking, { contractText })` auf.
    *   **Vierter Schritt (bei Erfolg):** Rufe eine neue Mutation `internal.contractMutations.saveLargeChunks` auf (siehe nächster Punkt).
    *   **Fehlerbehandlung:** Bei Fehler in `runStage1Chunking`, rufe `ctx.runMutation(internal.contractMutations.updateContractStatus, { contractId, status: "stage1_chunking_failed", errorMessage: ... })` auf und beende.
3.  **Neue Mutation (`convex/contractMutations.ts`):**
    *   Erstelle eine neue `internalMutation` namens `saveLargeChunks`.
    *   **Input:** `{ contractId: Id<"contracts">, largeChunks: LargeChunkType[] }` (wobei `LargeChunkType` dem Schema entspricht).
    *   **Logik:** Patcht das `contracts`-Dokument: Setzt das Feld `largeChunks` und aktualisiert den Status auf `"stage1_chunking_completed"` sowie `totalLargeChunks: largeChunks.length`.
    *   **Trigger für Stufe 2:** Diese Mutation (oder die aufrufende Action nach erfolgreicher Mutation) muss den Start von Stufe 2 auslösen.

### 3.2. Stufe 2: Detaillierte Strukturierung (Parallel pro Chunk)

1.  **Neue Gemini Action (`convex/gemini.ts`):**
    *   Erstelle eine neue `internalAction` namens `runStage2Structuring`.
    *   **Input:** `{ chunkContent: string, chunkNumber: number }`.
    *   **Logik:** Ruft die Gemini API mit `gemini-2.5-pro` und `SYSTEM_PROMPT_AGENT2_STRUCTURE` auf. Parst die JSON-Antwort (Liste der Strukturelemente). Fügt jedem Element die `globalChunkNumber` hinzu.
    *   **Output:** Gibt die Liste der strukturierten Elemente `[{ ..., globalChunkNumber }]` für diesen Chunk zurück oder wirft einen Fehler.
2.  **Anpassung Orchestrierung (`convex/contractActions.ts`):**
    *   Innerhalb von `startFullContractAnalysis` (oder der Nachfolger-Action), *nachdem* `saveLargeChunks` erfolgreich war:
        *   Setze Status auf `"stage2_structuring_inprogress"`.
        *   Lese die gespeicherten `largeChunks` aus dem Dokument.
        *   Iteriere über die `largeChunks`. Für jeden Chunk:
            *   Starte **asynchron** (ohne `await` direkt hier, sondern parallel) die Action `ctx.runAction(internal.gemini.runStage2Structuring, { chunkContent: chunk.chunkContent, chunkNumber: chunk.chunkNumber })`.
            *   **WICHTIG:** Die Action `runStage2Structuring` (oder eine dedizierte Wrapper-Action) muss am Ende ihres erfolgreichen Laufs eine Mutation aufrufen, um *ihre* Ergebnisse zu speichern und den Fortschritt zu melden (siehe nächster Punkt).
        *   **Kein `Promise.all` hier:** Die Verarbeitung ist parallel, aber das Zusammenführen und Starten von Stufe 3 erfolgt erst, wenn *alle* Chunks verarbeitet sind (siehe Mutationslogik unten).
3.  **Neue/Angepasste Mutation (`convex/contractMutations.ts`):**
    *   Erstelle eine neue `internalMutation` namens `saveStructuredChunk`.
    *   **Input:** `{ contractId: Id<"contracts">, chunkNumber: number, structuredElements: StructuredElementType[] }`.
    *   **Logik:**
        *   Lese das `contracts`-Dokument.
        *   Füge die `structuredElements` zum `structuredContractElements`-Array hinzu (oder einem temporären Speicher, falls das Hauptarray erst am Ende befüllt werden soll). Stelle sicher, dass die Reihenfolge basierend auf `chunkNumber` und `originalOrderInChunk` erhalten bleibt.
        *   Inkrementiere einen Zähler für verarbeitete Chunks (z.B. `structuredLargeChunks`).
        *   **Prüfung & Trigger Stufe 3:** Wenn `structuredLargeChunks === totalLargeChunks`:
            *   Konsolidiere ggf. alle Elemente im `structuredContractElements`-Array in der korrekten globalen Reihenfolge.
            *   Setze den Status auf `"stage2_structuring_completed"`.
            *   Berechne `totalElementsToAnalyze` (Gesamtzahl der Elemente in `structuredContractElements`).
            *   **Löse Stufe 3 aus.**
    *   **Fehlerbehandlung:** Wenn eine `runStage2Structuring`-Action fehlschlägt, muss dies gemeldet werden (z.B. durch eine separate Mutation), um den Status auf `"stage2_structuring_failed"` zu setzen.

### 3.3. Stufe 3: Element-Analyse (Parallel pro Element)

1.  **Anpassung Gemini Action (`convex/gemini.ts`):**
    *   Passe die bestehende `generateAnalysisWithPro` (oder erstelle `runStage3ElementAnalysis`) an.
    *   **Modell:** Stelle sicher, dass `gemini-2.5-flash-preview-04-17` verwendet wird.
    *   **Input:** `{ elementMarkdown: string, elementId: string, vectorContext: string (optional) }`.
    *   **Logik:** Ruft Gemini mit `SYSTEM_PROMPT_AGENT3_ANALYZE` auf. Holt ggf. Kontext aus der Vektor-DB basierend auf `elementMarkdown`. Parst das Ergebnis (Evaluation, Reason etc.).
    *   **Output:** Gibt das Analyseergebnis `{ elementId, evaluation, ... }` zurück.
2.  **Anpassung Orchestrierung (`convex/contractActions.ts`):**
    *   Der Trigger für Stufe 3 kommt aus der `saveStructuredChunk`-Mutation, wenn der letzte Chunk strukturiert wurde. Dieser Trigger sollte eine neue Action starten (z.B. `startStage3Analysis`).
    *   Die `startStage3Analysis`-Action:
        *   Setzt Status auf `"stage3_analysis_inprogress"`.
        *   Liest *alle* `structuredContractElements` aus dem Dokument.
        *   Iteriert über *jedes* Element. Für jedes Element:
            *   Starte **asynchron** die Action `ctx.runAction(internal.gemini.runStage3ElementAnalysis, { elementMarkdown: element.markdownContent, elementId: element.elementId, ... })`.
            *   Auch hier: Die Action muss am Ende eine Mutation aufrufen, um ihr Ergebnis zu speichern und den Fortschritt zu melden.
3.  **Anpassung Mutation (`convex/contractMutations.ts`):**
    *   Passe die bestehende `bulkMergeAnalysisResults` an oder erstelle eine neue Mutation (z.B. `saveElementAnalysisResult`).
    *   **Input:** `{ contractId: Id<"contracts">, analysisResult: ElementAnalysisResultType }`.
    *   **Logik:**
        *   Findet das entsprechende Element im `structuredContractElements`-Array anhand der `elementId`.
        *   Patcht dieses Element mit den Analyseergebnissen (`evaluation`, `reason`, etc.).
        *   Inkrementiert einen Zähler für analysierte Elemente (z.B. `analyzedElements`).
        *   **Prüfung & Abschluss:** Wenn `analyzedElements === totalElementsToAnalyze`:
            *   Setze den finalen Status (z.B. `"analysis_completed"` oder `"analysis_failed_partial"` je nach Erfolg der einzelnen Analysen).
    *   **Fehlerbehandlung:** Wenn eine `runStage3ElementAnalysis`-Action fehlschlägt, sollte das `isError`-Flag im Element gesetzt werden und der `errorMessage` gespeichert werden. Der Gesamtstatus am Ende sollte dies widerspiegeln.

## 4. Aufräumen und Testen

1.  **Code-Review:** Überprüfe alle geänderten Actions und Mutations auf Korrektheit, Konsistenz und Fehlerbehandlung.
2.  **Alten Code entfernen:** Entferne nicht mehr benötigte Funktionen (wie `createAnalysisChunksFromStructuredElements`, die alte Version von `_performSingleChunkAnalysis`) und ggf. alte Status-Literale oder Schema-Felder.
3.  **Testing:** Teste den gesamten Ablauf gründlich mit verschiedenen Verträgen (kurz, lang, unterschiedlich strukturiert), um sicherzustellen, dass alle Stufen korrekt durchlaufen, die Ergebnisse korrekt gespeichert werden und die Status-Updates stimmen. Überprüfe die Fehlerbehandlung.

## 5. Wichtige Hinweise

*   **Parallelität vs. Transaktionslimits:** Die parallele Ausführung von Actions in Stufe 2 und 3 ist effizient, aber jede Action, die eine Mutation aufruft, um Ergebnisse zu speichern, initiiert eine eigene Transaktion. Achte auf Convex-Limits bezüglich gleichzeitig laufender Actions/Mutations. Ggf. müssen Batching-Mechanismen oder Warteschlangen implementiert werden, falls die Anzahl der Chunks/Elemente sehr groß wird.
*   **Fehlerbehandlung:** Implementiere robuste Fehlerbehandlung für jeden API-Aufruf und jede Action. Was passiert, wenn Stufe 1 fehlschlägt? Was, wenn nur ein Chunk in Stufe 2 fehlschlägt? Wie wird der Endstatus gesetzt?
*   **Status-Updates:** Stelle sicher, dass der `contractStatus` und die Fortschrittszähler in den Mutationen atomar und korrekt aktualisiert werden.
*   **Idempotenz:** Soweit möglich, sollten Actions/Mutations idempotent sein, um bei Wiederholungen (z.B. nach Timeouts) keine unerwünschten Nebeneffekte zu haben.
*   **Modellnamen:** Verwende Konstanten für die Modellnamen (`gemini-2.5-pro`, `gemini-2.5-flash-preview-04-17`), um sie leicht ändern zu können.

Diese Anleitung sollte einem Entwickler (oder einem fähigen KI-Agenten) ermöglichen, die Umstrukturierung systematisch durchzuführen.