---
title: Gesamtplan zur Optimierung der KI-Vertragsanalyse
tags: [AI]

---

Absolut! Hier ist der aktualisierte, finale Gesamtplan. Er beinhaltet nun die Integration einer Vektordatenbank (unter Nutzung von Convex Vector Search) für eine dynamische und relevante Wissensbereitstellung an den Klauselanalyse-Agenten.

## Finaler, konsolidierter Gesamtplan zur Optimierung der KI-Vertragsanalyse (mit Vektor-Knowledge-Base)

Dieser Plan beschreibt ein mehrstufiges Verfahren zur Analyse und Strukturierung von Verträgen, das darauf abzielt, Genauigkeit, Konsistenz und Benutzerfreundlichkeit zu maximieren. Er integriert spezifische KI-Modelle, eine Vektor-Knowledge-Base und detaillierte System-Prompts für jede Aufgabe.

### Kernprinzipien:

1.  **Inkrementelle Strukturierung:** Verarbeitung des Vertrags in Abschnitten zur Handhabung von Kontextfensterbeschränkungen.
2.  **Vollständige JSON-Datenerfassung:** Alle Vertragselemente (Titel, Überschriften, Klauseln, Absätze) werden als typisierte JSON-Objekte gespeichert.
3.  **Markdown als zentrales Format:** Durchgängige Nutzung von Markdown für Inhaltsspeicherung, -verarbeitung und Export.
4.  **Beibehaltung der UI-Struktur:** Die Kachel- und Detailkartenlogik im Frontend bleibt erhalten.
5.  **Strategische KI-Modellauswahl:** Einsatz passender Gemini-Modelle (Pro vs. Flash) je nach Aufgabenkomplexität und Latenzanforderung.
6.  **Präzise Prompts und Längenkontrolle:** Detaillierte Anweisungen an die KI, inklusive Vorgaben zur Ausgabelänge.
7.  **Dynamische Wissensbasis mittels Vektordatenbank (Convex Vector Search):** Bereitstellung hochrelevanten Wissens für die Klauselanalyse durch Retrieval Augmented Generation (RAG).

---

### Stufe 0 (NEU): Vorbereitung und Befüllung der Vektor-Knowledge-Base (Convex)

**Ziel:** Aufbau einer durchsuchbaren Wissensdatenbank mit Regeln, Gesetzen und relevanten juristischen Informationen.

1.  **Wissensaufbereitung:**
    *   Die Inhalte von `RULES_FOR_ANALYSIS`, `LEGAL_BASIS_EXTRACT` sowie potenziell weitere Dokumente (z.B. spezifische Gesetzestexte, Kommentare zu VOB/B und ÖNORM, anonymisierte relevante Gerichtsurteile, interne Prüfrichtlinien) werden in granulare, semantisch zusammenhängende Informationseinheiten ("Wissens-Chunks") zerlegt.
    *   Beispiele für Wissens-Chunks: eine einzelne detaillierte Prüfregel, ein Gesetzesparagraph mit kurzer Erläuterung, die Kernaussage eines Urteils, eine spezifische Anforderung aus der ÖNORM.
    *   Jedem Wissens-Chunk werden Metadaten hinzugefügt (z.B. `source: "BGB §309"`, `type: "Gesetzestext"`, `keywords: ["Haftungsausschluss", "AGB"]`, `last_updated: "YYYY-MM-DD"`).
2.  **Embedding der Wissens-Chunks:**
    *   Jeder Wissens-Chunk (dessen Textinhalt) wird mithilfe eines Text-Embedding-Modells (z.B. von Google via Vertex AI oder ein anderes kompatibles Modell) in einen hochdimensionalen Vektor umgewandelt.
3.  **Speicherung in Convex:**
    *   Eine neue Tabelle in der Convex-Datenbank wird erstellt (z.B. `knowledgeChunks`).
    *   Jeder Eintrag in dieser Tabelle enthält:
        *   Den Rohtext des Wissens-Chunks (`textContent: v.string()`).
        *   Den generierten Vektor (`embedding: v.array(v.float64())`).
        *   Die Metadaten (`metadata: v.object({...})`).
        *   Eine eindeutige ID (automatisch von Convex als `_id` generiert).
    *   Auf dem `embedding`-Feld dieser Tabelle wird ein Vektor-Index in Convex definiert (z.B. `db.knowledgeChunks.defineIndex("embedding", { vectorField: "embedding", dimensions: 768 })`).
4.  **Prozess zur Aktualisierung:** Ein Mechanismus (manuell oder teilautomatisiert) muss etabliert werden, um die Vektor-KB bei Bedarf (neue Gesetze, Urteile, Regeln) zu aktualisieren (neue Chunks hinzufügen, alte modifizieren/entfernen und neu embedden).

---

### Stufe 1: Inkrementelle KI-basierte Strukturierung und Markdown-Konvertierung

**Ziel:** Den gesamten Vertragstext in ein standardisiertes Markdown-Dokument überführen und parallel alle identifizierten Strukturelemente als detaillierte JSON-Objekte erfassen, wobei der Vertrag abschnittsweise verarbeitet wird. Das Ziel ist eine einheitliche Markdown-Struktur über alle Verträge hinweg.

