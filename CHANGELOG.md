# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [Unreleased]

[TIMESTAMP: 2024-05-16 15:10:00]
TYPE: BUGFIX
SCOPE: components/dashboard-shell.tsx
DESCRIPTION: Die `className`-Prop wurde von der `<ApexAnalyticsLogo />`-Komponente entfernt, um einen Linter-Fehler ('Property className does not exist on type IntrinsicAttributes') zu beheben. Das Styling der Logotype-Größe muss ggf. innerhalb der `ApexAnalyticsLogo`-Komponente selbst oder durch andere Props erfolgen.
REASON: Behebung eines Linter-Fehlers aufgrund einer nicht unterstützten Prop.

[TIMESTAMP: {{YYYY-MM-DD HH:MM:SS}}]
TYPE: FIX
SCOPE: app/page.tsx, components/dashboard-shell.tsx
DESCRIPTION: Korrigiert die Platzierung des Website-Footers und entfernt einen unerwünschten Button.
    1. Footer-Text ('ApexAnalytics (ehem. Baulytics) by GemDynamics...') wurde vom Ende der `app/page.tsx` entfernt.
    2. Der Footer wurde korrekt in das `<footer>`-Element von `components/dashboard-shell.tsx` mit dem Text 'ApexAnalytics (ehem. Baulytics) by GemDynamics Gewinner des Hackathon der KI CON 2025 in Wien' und passenden Tailwind-Klassen eingefügt.
    3. Ein als "Jetzt Analyse starten" beschrifteter Button (und der umschließende `AuthRedirectLink`) wurde aus `app/page.tsx` entfernt.
REASON: Korrektur von Fehlplatzierungen und UI-Elementen aus einer vorherigen Aktualisierungsrunde, um die Konsistenz und korrekte Darstellung der Benutzeroberfläche sicherzustellen.

[TIMESTAMP: {{YYYY-MM-DD HH:MM:SS}}]
TYPE: BUGFIX
SCOPE: app/layout.tsx, components/animation/page-transition-wrapper.tsx
DESCRIPTION: Behebt einen Build-Fehler ("It's currently unsupported to use 'export *' in a client boundary") im Zusammenhang mit `framer-motion`. Die Seitenübergangsanimationen wurden in eine dedizierte Client-Komponente (`components/animation/page-transition-wrapper.tsx`) ausgelagert, die `"use client"` verwendet. Der `key` für `motion.div` innerhalb von `AnimatePresence` wird nun stabil über `usePathname` generiert, anstatt `Math.random()` zu verwenden. Der ungenutzte Import `ThemeToggle` wurde aus `app/layout.tsx` entfernt.
REASON: Behebung eines kritischen Build-Fehlers und Verbesserung der Robustheit und Korrektheit der Seitenübergangsanimationen gemäß Next.js Best Practices.

[TIMESTAMP: 2024-07-30 12:20:00]
TYPE: FEATURE
SCOPE: Gesamte Webseite, app/layout.tsx, app/demo/page.tsx
DESCRIPTION: Framer Motion wurde zur Webseite hinzugefügt, um Animationen zu ermöglichen. Dies beinhaltet:
1. Installation von `framer-motion`.
2. Implementierung grundlegender Seitenübergangsanimationen (Fade-In/Slide) in `app/layout.tsx` mittels `AnimatePresence` und `motion.div`.
3. Hinzufügen einer beispielhaften Eingangs-Animation (Fade-In/Slide-Up) zu einem Container auf der `app/demo/page.tsx`.
4. Ergänzung der `app/demo/page.tsx` mit der `"use client"`-Direktive, um Framer Motion zu ermöglichen.
REASON: Verbesserung der Benutzererfahrung durch moderne und ansprechende Animationen, passend zum "Baulytics Epic Theme". Legt die Grundlage für weitere Animationen auf der gesamten Webseite.

[TIMESTAMP: 2024-07-30 12:05:00]
TYPE: STYLE
SCOPE: app/demo/page.tsx
DESCRIPTION: Added an ArrowLeft lucide icon to the "Zurück zur Startseite" link for improved visual affordance. Adjusted link styling to accommodate the icon using flexbox.
REASON: Enhance UI and adhere to the new guideline of using lucide icons.

[TIMESTAMP: 2024-07-30 12:00:00]
TYPE: STYLE
SCOPE: app/demo/page.tsx
DESCRIPTION: Adjusted the background of the main informational container on the demo page to use a semi-transparent glassmorphism effect (bg-card/50 backdrop-blur-md). This allows the global rolling gradient background to be visible through the container, enhancing the visual consistency with the Baulytics Epic Theme and eliminating the 'ugly rectangle' effect previously caused by an opaque background.
REASON: Improve visual integration of the demo page with the new global theme, ensuring the rolling gradient is not obscured while maintaining content readability.