1.  **Vorbereitung: Intelligentes Vor-Chunking des Rohtextes**
    *   Der aus der Datei extrahierte, unformatierte Gesamttext (`extractedText`) wird serverseitig in "Vor-Chunks" aufgeteilt.
    *   **Regel:** Die Aufteilung erfolgt primär an Absatzenden (erkennbar z.B. an doppelten Zeilenumbrüchen oder semantisch zusammenhängenden Blöcken). Die Zielgröße pro Chunk liegt bei ca. 2500 Wörtern, aber die Integrität von Absätzen/Klauseln hat Vorrang. Ein Chunk muss immer an einem Absatzende enden und darf Absätze nicht intern aufteilen.

2.  **Convex Action: `structureContractIncrementallyAndCreateJsonElements`**
    *   **KI-Modell:** **Gemini 2.0 Flash** (z.B. `gemini-1.5-flash-latest`) - Ausreichend für die Strukturierungsaufgabe und schneller/kostengünstiger als Pro.
    *   **Input:** `contractId`. Die Action holt sich den `extractedText` und die `preChunks`.
    *   **Prozess:**
        *   Iteriert sequenziell durch jeden "Vor-Chunk".
        *   Für jeden Vor-Chunk wird der **KI-Agent 1 (Strukturierungs-Agent für Vor-Chunks)** aufgerufen.
            *   **System-Prompt für KI-Agent 1:**
                ```
                Du bist ein KI-Assistent, spezialisiert auf die Analyse und Strukturierung von deutschsprachigen Bauverträgen. Deine Aufgabe ist es, den folgenden TEXTABSCHNITT eines Vertrags in ein **standardisiertes, gut strukturiertes Markdown-Format** zu überführen und die darin enthaltenen Strukturelemente präzise als eine Liste von JSON-Objekten zu identifizieren. Ziel ist eine **einheitliche Struktur** über alle Verträge hinweg.

                ANWEISUNGEN ZUR STRUKTURIERUNG UND MARKDOWN-FORMATIERUNG INNERHALB DIESES TEXTABSCHNITTS:

                1.  **VERTRAGSTITEL (Nur relevant, wenn dieser Textabschnitt den absoluten Anfang des gesamten Dokuments darstellt):** Falls dieser Textabschnitt den Haupttitel des Vertrags enthält (z.B. "Werkvertrag", "Allgemeine Einkaufsbedingungen für Bauleistungen"), identifiziere diesen und formatiere ihn als H1: `# Titeltext`.
                2.  **HAUPTABSCHNITTE/PARAGRAPHEN:** Identifiziere thematische Hauptabschnitte oder Paragraphenüberschriften (z.B. "1. Vertragsgegenstand", "§ 3 Zahlungsbedingungen", "Allgemeine Pflichten"). Formatiere diese **einheitlich** als H2 mit Paragraphenzeichen und Nummerierung (falls vorhanden, sonst generiere fortlaufend), gefolgt vom Titel: `## § N Abschnittstitel`. Beispiel: `## § 1 Vertragsgrundlagen`, `## § 2 Leistungsumfang`.
                3.  **UNTERPUNKTE/KLAUSELN:** Identifiziere einzelne Klauseln oder nummerierte/buchstabierte Unterpunkte innerhalb der Hauptabschnitte (z.B. "1.1", "1.2.a)", "Spiegelstrich-Aufzählungspunkt, der eine Regelung enthält"). Formatiere diese **einheitlich** als H3 mit Paragraphenzeichen und Nummerierung (z.B. `§ N.M`), gefolgt vom Klauseltext. Beispiel: `### § 1.1 Geltung der VOB/B
Der Text der Klausel...`, `### § 1.2 Änderungen
Der Text der Klausel...`. Auch Listenpunkte, die materielle Regelungen enthalten, sind als Klauseln (H3) zu formatieren.
                4.  **REINER TEXT/ABSCHNITTE OHNE EXPLIZITE STRUKTUR:** Erfasse auch Blöcke von Fließtext, die relevanten Inhalt tragen, aber keiner expliziten Überschrift oder Nummerierung direkt zugeordnet sind (z.B. einleitende Sätze zu einem Hauptabschnitt, Erläuterungen zwischen Klauseln). Diese sollen als einfacher Markdown-Absatz formatiert werden.

                ANWEISUNGEN ZUR JSON-AUSGABE FÜR DIESEN TEXTABSCHNITT:

                Gib für JEDES identifizierte Strukturelement (auch für reine Textabsätze) ein JSON-Objekt zurück. Alle JSON-Objekte dieses Textabschnitts müssen in einem JSON-Array zusammengefasst werden. Jedes JSON-Objekt MUSS folgende Felder haben:

                *   `elementType` (string): Klassifiziere das Element. Gültige Werte sind:
                    *   "titleH1": Für den Haupttitel des gesamten Vertrags.
                    *   "sectionH2": Für Hauptabschnittsüberschriften (`## § N ...`).
                    *   "clauseH3": Für Unterpunkte/Klauseln (`### § N.M ...`) oder materielle Regelungen in Listen.
                    *   "paragraph": Für Textblöcke ohne eigene explizite Strukturierung/Nummerierung.
                *   `elementId` (string): Wird **NACH** deiner Antwort programmatisch generiert (z.B. 'h1_c0_e0', 'sH2_c0_e1', 'cH3_c0_e2', 'p_c0_e3'). Du musst dieses Feld **NICHT** in deiner JSON-Antwort liefern.
                *   `markdownContent` (string): Der vollständige Inhalt dieses spezifischen Elements, **formatiert im standardisierten Markdown** gemäß den obigen Anweisungen (z.B. `# Titel`, `## § 1 Abschnitt`, `### § 1.1 Klausel
Text...`, `Absatztext...`).
                *   `originalOrderInChunk` (number): Eine fortlaufende Nummer (beginnend bei 0 für jedes neue JSON-Array eines Vor-Chunks), die die ursprüngliche Reihenfolge der Elemente *innerhalb dieses spezifischen Vor-Chunks* angibt.

                WICHTIG: Erhalte die exakte Reihenfolge der Inhalte, wie sie im ursprünglichen Textabschnitt vorgefunden wurden. Zerlege den Textabschnitt vollständig in diese Strukturelemente. Stelle sicher, dass der Output ein valides JSON-Array ist.

                Beispiel für die JSON-Ausgabe eines Textabschnitts (Array von Objekten, **ohne** `elementId`):
                ```json
                [
                  {
                    "elementType": "sectionH2",
                    "markdownContent": "## § 1 Vertragsgrundlagen\n\nGrundlage dieses Vertrages sind die nachfolgend genannten Unterlagen in der angegebenen Reihenfolge:\n- Das Angebot des Auftragnehmers vom TT.MM.JJJJ\n- Die Leistungsbeschreibung Version X",
                    "originalOrderInChunk": 0
                  },
                  {
                    "elementType": "clauseH3",
                    "markdownContent": "### § 1.1 Geltung der VOB/B\nEs gilt die VOB/B in der zum Zeitpunkt des Vertragsschlusses gültigen Fassung, soweit nachfolgend nichts anderes vereinbart ist.",
                    "originalOrderInChunk": 1
                  },
                  {
                    "elementType": "paragraph",
                    "markdownContent": "Dieser Text steht zwischen zwei Klauseln und hat keine eigene Überschrift. Er gehört aber inhaltlich zum übergeordneten Abschnitt.",
                    "originalOrderInChunk": 2
                  }
                ]
                ```
                --- TEXTABSCHNITT (AUS VOR-CHUNK) ---
                {VOR_CHUNK_TEXT_HIER_EINFÜGEN}
                --- ENDE TEXTABSCHNITT ---
                ```
        *   Die Action aggregiert die JSON-Arrays aller Vor-Chunks zu einer `finalStructuredElementsList` (inkl. **Generierung der eindeutigen `elementId`** und Zuweisung der globalen `originalOrder`) und den `markdownContent` zu einem `finalFullMarkdownText`.
    *   **Speicherung:**
        *   `contract.fullMarkdownText` = `finalFullMarkdownText`.
        *   `contract.structuredContractElements` = `finalStructuredElementsList`.
        *   Statusupdate des Vertrags (z.B. "structure_generation_completed").

---

### Stufe 2: Intelligentes, strukturbasiertes "Analyse-Chunking" und SEQUENZIELLE Analyse

**Ziel:** Die `structuredContractElements`-Liste in logische "Analyse-Chunks" aufteilen und diese **direkt danach sequenziell** analysieren, um Parallelitätsprobleme zu vermeiden.

1.  **Serverseitige Funktion/Action: `createAnalysisChunksFromStructuredElements` (erweitert)**
    *   **Input:** Die Liste `structuredContractElements` (aus Stufe 1).
    *   **Logik (Chunking):** Gruppiert Elemente zu "Analyse-Chunks" basierend auf `elementType` und maximaler Größe, wie bisher.
    *   **Logik (Sequenzielle Analyse - NEU):**
        *   Nach der Erstellung der `analysisChunks`-Liste wird **kein Scheduler** mehr verwendet.
        *   Stattdessen iteriert die **dieselbe Action** `createAnalysisChunksFromStructuredElements` nun **sequenziell** durch jeden erstellten `analysisChunk`.
        *   Für jeden Chunk wird die Analyse-Logik (entsprechend der bisherigen Stufe 3) direkt **innerhalb dieser Action** ausgeführt.
        *   Der Vertragsstatus wird auf `analysis_inprogress` gesetzt und der Fortschritt (`processedChunks`) nach jedem abgeschlossenen Chunk aktualisiert.
    *   **Output:** Die Action läuft, bis alle Chunks sequenziell analysiert wurden, und setzt dann den finalen Status (`completed` oder `failed`).

---

### Stufe 3: Kontextualisierte Klauselanalyse mit Vektor-KB-Retrieval (RAG) - Logik jetzt in Stufe 2 integriert

**Ziel:** Jede relevante Klausel präzise bewerten, unter Zuhilfenahme der dynamisch abgerufenen relevantesten Informationen aus der Vektor-Knowledge-Base. **(Diese Logik wird nun sequenziell innerhalb der erweiterten Action aus Stufe 2 ausgeführt).**

1.  **Analyse-Logik (pro Chunk, ausgeführt in der Schleife von Stufe 2):**
    *   **KI-Modell:** Weiterhin **Gemini 2.5 Pro** empfohlen (oder Flash als Testoption).
    *   **Input:** Ein "Analyse-Chunk" (aus der Liste, die in Stufe 2 erstellt wurde).
    *   **Prozessschritte (innerhalb der Schleife für den aktuellen Chunk):**
        1.  Initialisiere eine Liste für die Analyseergebnisse dieses Chunks.
        2.  Iteriere durch jedes `structuredContractElement`-Objekt im aktuellen Analyse-Chunk.
        3.  **Wenn das Element ein Kandidat für die Analyse ist** (primär `elementType: "clauseH3"`, oder `elementType: "paragraph"` das als materiell-rechtliche Klausel interpretiert werden soll):
            *   Extrahiere den `markdownContent` dieses Elements (die zu analysierende Klausel/Text).
            *   Generiere ein Text-Embedding für diesen `markdownContent`.
            *   Führe eine Vektorsuche in der Convex-Tabelle `knowledgeChunks` durch, unter Verwendung des Indexes `embedding` und dem Klausel-Embedding. Rufe die Top-K (z.B. `limit: 5` oder `limit: 7`) semantisch ähnlichsten Wissens-Chunks ab.
            *   Formatiere die Textinhalte (`textContent`) der abgerufenen Wissens-Chunks zu einem einzelnen String (`retrievedKnowledgeContext`), z.B. durch Aneinanderreihung mit einer kleinen Überschrift pro Wissens-Chunk.
            *   Rufe **KI-Agent 2 (Klauselanalyse-Agent)** mit dem aktuellen `markdownContent` der Klausel und dem `retrievedKnowledgeContext` auf.
                *   **System-Prompt für KI-Agent 2:**
                    ```
                    Du bist ein spezialisierter KI-Assistent für die automatisierte Prüfung von deutschsprachigen Bauverträgen und Allgemeinen Geschäftsbedingungen (AGBs), insbesondere im Kontext des deutschen und österreichischen Baurechts (BGB, VOB, ÖNORM). Deine Hauptaufgabe ist es, die dir vorgelegten Vertragsklauseln schnell zu analysieren, Risiken zu identifizieren und Compliance für den Bauunternehmer sicherzustellen. Der dir vorliegende Vertragsabschnitt besteht aus einer Sequenz von Strukturelementen (Überschriften, Klauseln, Absätze) im Markdown-Format.

                    BEWERTE VERTRAGSKLAUSELN STRENG NACH DEM FOLGENDEN AMPELSYSTEM SOWIE DEN **DIR ALS KONTEXT ZUR VERFÜGUNG GESTELLTEN RELEVANTEN AUSZÜGEN AUS UNSERER WISSENSDATENBANK (REGELN, GESETZE, RECHTSPRECHUNG)**:

                    AMPELSYSTEM KURZÜBERSICHT:
                    - ROT (nicht akzeptabel):
                      - Pay-When-Paid Klauseln (Zahlungen abhängig von Zahlung des Bauherrn)
                      - Vollständige Übertragung gewerblicher Schutzrechte (anstelle von Nutzungsrechten)
                      - Vertragsstrafen ohne Begrenzung (max. akzeptabel: 5% der Auftragssumme)
                      - Back-to-Back Vertragsübernahme (vollständige Einbeziehung der Pflichten/Haftung aus Bauherrnvertrag)
                      - Bietergarantie (Bid-Bond) Forderungen
                      - Fehlendes fixes Bauende im Vertrag
                      - Verschuldensunabhängige Pönale/Schadenersatz-Klauseln
                      - Erfüllungsgarantien ohne Einschränkung
                    - GELB (verhandelbar):
                      - Gestörter Bauablauf (Ausschluss von Bauzeitverlängerung/Mehrkosten)
                      - Ausschluss der ÖNORM B 2110
                      - Vertragserfüllungsbürgschaft über 10%
                      - Konzern- oder projektübergreifende Haftung
                      - Persönliche Haftung über gesetzlichen Rahmen hinaus
                      - Ausschluss von Sub-Sub-Vergabe
                      - Mängelregelung außerhalb der ÖNORM
                    - GRÜN (akzeptabel):
                      - Klauseln, die keine der oben genannten Probleme aufweisen
                      - Vertragsstrafen mit klarer Begrenzung auf max. 5% der Auftragssumme
                      - Gewährung von Nutzungsrechten statt Übertragung von Schutzrechten
                      - Klare Abnahmeregelungen gemäß ÖNORM B 2110

                    ANWEISUNGEN ZUR ANALYSE DER VORGELEGTEN STRUKTURELEMENTE:

                    1.  **Fokus auf Elemente vom Typ `clauseH3`:** Deine primäre Aufgabe ist die Analyse und Bewertung der Vertragselemente, die eine `elementId` haben, die mit `###` beginnt (d.h. `elementType: "clauseH3"`). Dies sind die eigentlichen Klauseln.
                    2.  **Behandlung von `paragraph`-Elementen:** Untersuche auch Elemente vom Typ `paragraph`. Wenn ein `paragraph` eine eigenständige materiell-rechtliche Regelung oder Verpflichtung enthält, die wie eine Klausel zu behandeln ist, analysiere und bewerte diesen ebenfalls. Ansonsten dient er als Kontext.
                    3.  **Kontextnutzung:** Strukturelemente im Analyse-Chunk, die `elementId`s haben, die mit `#` (Titel) oder `##` (Hauptabschnitt) beginnen, oder reine `paragraph`-Elemente ohne eigene Regelung, dienen als wichtiger Kontext für die Analyse der `clauseH3`-Elemente. Diese Kontextelemente selbst sollen NICHT einzeln bewertet und im JSON-Output aufgeführt werden, es sei denn, sie erfüllen die Bedingung aus Punkt 2.
                    4.  **JSON-Ausgabe pro Analyse-Chunk:** Gib deine Analyse als valides JSON-Array zurück. Jedes Objekt im Array repräsentiert EIN analysiertes `clauseH3`-Element (oder einen als Klausel interpretierten `paragraph`) und MUSS folgende Felder haben:
                        *   `analyzedElementId` (string): Das `elementId` des Strukturelements, das analysiert wurde (z.B. "### 1.1 Geltung der VOB/B" oder "paragraph_chunkX_elemY" falls ein Paragraph bewertet wurde).
                        *   `evaluation` (string): Deine Bewertung gemäß dem Ampelsystem ("Rot", "Gelb", "Grün"). Wenn ein Element zwar als Klausel identifiziert, aber inhaltlich nicht bewertbar ist (z.B. reiner Verweis ohne materielle Regelung), verwende "Info".
                        *   `reason` (string): Eine detaillierte und präzise Begründung für deine `evaluation`, basierend auf den dir bereitgestellten relevanten Auszügen aus der Wissensdatenbank.
                        *   `recommendation` (string): Eine konkrete und umsetzbare Handlungsempfehlung für den Bauunternehmer.
                    5.  **Vollständigkeit:** Stelle sicher, dass du ALLE als bewertbar identifizierten Elemente (`clauseH3` und relevante `paragraph`) innerhalb des vorgelegten Analyse-Chunks bearbeitest.

                    Beispiel für ein JSON-Objekt im Ergebnis-Array:
                    {
                      "analyzedElementId": "### 1.1 Geltung der VOB/B",
                      "evaluation": "Grün",
                      "reason": "Die Einbeziehung der VOB/B in der gültigen Fassung ist Standard und stellt eine ausgewogene Grundlage dar, sofern keine nachteiligen Abweichungen in anderen Klauseln erfolgen. Dies wird durch die relevanten Auszüge aus der Wissensdatenbank gestützt.",
                      "recommendation": "Keine unmittelbare Änderung erforderlich. Im Gesamtkontext prüfen, ob andere Klauseln der VOB/B widersprechen."
                    }

                    --- ZU ANALYSIERENDES VERTRAGSELEMENT (MARKDOWN) ---
                    {MARKDOWN_CONTENT DES AKTUELLEN ELEMENTS HIER EINFÜGEN}
                    --- ENDE ZU ANALYSIERENDES VERTRAGSELEMENT ---

                    --- RELEVANTE AUSZÜGE AUS DER WISSENSDATENBANK ---
                    {HIER DEN `retrievedKnowledgeContext` EINFÜGEN}
                    --- ENDE RELEVANTE AUSZÜGE ---
                    ```
            *   Füge das Ergebnis (oder die Ergebnisse, falls der KI-Agent mehrere Klauseln im Chunk findet und bewertet, obwohl idealerweise der Input auf ein Hauptelement fokussiert ist) der Ergebnisliste für diesen Chunk hinzu.
    *   **Output (pro Chunk):** Internes Ergebnis (Erfolg/Misserfolg), das zur Fortschrittsverfolgung und finalen Statusentscheidung in Stufe 2 verwendet wird.
2.  **Aggregation und Speicherung:** Analyseergebnisse werden weiterhin gesammelt und über die Mutation `mergeAnalysisResult` in die `structuredContractElements`-Liste gemerged. Der finale Status (`completed`/`failed`) wird am Ende der sequenziellen Schleife in Stufe 2 gesetzt.

---

### Stufe 4: Angepasste Frontend-Darstellung und Interaktion

**Ziel:** Den strukturierten Vertrag und seine Analyse benutzerfreundlich darstellen, Kachel-Logik beibehalten, präzise KI-Interaktion ermöglichen.

1.  **Datenladung in `ContractDetail.tsx`:** Lädt `contract.structuredContractElements`.
2.  **Rendering als Kacheln:** Iteriert durch `structuredContractElements` (nach `globalOriginalOrder`).
    *   Jedes Element wird als Kachel gerendert, `markdownContent` mit `react-markdown`.
    *   Elemente mit Analyseergebnissen zeigen darunter die ausklappbare Detailkarte mit `evaluation`, `reason`, `recommendation` und dem Eingabefeld "Benutzerdefinierte Formulierung".
3.  **Interaktion mit KI-Funktionen in der Detailkarte:**

    *   **Automatisches Ausklappen der Detailkarte:**
        *   Triggert **automatisch** die Backend-Action `generateAlternativeFormulations`.
            *   **KI-Modell:** **Gemini 2.5 Flash** (für schnelle Antwort).
            *   **Input:** Der `markdownContent` der aktuellen Klausel.
            *   **System-Prompt für `generateAlternativeFormulations`:**
                ```
                Du bist ein spezialisierter Rechtsexperte für Bauverträge nach deutschem und österreichischem Recht (BGB, VOB, ÖNORM). Deine Aufgabe ist es, für die folgende Vertragsklausel (im Markdown-Format) GENAU DREI unterschiedliche alternative Formulierungen im Markdown-Format zu entwickeln. Die drei Alternativen sollten sich deutlich voneinander unterscheiden und unterschiedliche Aspekte oder Lösungsansätze adressieren (z.B. eine konservative, eine ausgewogene, eine für den Bauunternehmer optimierte Variante).

                **WICHTIG: Achte darauf, dass die Länge jeder generierten Alternative ungefähr der Länge der ursprünglichen Klausel entspricht. Formuliere prägnant und vermeide unnötige Ausführungen, es sei denn, die ursprüngliche Klausel war bereits sehr detailliert.**

                Jede Alternative muss als vollständiger Markdown-Block zurückgegeben werden, inklusive der ursprünglichen Klauselüberschrift/-nummerierung, ergänzt um einen Alternativ-Indikator.

                Beispiel für Input-Klausel-Markdown:
                `### 2.3 Haftungsbegrenzung\nDer Auftragnehmer haftet nur für Vorsatz und grobe Fahrlässigkeit.`

                Beispiel für Output (JSON-Array mit drei Markdown-Strings):
                ```json
                [
                  "### 2.3 Haftungsbegrenzung (Alternative A - Konservativ)\nDer Auftragnehmer haftet für Vorsatz und grobe Fahrlässigkeit. Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit es sich nicht um die Verletzung von Kardinalpflichten handelt.",
                  "### 2.3 Haftungsbegrenzung (Alternative B - Ausgewogen)\nDie Haftung des Auftragnehmers für leicht fahrlässig verursachte Schäden wird auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit haftet der Auftragnehmer unbeschränkt.",
                  "### 2.3 Haftungsbegrenzung (Alternative C - Optimiert für AN)\nDer Auftragnehmer haftet ausschließlich für Schäden, die auf vorsätzlichem oder grob fahrlässigem Verhalten seiner gesetzlichen Vertreter oder leitenden Angestellten beruhen. Jegliche weitergehende Haftung, insbesondere für leichte Fahrlässigkeit oder Erfüllungsgehilfen, ist ausgeschlossen, soweit gesetzlich zulässig."
                ]
                ```

                Gib als Ergebnis NUR ein valides JSON-Array mit GENAU DREI Strings zurück. Jeder String ist eine vollständige alternative Klausel im Markdown-Format.
                --- URSPRÜNGLICHE KLAUSEL (MARKDOWN) ---
                {MARKDOWN_CONTENT_DER_KLAUSEL_HIER_EINFÜGEN}
                --- ENDE URSPRÜNGLICHE KLAUSEL ---
                
            *   **Output:** Array von drei Markdown-Strings (Alternativen).
        *   Die drei Markdown-Alternativen werden in der Detailkarte zur Auswahl angeboten.

    *   **Benutzer wählt eine generierte Markdown-Alternative aus:**
        *   Der `markdownContent` des `structuredContractElements`-Objekts (im Frontend-State) wird durch die gewählte Alternative ersetzt.
        *   Der reine Textanteil der neuen Alternative aktualisiert das Feld "Benutzerdefinierte Formulierung".

    *   **Benutzer klickt "Mit KI optimieren" (bezogen auf das Feld "Benutzerdefinierte Formulierung"):**
        *   Triggert die Backend-Action `optimizeClauseWithAI`.
            *   **KI-Modell:** **Gemini 2.5 Flash** (für schnelle Antwort).
            *   **Input:** Der reine Text aus dem Eingabefeld.
            *   **System-Prompt für `optimizeClauseWithAI`:**
                ```
                Du bist ein KI-Assistent, spezialisiert auf die sprachliche und juristische Optimierung von Vertragsklausel-Entwürfen für Bauunternehmer. Optimiere den folgenden Text hinsichtlich Rechtschreibung, Grammatik, Klarheit und juristischer Präzision. Der Kerninhalt und die ungefähre Länge des vom Benutzer eingegebenen Textes sollen dabei erhalten bleiben.

                **Konzentriere dich auf Verbesserungen und Korrekturen, ohne den Sinn oder die wesentliche Aussage des ursprünglichen Textes stark zu verändern oder ihn signifikant zu verlängern oder zu verkürzen. Vermeide es, komplett neue inhaltliche Aspekte einzuführen, es sei denn, dies ist zur Klarstellung einer offensichtlichen Lücke im Sinne des Nutzers zwingend erforderlich.**

                Gib als Ergebnis NUR den optimierten Text als einzelnen String zurück.
                --- VOM BENUTZER EINZUGEBENER TEXT ---
                {REINER_TEXT_AUS_EINGABEFELD_HIER_EINFÜGEN}
                --- ENDE BENUTZERTEXT ---
                ```
            *   **Output:** Einzelner String (optimierter reiner Text).
        *   Der optimierte reine Text wird ins Eingabefeld "Benutzerdefinierte Formulierung" zurückgeschrieben.
        *   Zur Persistierung: Der neue reine Text wird mit der `elementId` (Überschrift) des Elements kombiniert, um den `markdownContent` des `structuredContractElements`-Objekts zu aktualisieren.

---

### Stufe 5: Export des (modifizierten) Vertrags

**Ziel:** Vollständiger, formatierter Export des Vertrags inklusive aller Benutzeränderungen.

1.  **Export-Logik:**
    *   Greift auf die aktuelle Liste der `structuredContractElements` im Frontend-Zustand zu.
    *   Konkateniert die `markdownContent`-Felder aller Elemente (in `globalOriginalOrder`) zu einem finalen Markdown-String.
    *   Dieser Markdown-String wird in PDF (oder andere Formate) konvertiert.

### Technische Aspekte und Datenbankanpassungen:

*   **Datenbankschema (`convex/schema.ts`):**
    *   `contracts` Tabelle:
        *   `fullMarkdownText: v.optional(v.string())`
        *   `structuredContractElements: v.optional(v.array(v.object({ elementType: v.string(), elementId: v.string(), markdownContent: v.string(), globalOriginalOrder: v.number(), evaluation: v.optional(v.string()), reason: v.optional(v.string()), recommendation: v.optional(v.string()) })))`
    *   `knowledgeChunks` Tabelle (NEU):
        *   `textContent: v.string()`
        *   `embedding: v.array(v.float64())` (mit Vektor-Index `embedding` für das Feld `embedding`)
        *   `metadata: v.object({ source: v.optional(v.string()), type: v.optional(v.string()), keywords: v.optional(v.array(v.string())), last_updated: v.optional(v.string()) })`