[TIMESTAMP: 2024-07-30 11:45:00]
TYPE: FEATURE
SCOPE: components/ui/resizable.tsx
DESCRIPTION: Themed ResizableHandle component. Base style set to bg-border/70. Enhanced focus ring. Added distinct background colors and increased thickness for hover and drag states using data-attributes. The optional grip icon (withHandle) container is now styled with a glass effect (bg-background/70, backdrop-blur-sm, shadow-lg), and the icon itself is larger with themed text color. Improved touch/drag area for the handle.
REASON: Align Resizable component with the Baulytics Epic Theme and improve interactivity and visual feedback.

[TIMESTAMP: 2024-07-30 11:30:00]
TYPE: FEATURE
SCOPE: components/ui/pagination.tsx
DESCRIPTION: Themed Pagination component. PaginationContent gap increased. PaginationLink styled for active (brand-gradient background, light text) and normal (ghost-like with themed hover/focus) states. Consistent rounded corners and transitions applied. PaginationEllipsis text color updated.
REASON: Align Pagination component with the Baulytics Epic Theme and improve visual consistency.

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

## JJJJ-MM-TT (oder Version)

### Geändert
- **Umfassende Überarbeitung des Vertragsanalyse-Prozesses:** Implementierung einer neuen dreistufigen Architektur zur Verbesserung der Strukturerkennung, Robustheit und Analysequalität:
    - **Stufe 1 (Gemini 2.5 Pro):** Identifiziert globale Hauptabschnitte und teilt den Vertrag in große, logische Chunks auf. Ergebnisse werden im neuen Schemafeld `largeChunks` gespeichert.
    - **Stufe 2 (Gemini 2.5 Pro):** Erstellt parallel pro großem Chunk eine detaillierte, hierarchische JSON-Struktur (`structuredContractElements`), wobei die Zugehörigkeit zum großen Chunk (`globalChunkNumber`) vermerkt wird.
    - **Stufe 3 (Gemini 2.5 Flash):** Führt parallel für jedes einzelne Strukturelement die Risiko- und Empfehlungsanalyse (Rot/Gelb/Grün) durch, unter Nutzung von Kontext aus der Vektor-Datenbank. Ergebnisse werden direkt im jeweiligen Element gespeichert.
- **Schema (`convex/schema.ts`):**
    - Neue Status-Literale für die drei Verarbeitungsstufen und deren Fehlerzustände hinzugefügt (z.B. `stage1_chunking_inprogress`, `stage2_structuring_failed`, etc.).
    - Neues Feld `largeChunks` (Array von Objekten) hinzugefügt.
    - Feld `globalChunkNumber` zur Definition von `structuredContractElements` hinzugefügt.
    - Neue Felder zur Fortschrittsverfolgung hinzugefügt: `totalLargeChunks`, `structuredLargeChunks`, `totalElementsToAnalyze`, `analyzedElements`.
- **Actions (`convex/contractActions.ts`, `convex/gemini.ts`):
    - Neue interne Actions für die einzelnen Stufen erstellt: `runStage1Chunking`, `runStage2Structuring`.
    - Bestehende Action zur Elementanalyse (`generateAnalysisWithPro`) angepasst für Stufe 3 (Nutzung von Gemini Flash).
    - Neue interne Actions zur Orchestrierung der Stufen 2 und 3 hinzugefügt: `startStage2Structuring`, `startStage3Analysis`.
    - Action `startFullContractAnalysis` überarbeitet, um Stufe 1 zu starten.
- **Mutations (`convex/contractMutations.ts`):
    - Neue interne Mutationen zur Speicherung der Ergebnisse und des Fortschritts der Stufen 1 und 2 hinzugefügt: `saveLargeChunks`, `saveStructuredChunk` (oder ähnlich).
    - Mutation `mergeAnalysisResult` (oder ähnlich) angepasst/verwendet, um die Ergebnisse der Elementanalyse aus Stufe 3 zu speichern.
    - Mutation `updateContractStatus` für allgemeine Statusänderungen und Initialisierung der Fortschrittszähler verwendet.

### Entfernt
- Alte Logik zur Erstellung kleiner Analyse-Chunks (`createAnalysisChunksFromStructuredElements`) entfernt.
- Veraltete Status-Literale und Fortschrittsfelder (`totalChunks`, `processedChunks`), die sich auf die alte Chunking-Logik bezogen, entfernt bzw. ersetzt.
- Veraltetes Feld `analysisProtocol` aus der Vertragsdatenstruktur entfernt (war nicht mehr im Schema definiert und wurde durch `structuredContractElements` abgelöst).