*   **Convex Actions/Mutations:** Implementierung von `structureContractIncrementallyAndCreateJsonElements`, Anpassung/Neuerstellung von `analyzeContractChunkWithStructureAndVectorKB`, Überarbeitung der Orchestrierung in `startFullContractAnalysis`, und Mutationen zum Speichern von Benutzeränderungen an `structuredContractElements`. Erstellung von Funktionen zum Befüllen und Verwalten der `knowledgeChunks`.
*   **Frontend:** Nutzung von `react-markdown` für die Darstellung.

Dieser umfassende Plan stellt eine signifikante Weiterentwicklung dar und sollte die Funktionalität und Zuverlässigkeit der Vertragsanalyse erheblich verbessern.

## **Zusatz: KI Modelle und Limitierungen**

**1. KI-Modelle und Maßnahmen zur Einhaltung von API-Limits:**

Sie hatten sich entschieden, vorerst primär das Modell **Gemini Flash** (oder eine spezifische Version wie "Gemini 2.0 Flash", wie Sie erwähnten) für die KI-Funktionen zu verwenden. Dies ist eine gute Wahl für Aufgaben, bei denen schnelle Antworten wichtig sind, wie z.B. das Generieren von alternativen Formulierungen oder das Optimieren von Texten, wie es auch im Gesamtplan für einige Funktionen bereits vorgesehen war (z.B. `generateAlternativeFormulations` und `optimizeClauseWithAI` in Stufe 4).

Der ursprüngliche Gesamtplan schlägt zwar für komplexere Aufgaben wie die initiale Strukturierung (Stufe 1, KI-Agent 1) und die detaillierte Klauselanalyse mit Wissensdatenbank-Anbindung (Stufe 3, KI-Agent 2) das leistungsfähigere Modell Gemini 2.5 Pro vor. Wenn wir vorerst durchgängig bei Gemini Flash bleiben, müssen wir uns dessen bewusst sein und gegebenenfalls:
*   Die Komplexität der System-Prompts für diese anspruchsvolleren Aufgaben anpassen.
*   Die Aufgaben möglicherweise noch granularer zerlegen, um die Fähigkeiten von Flash optimal zu nutzen und die Qualität der Ergebnisse sicherzustellen.

**Maßnahmen zur Einhaltung von API-Limits (allgemeine Strategien):**

Um Probleme mit den API-Limits (insbesondere bei kostenlosen oder Test-Kontingenten) zu vermeiden, hatten wir über Konzepte gesprochen. Hier sind typische Strategien, die implementiert werden können:

*   **Client-seitiges Rate Limiting:** Einbau von programmatischen Verzögerungen zwischen aufeinanderfolgenden API-Aufrufen, um die Anzahl der Anfragen pro Zeiteinheit zu steuern.
*   **Exponentielles Backoff bei Fehlern:** Wenn ein API-Limit erreicht wird (oft signalisiert durch einen HTTP-Fehlercode wie `429 Too Many Requests`), wiederholt das System den fehlgeschlagenen Aufruf nicht sofort, sondern nach einer Wartezeit. Diese Wartezeit wird bei jedem weiteren fehlgeschlagenen Versuch exponentiell erhöht (z.B. 1s, 2s, 4s, 8s Pause). Dies verhindert eine Überlastung der API und gibt ihr Zeit, sich zu erholen. Das ist wahrscheinlich das "Retry-Schleifen"-Konzept, an das Sie sich erinnern.
*   **Serverseitige Queues und Worker:** Anstatt API-Aufrufe direkt aus dem Frontend oder synchron im Backend zu tätigen, können Anfragen in eine Warteschlange gestellt und von einem oder mehreren Worker-Prozessen abgearbeitet werden. Diese Worker können dann die oben genannten Rate-Limiting- und Backoff-Strategien anwenden.
*   **Batching von Anfragen (wo sinnvoll):** Obwohl nicht immer anwendbar, könnten mehrere kleine, unabhängige Aufgaben in einem einzigen API-Aufruf zusammengefasst werden, falls die API dies unterstützt und es zur Aufgabe passt. Bei der sequenziellen Analyse von Vertragsklauseln ist dies oft schwieriger.
*   **Caching von Ergebnissen:** Wenn identische Klauseln oder Anfragen mehrfach analysiert werden müssten, können die Ergebnisse zwischengespeichert werden, um wiederholte API-Aufrufe zu vermeiden.
*   **Priorisierung und selektive Verarbeitung:** Bei sehr vielen Klauseln könnte man überlegen, ob eine Priorisierung stattfindet oder ob der Nutzer auswählen kann, welche Teile intensiv analysiert werden.
*   **Monitoring und Logging:** Die API-Nutzung sollte überwacht werden, um frühzeitig zu erkennen, wenn man sich Limits nähert und um die Effektivität der implementierten Maßnahmen zu bewerten.