[TIMESTAMP: 2023-09-01 14:35:22]
TYPE: FEATURE
SCOPE: GemDynamicsLogo, SVG-Animation
DESCRIPTION: Pixelgenaue Optimierung des GEM DYNAMICS Logos nach Referenzbild, einschließlich Animation mit Lichteffekt.
REASON: Verbesserung des visuellen Erscheinungsbilds für Markenintegrität

[TIMESTAMP: 2023-09-15 16:45:30]
TYPE: FEATURE
SCOPE: UI/UX, Theming
DESCRIPTION: Implementation eines neuen GEM DYNAMICS Design Systems mit modernem, futuristischem, technik-orientiertem Aussehen.
REASON: Verbesserung der visuellen Identität und Benutzererfahrung.

DETAILS:
- Dark- und Light-Mode optimiert mit GEM DYNAMICS Farbpalette
- Neue Farbvariablen und -schema für beide Modi
- Inter als primäre Schriftart integriert
- Glow-Effekte und animierte Farbverläufe für UI-Elemente
- Verbesserte Hover- und Interaktionseffekte
- Erweiterte Button- und Card-Komponenten mit neuen Eigenschaften
- Verschiedene visuelle Verbesserungen für eine modernere Ästhetik

[TIMESTAMP: 2024-05-16 11:00:00]
TYPE: FEATURE
SCOPE: components/ui/dialog.tsx
DESCRIPTION: Refined Dialog component styling to align with 'Baulytics Epic Theme'. Adjusted close button, paddings, and text styles.
REASON: Theme consistency and improved visual appeal.

[TIMESTAMP: 2024-05-16 11:05:00]
TYPE: FEATURE
SCOPE: components/ui/accordion.tsx
DESCRIPTION: Updated Accordion component with 'Baulytics Epic Theme' styles. Enhanced interactive feedback, typography, borders, and animations.
REASON: Theme consistency and improved user experience.

[TIMESTAMP: 2024-05-16 11:10:00]
TYPE: FEATURE
SCOPE: components/ui/badge.tsx
DESCRIPTION: Themed Badge component for 'Baulytics Epic Theme'. Default variant now uses brand gradient, added 'glass' variant, and updated existing variant styles.
REASON: Enhanced visual variety and theme alignment.

[TIMESTAMP: 2024-05-16 11:25:00]
TYPE: FEATURE
SCOPE: components/ui/sidebar.tsx
DESCRIPTION: Extensively themed Sidebar component and its numerous sub-components to match the 'Baulytics Epic Theme'. Adjusted backgrounds (glassmorphism), borders, text colors, hover/active states for navigation links, icons, inputs, and other elements within the sidebar.
REASON: Comprehensive theme integration for a core navigation element, ensuring a consistent and modern user experience.

[TIMESTAMP: 2024-05-16 11:30:00]
TYPE: FEATURE
SCOPE: components/ui/table.tsx
DESCRIPTION: Updated Table component styles for 'Baulytics Epic Theme'. Implemented themed table wrapper, adjusted borders, header/footer backgrounds, row hover/selected states, and text styles for improved readability and visual consistency.
REASON: Theme alignment for data presentation and improved visual appeal.

[TIMESTAMP: 2024-07-30 10:30:00]
TYPE: REFACTOR
SCOPE: components/ui/table.tsx
DESCRIPTION: Die Table-Komponente wurde gemäß dem "Baulytics Epic Theme" überarbeitet. Dies umfasst Anpassungen an Rändern, Hintergründen (inkl. Glaseffekt für den Container), Hover-Effekten, Typografie (insbesondere Header und Zellen-Padding), Trennlinien und optionalem dezentem Zebra-Striping. Der Header ist nun deutlicher abgegrenzt und die gesamte Tabelle hat ein moderneres, abgerundetes Aussehen.
REASON: Anpassung an das neue UI-Theme für ein konsistentes und visuell ansprechendes Design.

[TIMESTAMP: 2024-07-30 10:45:00]
TYPE: REFACTOR
SCOPE: components/ui/tooltip.tsx
DESCRIPTION: Die TooltipContent-Komponente wurde an das "Baulytics Epic Theme" angepasst. Dies beinhaltet abgerundete Ecken (`rounded-lg`), einen feineren Rand (`border-border/60`), einen Glaseffekt (`bg-popover/80 backdrop-blur-lg`), einen deutlicheren Schatten (`shadow-lg`) und die Beibehaltung der bestehenden Animationen für ein konsistentes Erscheinungsbild.
REASON: Verbesserung der visuellen Konsistenz und des Erscheinungsbilds von Tooltips gemäß dem globalen UI-Theme.