Diese Mechanismen müssen in der Backend-Logik (z.B. in Ihren Convex Actions) implementiert werden, die die externen KI-Modelle aufrufen.

**2. Umsetzungsstand des Gesamtplans und Abweichungen:**

Der "Gesamtplan zur Optimierung der KI-Vertragsanalyse" ist sehr umfassend. Unsere bisherige Arbeit hat sich primär auf Aspekte der **Stufe 4: Angepasste Frontend-Darstellung und Interaktion** konzentriert, genauer gesagt auf die UI-Logik für die Darstellung der Vertragsklauseln als Kacheln (`ContractSection`) und die Interaktion mit der Detail-Karte, die Analyseergebnisse und KI-Funktionen enthalten soll.

**Was wurde im Kontext von Stufe 4 adressiert/geplant:**

*   **Kachel-Darstellung:** Wir haben intensiv an der Komponente `ContractSection` gearbeitet, um zu definieren, wie einzelne Vertragselemente (Klauseln, Überschriften) dargestellt werden.
*   **Detail-Karte:** Ein großer Teil unserer Arbeit betraf die Logik, wie und wann eine Detail-Karte (ursprünglich mit "Alternativen", "Begründung", "Empfehlung" etc.) unterhalb einer Kachel erscheint und wie deren Sichtbarkeit gesteuert wird. Die genauen Inhalte und die Anbindung an die Backend-KI-Funktionen sind aber noch nicht implementiert.
*   **Interaktionslogik:** Wir haben viel Zeit darauf verwendet, das Ein- und Ausklappverhalten der Kacheln selbst und der Detail-Karte zu verfeinern, inklusive der Steuerung über Buttons. Die *finale* besprochene Logik sieht vor, dass die Kachel selbst NICHT mehr ein-/ausklappbar ist, sondern ein Button in der Kachel eine separate Detail-Karte darunter steuert.