[TIMESTAMP: 2024-07-30 11:00:00]
TYPE: REFACTOR
SCOPE: components/ui/sheet.tsx
DESCRIPTION: Die Sheet-Komponente wurde umfassend an das "Baulytics Epic Theme" angepasst. `SheetOverlay` verwendet nun einen `backdrop-blur-sm` Effekt. `SheetContent` hat einen stärkeren Glaseffekt (`bg-card/90 backdrop-blur-xl`), einen `shadow-2xl` und positionsabhängige abgerundete Ecken (`rounded-*-2xl`). Das Schließen-Icon sowie `SheetHeader`, `SheetFooter`, `SheetTitle` und `SheetDescription` wurden ebenfalls thematisch überarbeitet (Padding, Ränder, Typografie) für ein kohärentes Design.
REASON: Sicherstellung der visuellen Konsistenz von Off-Canvas-Elementen mit dem globalen UI-Theme.

[TIMESTAMP: 2024-07-30 11:15:00]
TYPE: REFACTOR
SCOPE: components/ui/select.tsx
DESCRIPTION: Die Select-Komponente und ihre Sub-Komponenten (`SelectTrigger`, `SelectContent`, `SelectItem`, `SelectLabel`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`) wurden an das "Baulytics Epic Theme" angepasst. Dies umfasst Glaseffekte für Trigger und Content-Bereich, themenkonforme Farben, Ränder, Hover/Fokus-Zustände (konsistent mit Input und DropdownMenu), angepasste Icons und Animationen.
REASON: Vereinheitlichung des Erscheinungsbilds von Formular- und Auswahl-Steuerelementen mit dem globalen UI-Theme.

[TIMESTAMP: 2024-07-30 11:30:00]
TYPE: REFACTOR
SCOPE: components/ui/menubar.tsx
DESCRIPTION: Die Menubar-Komponente und alle ihre Sub-Komponenten wurden umfassend an das "Baulytics Epic Theme" angepasst. Der `Menubar`-Container selbst hat einen dezenten Glaseffekt. `MenubarTrigger` ähnelt den `NavigationMenuTrigger`-Stilen. Alle Dropdown-artigen Elemente (`MenubarContent`, `MenubarItem`, `MenubarCheckboxItem`, `MenubarRadioItem`, `MenubarSubContent`, etc.) wurden konsistent zu `DropdownMenu` gestaltet, inklusive Glaseffekten, Padding, Hover/Fokus-Zuständen, Icons und Animationen. Ein Tippfehler bei `MenubarShortcut.displayname` wurde zu `displayName` korrigiert.
REASON: Konsistente Darstellung von Menüleisten und deren Untermenüs im Einklang mit dem globalen UI-Theme und anderen Navigations-/Dropdown-Komponenten.

[TIMESTAMP: 2024-07-30 11:45:00]
TYPE: REFACTOR
SCOPE: components/ui/context-menu.tsx
DESCRIPTION: Die ContextMenu-Komponente und ihre Sub-Komponenten (`ContextMenuContent`, `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioItem`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuSubTrigger`, `ContextMenuSubContent`) wurden an das "Baulytics Epic Theme" angepasst. Die Stile wurden direkt von der `DropdownMenu`-Komponente übernommen, um eine vollständige visuelle Konsistenz zu gewährleisten. Dies beinhaltet Glaseffekte für Content-Bereiche, themenkonforme Farben, Ränder, Paddings, Hover/Fokus-Effekte und Animationen.
REASON: Sicherstellung eines einheitlichen Erscheinungsbilds für alle kontextbezogenen Menüs gemäß dem globalen UI-Theme.

[TIMESTAMP: 2024-07-30 12:00:00]
TYPE: REFACTOR
SCOPE: components/ui/alert.tsx
DESCRIPTION: Die Alert-Komponente (`Alert`, `AlertTitle`, `AlertDescription`) wurde an das "Baulytics Epic Theme" angepasst. Der Basis-Container verwendet nun einen dezenten Glaseffekt (`bg-card/70 backdrop-blur-md`), abgerundete Ecken (`rounded-xl`) und einen themenkonformen Rand. `AlertTitle` und `AlertDescription` wurden typografisch angepasst. Die Varianten `default` und `destructive` wurden überarbeitet, um themenkonforme Farben (inkl. Icon-Farben) und für `destructive` einen spezifischen Hintergrund mit Glaseffekt (`bg-destructive/20 backdrop-blur-md`) zu nutzen.
REASON: Visuelle Angleichung der Alert-Komponente an das globale UI-Theme für eine konsistente Benutzererfahrung bei Benachrichtigungen.

[TIMESTAMP: 2024-07-30 12:15:00]
TYPE: REFACTOR
SCOPE: components/ui/alert-dialog.tsx
DESCRIPTION: Die AlertDialog-Komponente und ihre Sub-Komponenten (`AlertDialogOverlay`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`) wurden an das "Baulytics Epic Theme" angepasst. Die Stile orientieren sich stark an der bereits thematisierten `Dialog`-Komponente (Glaseffekte für Overlay und Content, Ränder, Schatten, Typografie) und den `Button`-Varianten (`brand_gradient` für Action, `outline` für Cancel).
REASON: Konsistente Darstellung von Bestätigungsdialogen im Einklang mit dem globalen UI-Theme.

[TIMESTAMP: 2024-07-30 12:30:00]
TYPE: REFACTOR
SCOPE: components/ui/avatar.tsx
DESCRIPTION: Die Avatar-Komponente (`Avatar`, `AvatarFallback`) wurde an das "Baulytics Epic Theme" angepasst. `Avatar` (der Container) erhielt einen dezenten Schatten, Ring und Hover-Effekt. `AvatarFallback` verwendet nun den `brand-gradient` als Hintergrund und hat angepasste Textstile (Schriftgröße, -gewicht, Farbe) für eine bessere Lesbarkeit der Initialen.
REASON: Visuelle Angleichung der Avatar-Komponente an das globale UI-Theme.

[TIMESTAMP: 2024-07-30 12:45:00]
TYPE: REFACTOR
SCOPE: components/ui/popover.tsx
DESCRIPTION: Die Popover-Komponente (`PopoverContent`) wurde an das "Baulytics Epic Theme" angepasst. Die Stile für `PopoverContent` wurden von `DropdownMenuContent` abgeleitet, um Konsistenz zu gewährleisten. Dies beinhaltet Glaseffekte (`bg-popover/80 backdrop-blur-lg`), themenkonforme Farben, Ränder (`border-border/60`), Schatten (`shadow-2xl`), Padding und Animationen. Die Breitenbeschränkungen wurden angepasst (`w-auto min-w-[12rem] max-w-xs`), um flexibleren Inhalt zu ermöglichen, und das Padding wurde leicht reduziert (`p-3`).
REASON: Sicherstellung eines einheitlichen Erscheinungsbilds für Popover-Elemente gemäß dem globalen UI-Theme.

[TIMESTAMP: 2024-07-30 13:00:00]
TYPE: REFACTOR
SCOPE: components/ui/calendar.tsx
DESCRIPTION: Die Calendar-Komponente wurde umfassend an das "Baulytics Epic Theme" angepasst. Dies beinhaltet einen Hauptcontainer mit Glaseffekt (`bg-card/80 backdrop-blur-lg`), thematisch gestaltete Navigationselemente, angepasste Typografie für Monats/Jahresüberschriften und Wochentage sowie detaillierte Stile für Tageszellen (Standard, ausgewählt mit Brand-Gradient, heute, außerhalb des Monats, deaktiviert, Bereichsauswahl) inklusive konsistenter Hover-, Fokus- und Rundungseffekte.
REASON: Visuelle Angleichung der Kalender-Komponente an das globale UI-Theme für eine einheitliche und moderne Benutzererfahrung.

[TIMESTAMP: 2024-07-30 13:15:00]
TYPE: REFACTOR
SCOPE: components/ui/checkbox.tsx
DESCRIPTION: Die Checkbox-Komponente wurde an das "Baulytics Epic Theme" angepasst. Änderungen umfassen eine vergrößerte Darstellung (`h-5 w-5`), abgerundete Ecken (`rounded-md`), themenkonforme Ränder (`border-border/70`) und einen transparenten Hintergrund im Normalzustand. Im aktivierten Zustand wird der `brand-gradient` als Hintergrund und ein transparenter Rand verwendet. Fokus- (`ring-primary`) und Deaktiviert-Zustände (`opacity-60`) wurden ebenfalls angepasst.
REASON: Vereinheitlichung des Erscheinungsbilds von Formular-Steuerelementen mit dem globalen UI-Theme.

[TIMESTAMP: 2024-07-30 13:30:00]
TYPE: REFACTOR
SCOPE: components/ui/radio-group.tsx
DESCRIPTION: Die `RadioGroupItem`-Komponente wurde an das "Baulytics Epic Theme" angepasst. Die Änderungen umfassen eine vergrößerte Darstellung (`h-5 w-5`), einen themenkonformen Rand (`border-border/70`) im Normalzustand. Im aktivierten Zustand wird der Rand sowie der Indikator (via `text-primary`) in der Primärfarbe dargestellt. Fokus- (`ring-primary`) und Deaktiviert-Zustände (`opacity-60`) wurden ebenfalls an das Theme angepasst.
REASON: Konsistenz im Erscheinungsbild von Formular-Steuerelementen mit dem globalen UI-Theme.

[TIMESTAMP: 2024-07-30 13:45:00]
TYPE: REFACTOR
SCOPE: components/ui/switch.tsx
DESCRIPTION: Die Switch-Komponente wurde an das "Baulytics Epic Theme" angepasst. Der Track (Hintergrund) verwendet nun den `brand-gradient` im aktivierten Zustand und `bg-border/40` im deaktivierten Zustand. Der Thumb (Schieber) hat einen `bg-white` Hintergrund für besseren Kontrast. Fokus- (`ring-primary`) und Deaktiviert-Stile (`opacity-60`) wurden ebenfalls aktualisiert.
REASON: Konsistenz im Erscheinungsbild von Formular-Steuerelementen mit dem globalen UI-Theme.

[TIMESTAMP: 2024-07-30 14:00:00]
TYPE: REFACTOR
SCOPE: components/ui/slider.tsx
DESCRIPTION: Die Slider-Komponente wurde an das "Baulytics Epic Theme" angepasst. Der Track ist nun schlanker (`h-1.5`) und hat einen `bg-border/40` Hintergrund. Der Range (Fortschritt) verwendet den `brand-gradient`. Der Thumb ist `bg-white` mit `shadow-lg` und ohne direkten Rand. Fokus- (`ring-primary`) und Deaktiviert-Stile (`opacity-60`) wurden ebenfalls aktualisiert.
REASON: Visuelle Angleichung der Slider-Komponente an das globale UI-Theme.

[TIMESTAMP: 2024-07-30 14:15:00]
TYPE: REFACTOR
SCOPE: components/ui/progress.tsx
DESCRIPTION: Die Progress-Komponente wurde an das "Baulytics Epic Theme" angepasst. Der Track (Hintergrund) ist nun schlanker (`h-2`) und verwendet `bg-border/30`. Der Indikator (Fortschrittsbalken) verwendet den `brand-gradient`.
REASON: Visuelle Angleichung der Progress-Komponente an das globale UI-Theme für eine moderne Darstellung von Fortschrittsanzeigen.

[TIMESTAMP: 2024-07-30 14:25:00]
TYPE: REFACTOR
SCOPE: components/ui/skeleton.tsx
DESCRIPTION: Die Skeleton-Komponente wurde an das "Baulytics Epic Theme" angepasst. Der Hintergrund verwendet nun `bg-border/25` für eine subtile Darstellung auf den thematisierten Hintergründen, während die `animate-pulse` Animation beibehalten wird.
REASON: Visuelle Angleichung der Skeleton-Komponente an das globale UI-Theme.

[TIMESTAMP: 2024-07-30 14:35:00]
TYPE: REFACTOR
SCOPE: components/ui/separator.tsx
DESCRIPTION: Die Separator-Komponente wurde an das "Baulytics Epic Theme" angepasst. Sie verwendet nun `bg-border/70` für eine subtilere Trennlinie, die gut mit den thematisierten Hintergründen harmoniert.
REASON: Visuelle Angleichung der Separator-Komponente an das globale UI-Theme.

[TIMESTAMP: 2024-07-30 14:45:00]
TYPE: REFACTOR
SCOPE: components/ui/scroll-area.tsx
DESCRIPTION: Die ScrollArea-Komponente wurde an das "Baulytics Epic Theme" angepasst. Der Scrollbar-Track wurde verschlankt (`w-2`/`h-2`). Der Thumb verwendet nun themenkonforme Indigo-Farbtöne mit Hover-Effekt (`bg-indigo-500/60 hover:bg-indigo-500/80 dark:bg-indigo-400/50 dark:hover:bg-indigo-400/70`) für eine moderne Optik.
REASON: Visuelle Angleichung der ScrollArea an das globale UI-Theme und Verbesserung des Scrollbar-Erscheinungsbildes.

[TIMESTAMP: 2024-07-30 14:55:00]
TYPE: REFACTOR
SCOPE: components/ui/hover-card.tsx
DESCRIPTION: Die `HoverCardContent`-Komponente wurde an das "Baulytics Epic Theme" angepasst, analog zu `PopoverContent` und `DropdownMenuContent`. Dies beinhaltet einen stärkeren Glaseffekt (`bg-popover/85 backdrop-blur-xl`), themenkonforme Ränder (`border-border/50`), Schatten (`shadow-2xl`), größere Rundungen (`rounded-xl`) und flexiblere Breitenangaben. Animationen wurden beibehalten.
REASON: Konsistente Darstellung von schwebenden Informationskarten mit dem globalen UI-Theme.

[TIMESTAMP: 2024-07-30 15:10:00]
TYPE: REFACTOR
SCOPE: components/ui/toast.tsx
DESCRIPTION: Die Toast-Komponenten (`Toast`, `ToastClose`, `ToastAction`, `ToastTitle`, `ToastDescription`) wurden umfassend an das "Baulytics Epic Theme" angepasst. `Toast` verwendet nun Glaseffekte (`bg-card/85 backdrop-blur-xl` für Default, `bg-destructive/85 backdrop-blur-xl` für Destructive), themenkonforme Ränder, Schatten (`shadow-xl`) und größere Rundungen (`rounded-xl`). `ToastClose` wurde neu positioniert und gestylt. `ToastAction` ähnelt nun thematisierten Outline-Buttons. `ToastTitle` und `ToastDescription` wurden typografisch angepasst für bessere Lesbarkeit und Konsistenz.
REASON: Konsistente Darstellung von Benachrichtigungen mit dem globalen UI-Theme.

[TIMESTAMP: 2024-07-30 11:15:00]
TYPE: FEATURE
SCOPE: components/ui/carousel.tsx
DESCRIPTION: Themed Carousel component. Adjusted CarouselContent to include rounded corners. Themed CarouselPrevious and CarouselNext buttons: applied 'glass' variant, increased size, adjusted positioning for better proximity to content, added hover effects, consistent focus rings, and clearer disabled states. Updated icon sizes and text colors for hover states.
REASON: Align Carousel component with the Baulytics Epic Theme visual style and improve usability.

[TIMESTAMP: 2024-07-30 11:30:00]
TYPE: FEATURE
SCOPE: components/ui/pagination.tsx
DESCRIPTION: Themed Pagination component. PaginationContent gap increased. PaginationLink styled for active (brand-gradient background, light text) and normal (ghost-like with themed hover/focus) states. Consistent rounded corners and transitions applied. PaginationEllipsis text color updated.
REASON: Align Pagination component with the Baulytics Epic Theme and improve visual consistency.

[TIMESTAMP: 2024-07-30 11:15:00]
TYPE: FEATURE
SCOPE: components/ui/carousel.tsx
DESCRIPTION: Themed Carousel component. Adjusted CarouselContent to include rounded corners. Themed CarouselPrevious and CarouselNext buttons: applied 'glass' variant, increased size, adjusted positioning for better proximity to content, added hover effects, consistent focus rings, and clearer disabled states. Updated icon sizes and text colors for hover states.
REASON: Align Carousel component with the Baulytics Epic Theme visual style and improve usability.

[TIMESTAMP: 2025-05-15 21:00:00]
TYPE: FEATURE
SCOPE: Branding, UI, Components
DESCRIPTION: Focused branding update: Integrated new animated SVG logo for ApexAnalytics, replaced project name 'BauVertragsanalyse' (and relevant instances of 'Baulytics') with 'ApexAnalytics' across UI texts and configurations, and updated footer content. Created new `AnimatedApexLogo` component with complex CSS/SMIL animations. Updated `dashboard-header.tsx`, `config/site.ts`, `app/layout.tsx`, `app/page.tsx`, and `components/dashboard-shell.tsx`.
REASON: Execute a focused branding update as per TASK_ID: FocusedBrandingUpdate_ApexAnalytics_LogoTextFooter_20250515_204000.

[TIMESTAMP: 2024-05-16 14:30:00]
TYPE: FIX
SCOPE: components/dashboard-shell.tsx
DESCRIPTION: Die Copyright-Informationen ("© 2024 ApexAnalytics. Alle Rechte vorbehalten.") wurden im Footer wiederhergestellt. Sie wurden unter dem bestehenden Footer-Text als separater Absatz hinzugefügt.
REASON: Wiederherstellung zuvor entfernter, aber weiterhin relevanter Copyright-Informationen im globalen Footer.

[TIMESTAMP: 2024-05-16 14:35:00]
TYPE: FEATURE
SCOPE: components/dashboard-shell.tsx
DESCRIPTION: Dem Footer wurden Links für "Impressum", "Datenschutz" und "Kontakt" hinzugefügt. Diese befinden sich in einem neuen Absatz unter der Copyright-Zeile und verwenden Platzhalter-Hrefs.
REASON: Erweiterung des Footers um rechtlich relevante und kontaktbezogene Links.

[TIMESTAMP: 2024-05-16 15:00:00]
TYPE: FEATURE
SCOPE: components/dashboard-shell.tsx
DESCRIPTION: Der Header wurde aktualisiert, um das `GemDynLogo.png` (als `next/image`) und die `ApexAnalyticsLogo`-Komponente (`@/components/ui/apex-analytics-logo.tsx`) zu verwenden. Das bisherige `Building2`-Icon und der Text-Logotype wurden ersetzt. Beide neuen Elemente sind mit `AuthRedirectLink` auf die Startseite verlinkt.
REASON: Umsetzung der Anforderungen aus TASK_ID: UpdateHeaderElements_20250516_042837 zur Aktualisierung der Header-Branding-Elemente.

[TIMESTAMP: 2024-05-16 15:05:00]
TYPE: BUGFIX
SCOPE: components/dashboard-shell.tsx
DESCRIPTION: Korrektur eines Importfehlers für die `ApexAnalyticsLogo`-Komponente. Der Import wurde von einem benannten Import (`{ ApexAnalyticsLogo }`) zu einem Standardimport (`ApexAnalyticsLogo`) geändert, um den Linter-Fehler und den Laufzeitfehler "Element type is invalid" zu beheben. Der ungenutzte Import `Building2` von `lucide-react` wurde ebenfalls entfernt.
REASON: Behebung eines Laufzeitfehlers und Linter-Fehlers, der durch einen falschen Importtyp verursacht wurde.

[TIMESTAMP: 2024-05-16 15:15:00]
TYPE: FEATURE
SCOPE: app/layout.tsx, Global Styles
DESCRIPTION: Die Schriftart 'Poppins' (Gewichtung 700) wurde dem Projekt hinzugefügt, indem die entsprechenden `<link>`-Tags (`preconnect` zu fonts.googleapis.com, fonts.gstatic.com und das Stylesheet) in die `app/layout.tsx` Datei eingefügt wurden. Dies ermöglicht die korrekte Darstellung der Schriftart im gesamten Projekt.
REASON: Erfüllung der Anforderung, die Poppins-Schriftart global zu laden, wie im bereitgestellten Bild spezifiziert.

[TIMESTAMP: 2024-05-16 15:20:00]
TYPE: BUGFIX
SCOPE: app/layout.tsx
DESCRIPTION: Das Attribut `precedence="default"` wurde dem `<link rel="stylesheet">`-Tag für die Poppins-Schriftart hinzugefügt. Dies behebt den Next.js-Fehler "Cannot render a <link rel=\"stylesheet\" /> outside the main document without knowing its precedence".
REASON: Behebung eines Laufzeitfehlers im Zusammenhang mit der Platzierung von Stylesheet-Links im Next.js App Router.

[TIMESTAMP: 2024-05-16 15:25:00]
TYPE: REFACTOR
SCOPE: components/ui/apex-analytics-logo.tsx, components/dashboard-shell.tsx
DESCRIPTION: 
1. Refaktorisierung von `components/ui/apex-analytics-logo.tsx`: `ApexAnalyticsAnimatedLogo` ist nun der Default-Export. Die `App`-Demokomponente und zugehöriger Beispielcode wurden entfernt, um die Datei auf die Kernfunktionalität der Logo-Komponente zu fokussieren. Die Komponente akzeptiert `fontSize` und `className` Props.
2. Anpassung von `components/dashboard-shell.tsx`: Der Import von `ApexAnalyticsAnimatedLogo` wurde auf den Default-Import umgestellt. Die Komponente wird nun mit einer `fontSize="1.5rem"` Prop gerendert, um die Größe im Header-Kontext anzupassen.
REASON: Korrekte Bereitstellung und Integration der `ApexAnalyticsAnimatedLogo`-Komponente gemäß TASK_ID: RefactorApexLogoComponent_And_GuideHeaderIntegration_20250516_044113. Behebt frühere Import- und Styling-Probleme.

[TIMESTAMP: 2024-05-16 15:30:00]
TYPE: FEATURE
SCOPE: components/dashboard-header.tsx
DESCRIPTION: Das `AnimatedApexLogo` (Wortmarke) wurde im `DashboardHeader` durch das `GemDynLogo.svg` (Bildmarke/Icon) ersetzt. Das SVG wird als React-Komponente importiert und verwendet die bestehenden Styling-Klassen (`h-10 w-auto`).
REASON: Anpassung des Header-Logos gemäß Benutzeranforderung, um die Bildmarke anstelle der animierten Wortmarke zu verwenden.

[TIMESTAMP: 2024-05-16 15:35:00]
TYPE: FEATURE
SCOPE: components/dashboard-header.tsx
DESCRIPTION: Das `GemDynLogo.svg` (Bildmarke/Icon) wurde im `DashboardHeader` durch die `DiamondLogo`-Komponente aus `components/ui/gd-logo.tsx` ersetzt. Die Größe wird über die `size="w-10 h-10"` Prop gesteuert.
REASON: Austausch des Header-Logos gemäß Benutzeranforderung, um die `DiamondLogo`-Komponente zu verwenden.

[TIMESTAMP: 2024-05-16 15:40:00]
TYPE: REVERT
SCOPE: components/dashboard-header.tsx
DESCRIPTION: Die `DiamondLogo`-Komponente (aus `components/ui/gd-logo.tsx`) und ihr Import wurden vorübergehend aus dem `DashboardHeader` entfernt.
REASON: Gemäß Benutzeranweisung, das Logo vorerst aus dem Header zu entfernen.

--- 