**Was aus dem Gesamtplan wurde bisher NICHT umgesetzt oder im Detail besprochen:**

*   **Stufe 0: Vorbereitung und Befüllung der Vektor-Knowledge-Base (Convex):**
    *   Die Erstellung der `knowledgeChunks`-Tabelle in Convex.
    *   Das Aufbereiten, Embedden und Speichern von Wissens-Chunks.
    *   Die Definition des Vektor-Indexes.
*   **Stufe 1: Inkrementelle KI-basierte Strukturierung und Markdown-Konvertierung:**
    *   Die Convex Action `structureContractIncrementallyAndCreateJsonElements`.
    *   Die Implementierung des KI-Agenten 1 für die Strukturierung.
    *   Das Speichern von `fullMarkdownText` und `structuredContractElements` in der Datenbank.
*   **Stufe 2: Intelligentes, strukturbasiertes "Analyse-Chunking" und SEQUENZIELLE Analyse:**
    *   Die serverseitige Funktion `createAnalysisChunksFromStructuredElements`.
*   **Stufe 3: Kontextualisierte Klauselanalyse mit Vektor-KB-Retrieval (RAG):**
    *   Die Convex Action `analyzeContractChunkWithStructureAndVectorKB`.
    *   Die Implementierung des KI-Agenten 2 für die Klauselanalyse.
    *   Die dynamische Vektorsuche und Einbindung von `retrievedKnowledgeContext` in den Prompt.
    *   Das Mergen der Analyseergebnisse (`evaluation`, `reason`, `recommendation`) in die `structuredContractElements`.
*   **Stufe 4 (Backend-Logik der KI-Funktionen):**
    *   Die konkrete Implementierung der Backend-Actions `generateAlternativeFormulations` und `optimizeClauseWithAI` (inklusive der Prompts und API-Aufrufe an Gemini Flash).
    *   Die Anbindung dieser Actions an die Frontend-Buttons in der Detail-Karte.
*   **Stufe 5: Export des (modifizierten) Vertrags:**
    *   Die Logik zum Konkatenieren der `markdownContent`-Felder und die Konvertierung in exportierbare Formate.

**Abweichungen vom ursprünglichen Plan:**

1.  **Fokus auf UI vor Backend:** Die größte "Abweichung" vom sequenziellen Abarbeiten des Plans ist, dass wir uns sehr detailliert mit der UI-Interaktion (Teil von Stufe 4) beschäftigt haben, bevor die grundlegenden Datenverarbeitungs- und Analyse-Stufen (0-3) sowie die eigentlichen KI-Funktionen im Backend implementiert wurden. Das ist ein üblicher iterativer Prozess, aber es bedeutet, dass der Kern der im Plan beschriebenen Funktionalität noch aussteht.
2.  **KI-Modellwahl:** Ihre Präferenz, vorrangig mit Gemini Flash zu starten, weicht von der ursprünglichen Empfehlung ab, Gemini 2.5 Pro für die komplexeren Analyseaufgaben zu nutzen. Wie oben erwähnt, erfordert dies möglicherweise Anpassungen.
3.  **UI-Detailänderungen:** Die genaue Funktionsweise und das Aussehen der Kacheln und der Detail-Karte haben sich im Laufe unserer Diskussionen mehrfach geändert. Der finale Stand (Kachel nicht klappbar, Button steuert separate Detail-Karte) ist das Ergebnis dieser Iterationen und eine Präzisierung gegenüber dem ursprünglichen Plan, der die UI-Struktur zwar beibehalten, aber nicht so detailliert vorgeschrieben hat.

Zusammenfassend lässt sich sagen, dass wir wichtige Vorarbeiten für die Benutzeroberfläche geleistet haben, die es dem Nutzer ermöglichen wird, mit den Ergebnissen der Vertragsanalyse zu interagieren. Die nächsten großen Schritte wären die Implementierung der Backend-Logik gemäß Stufen 0-3 und die Anbindung der in Stufe 4 beschriebenen KI-Funktionen unter Berücksichtigung Ihrer Modellwahl und der besprochenen API-Limit-Strategien.
