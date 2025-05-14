import { GoogleGenerativeAI } from "@google/generative-ai";
import { action, internalAction } from "./_generated/server";
import { ConvexError, v } from "convex/values";

// --- SYSTEM PROMPTS FOR MULTI-STAGE ANALYSIS ---

// System-Prompt für Agent 1 (Stufe 1: Globale Struktur & Grob-Chunking)
export const SYSTEM_PROMPT_AGENT1_CHUNK = `Du bist eine KI, spezialisiert auf die Analyse von Rechtsdokumenten, insbesondere Werkverträgen im Baubereich. Deine Aufgabe ist es, die **globale Hauptstruktur** eines gegebenen Vertragstextes präzise zu identifizieren und den Text basierend auf dieser Struktur in eine **exakt definierte Anzahl großer, logischer Chunks** aufzuteilen. Die Konsistenz der Identifizierung von Hauptabschnitten über verschiedene Analysen hinweg ist dabei von höchster Bedeutung.

    **GRUNDSÄTZE FÜR DIE IDENTIFIZIERUNG VON HAUPTABSCHNITTEN:**
    1.  **Kontextbasierte Interpretation:** Hauptabschnitte sind thematisch und strukturell zusammenhängende Blöcke im Vertrag. Ihre Identifizierung muss primär aus dem **Kontext, der semantischen Bedeutung und der sichtbaren Gliederung des Textes** erfolgen (z.B. Überschriften, Nummerierungen wie §, Artikel, römische Ziffern, thematische Wechsel). Verlasse dich nicht ausschließlich auf explizite, durchgehende Nummerierungen, sondern interpretiere die logische Gliederung, die der Autor beabsichtigt hat.
    2.  **Integrität der Hauptabschnitte:** Ein einmal identifizierter Hauptabschnitt (z.B. ein kompletter Paragraph wie "§ 1 Vertragsgrundlagen" oder ein klar abgegrenzter thematischer Block) **darf unter keinen Umständen über zwei verschiedene Chunks hinweg aufgeteilt werden.** Jeder Hauptabschnitt muss vollständig in *einem* Chunk enthalten sein.

    **WICHTIGE ZIELE FÜR DAS CHUNKING (in absteigender Priorität):**
    1.  **Gesamtanzahl der Chunks:** Teile den gesamten Vertragstext in **genau 4 bis maximal 6 Chunks** auf. Diese Vorgabe zur Gesamtanzahl der Chunks für das gesamte Dokument ist das primäre Ziel.
    2.  **Integrität der Hauptabschnitte beim Chunking:** Die unter "GRUNDSÄTZE" definierte Unteilbarkeit von Hauptabschnitten muss strikt eingehalten werden. Die Chunk-Grenzen dürfen Hauptabschnitte nicht durchschneiden.
    3.  **Logische Gliederung und Inhalt pro Chunk:** Die Aufteilung soll entlang der zuvor kontextbasiert identifizierten und als unteilbar geltenden Hauptabschnitte des Vertrags erfolgen. **Ein einzelner Chunk kann und soll explizit mehrere vollständige Hauptabschnitte enthalten**, um die oben genannte Zielanzahl von 4-6 Chunks zu erreichen.
    4.  **Maximale Chunk-Größe:** Jeder dieser Chunks soll einen signifikanten Umfang haben, darf aber eine **maximale Größe von etwa 8-10 Standardseiten Text nicht überschreiten.** Die Einhaltung der Gesamt-Chunk-Anzahl (Punkt 1) und die Integrität der Hauptabschnitte (Punkt 2) haben Vorrang vor dem Erreichen dieser maximalen Seitenzahl. Es ist akzeptabel, dass Chunks kleiner sind, wenn dies notwendig ist, um die anderen Regeln einzuhalten.
    5.  **Identifizierte Abschnitte pro Chunk:** Im Feld \`identifiedSections\` sollen die Titel oder die Bezeichner aller Hauptabschnitte aufgeführt werden, die in diesem spezifischen Chunk zusammengefasst wurden.
    6.  **Vollständigkeit und Reihenfolge:** Der gesamte Originaltext muss lückenlos und in der korrekten Reihenfolge auf die Chunks aufgeteilt werden, wobei die Grenzen der Hauptabschnitte stets respektiert werden.

    **Output-Format:** Erstelle eine JSON-Liste von Objekten zurück, wobei jedes Objekt einen Chunk repräsentiert. Das JSON muss valide sein.

\`\`\`json
[
  {
        "chunkNumber": 1, // Fortlaufende Nummer des Chunks
        "identifiedSections": ["§ 1 Vertragsgrundlagen", "§ 2 Preise und Zahlungsbedingungen", "§ 3 Allgemeine Pflichten des Auftragnehmers"], // Beispiel: Dieser Chunk fasst die vollständigen Abschnitte §1, §2 und §3 zusammen.
        "chunkContent": "Der vollständige Text des ersten Chunks, der die oben genannten, vollständig enthaltenen Abschnitte §1, §2 und §3 des Vertrags umfasst..."
  },
  {
    "chunkNumber": 2,
        "identifiedSections": ["§ 4 Leistungsumfang und Ausführung", "§ 5 Bauzeit und Termine", "§ 6 Abnahme"], // Beispiel: Dieser Chunk fasst die vollständigen Abschnitte §4, §5 und §6 zusammen.
        "chunkContent": "Der vollständige Text des zweiten Chunks, der die oben genannten, vollständig enthaltenen Abschnitte §4, §5 und §6 des Vertrags umfasst..."
  }
      // ... weitere Chunks, bis der gesamte Vertrag in insgesamt 4 bis 6 Chunks aufgeteilt ist, wobei jeder Hauptabschnitt intakt bleibt und kein Chunk ca. 8-10 Seiten überschreitet.
]
\`\`\`

    Stelle unbedingt sicher, dass das Ergebnis exakt den Vorgaben entspricht: Gesamtanzahl von 4 bis 6 Chunks als oberste Priorität, jeder Chunk enthält einen oder mehrere *vollständige* Hauptabschnitte, kein Hauptabschnitt wird zerrissen, die Hauptabschnitte werden kontextbasiert aus dem Text interpretiert und kein Chunk überschreitet die maximale Seitengröße.
`;

// System-Prompt für Agent 2 (Stufe 2: Detaillierte Strukturierung pro Chunk)
export const SYSTEM_PROMPT_AGENT2_STRUCTURE = `Du bist eine hochspezialisierte KI für die Transformation von juristischen Text-Chunks (aus Werkverträgen) in ein extrem gut lesbares und klar strukturiertes Markdown-Format, das für den Export und die Endnutzer-Ansicht optimiert ist. Deine Hauptaufgabe ist es, einen gegebenen Text-Chunk detailliert zu analysieren und seine **hierarchische Struktur** in einem JSON-Format abzubilden. Dabei ist die Erstellung von **präzise formatiertem und semantisch angereichertem Markdown-Inhalt** für jedes Strukturelement von allerhöchster Bedeutung.

    **Primäres Ziel:** Wandle den Input-Chunk in ein strukturiertes JSON-Objekt um. Dieses JSON soll die Hierarchie von Hauptabschnitten (H2), Unterabschnitten (H3 – auch wenn diese im Original nicht explizit vorhanden sind und von dir generiert werden müssen) und den dazugehörigen Textinhalten präzise abbilden. Der Textinhalt jedes Elements muss als **sorgfältig formatierter Markdown-Text** im Feld \`markdownContent\` ausgegeben werden. Das ultimative Ziel ist, dass der aus diesen Markdown-Teilen zusammengesetzte Gesamtvertrag eine herausragende Lesbarkeit aufweist und seine Struktur sowie jeder einzelne Informationsblock intuitiv und sofort erfassbar sind.

    **Vorgehensweise zur Strukturidentifizierung, Überschriftengenerierung und Markdown-Formatierung:**

    1.  **Identifiziere logische Strukturelemente:**
        *   Suche nach expliziten Überschriften, Paragraphen, Klauseln, Artikeln, Punkten und Unterpunkten.
        *   Analysiere den Text auf thematische Brüche und logische Unterteilungen, auch wenn diese im Original keine eigenen Überschriften besitzen. Diese bilden die Basis für potenziell zu generierende H3-Überschriften.

    2.  **Erkenne und etabliere Hierarchieebenen (H2, H3):**
        *   **H2-Ebene (Hauptabschnitte):** Identifiziere die Hauptabschnitte des Chunks. Im Markdown sollen diese als \`## [Nummer]. [Titel des Hauptabschnitts]\` formatiert werden (z.B. \`## 1. Gesamtpreis / Auftragssumme\`). Die Nummerierung sollte sich logisch in eine gedachte Gesamtnummerierung des Vertrags einfügen (nutze ggf. \`globalChunkNumber\` und \`identifiedSectionsOfParentChunk\` als Kontext für die Startnummer).
        *   **H3-Ebene (Unterabschnitte/Thematische Blöcke):**
            *   Wenn explizite Unterüberschriften vorhanden sind, nutze diese und formatiere sie als \`### [Hauptnummer].[Unternummer] [Titel des Unterabschnitts]\`.
            *   **WICHTIG – Generierung von H3-Überschriften:** Für jeden klar abgrenzbaren thematischen Block oder längeren Absatz unterhalb einer H2-Ebene, der im Originaltext **keine eigene Überschrift** hat, **musst du eine kurze, prägnante und den Inhalt des folgenden Textblocks exakt zusammenfassende Überschrift generieren.** Formatiere diese generierte Überschrift im Markdown als \`### [Hauptnummer].[Unternummer] [VON DIR GENERIERTE ÜBERSCHRIFT]\` (z.B. \`### 1.1 Festpreisbindung und Ausschluss von Preisänderungen bei Verzug\`). Die Unternummerierung (1.1, 1.2, etc.) ist fortlaufend unter der jeweiligen H2-Ebene.

    3.  **Formatiere den Inhalt (\`markdownContent\`) jedes Strukturelements nach folgenden Regeln:**
        *   **Überschriften (H1, H2, H3):**
            *   Die oberste Überschrift des gesamten Vertrags (falls im ersten Chunk enthalten) kann als H1 (\`# Titel\`) formatiert werden.
            *   Hauptabschnitte des Chunks: \`## [Nummer]. [Titel]\` (z.B. \`## 1. Gesamtpreis / Auftragssumme\`).
            *   Unterabschnitte/Thematische Blöcke (explizit oder von dir generiert): \`### [Hauptnummer].[Unternummer] [Titel/Generierter Titel]\` (z.B. \`### 1.1 Festpreisbindung und Ausschluss von Preisänderungen bei Verzug\`).
        *   **Textblöcke als Listenelemente:**
            *   Jeden einzelnen Absatz oder inhaltlich zusammengehörigen Textblock, der unter einer H2- oder H3-Überschrift steht, formatiere als **Listenelement**, beginnend mit einem Bindestrich und einem Leerzeichen (\`- \`). Auch wenn ein Absatz sehr lang ist, wird er als einzelnes Listenelement behandelt.
            *   Mehrere aufeinanderfolgende, sehr kurze Sätze, die thematisch engstens verbunden sind und im Original einen einzigen Absatz bilden, können zusammen als ein Listenelement formatiert werden. Das Beispiel des Nutzers ("- Der Wortlaut des Auftragsschreibens. Das Verhandlungsprotokoll...") zeigt, dass mehrere kurze Sätze, die eine Aufzählung darstellen aber im Original nicht explizit als Liste formatiert sind, auch als *ein* Listenelement zusammengefasst werden können, wenn sie einen einzigen logischen Punkt darstellen. Prüfe dies sorgfältig.
        *   **Hervorhebungen (Fettdruck):** Wichtige Begriffe, Definitionen, Schlüsselwörter oder Phrasen, die im Originaltext hervorgehoben sind (z.B. durch Fettung, Unterstreichung) oder die du als besonders betonenswert für das Verständnis und die schnelle Erfassung erachtest, sollen mit Markdown-Fettdruck (\`**wichtiger Text**\`) formatiert werden. Sei hierbei proaktiv, um die Lesbarkeit zu verbessern.
        *   **Echte Listen:** Nummerierte Listen (1., 2., ...) und Aufzählungszeichen (bullet points) aus dem Originaltext müssen als korrekte Markdown-Listen (ggf. verschachtelt unter einem Haupt-Listenelement) formatiert werden. Siehe Beispiel des Nutzers für Unter-Listenpunkte unter "### 1.5 [Hier muss eine Überschrift hin...]".
        *   **Beibehaltung und Konsistenz:** Andere vorhandene semantische Markdown-Formatierungen (wie Kursivschrift, wenn sie eine bestimmte Bedeutung hat) sollten beibehalten werden. Achte auf absolute Konsistenz in der Anwendung dieser Formatierungsregeln im gesamten Chunk.

    **Output-Format (JSON-Array von Strukturelement-Objekten):**

\`\`\`json
[
  {
        "elementType": "sectionH2", // z.B. titleH1, sectionH2, subsectionH3, paragraphBlockAsListItem
        "elementId": "chunk1_sec1", // Eindeutige ID
        "markdownContent": "## 1. Gesamtpreis / Auftragssumme",
        "originalOrderInChunk": 0
      },
      {
        "elementType": "subsectionH3",
        "elementId": "chunk1_sec1_sub1",
        "markdownContent": "### 1.1 Festpreisbindung und Preisanpassungen\\n- Die vereinbarten Preise sind, falls nicht anders angegeben, **unveränderliche Festpreise** auf Baudauer.\\nVerändert sich der Beginn der Leistung des AN infolge baustellenablaufbedingter Umstände, hat der AN **keinen Anspruch auf Preisänderungen**.", // Beachte: Zeilenumbruch innerhalb des Listenelements, wenn es im Original auch so war oder die Lesbarkeit fördert.
        "originalOrderInChunk": 1
      },
      {
        "elementType": "subsectionH3",
        "elementId": "chunk1_sec1_sub2",
        "markdownContent": "### 1.2 Abrechnung bei Pauschalpreisvereinbarung\\n- Wird der Auftrag zu einem **Pauschalpreis** erteilt, so erfolgt die Abrechnung unabhängig von den tatsächlich ausgeführten Massen bzw. Leistungen. Der AN ist verpflichtet vor Auftragserteilung die Massen des Leistungsverzeichnisses und/oder Pläne zu prüfen und erklärt, dass er alle preisbestimmenden Faktoren kennt und geprüft hat. Die vereinbarte Auftragssumme ist eine **unüberschreitbare Höchstgrenze**. Nachträglich festgestellte Rechenfehler, Massenmehrungen, sonstige Irrtümer etc. - gleich aus welchem Grund – haben keine Erhöhung des Pauschalpreises zur Folge und werden Nachforderungen aus diesen Gründen nicht anerkannt. Mehr- und Minderleistungen, durch ausdrücklich vereinbarte Ausführungsänderungen, werden getrennt ermittelt und die Kosten dem Pauschalpreis zugeschlagen oder von diesem in Abzug gebracht. Nur eine vom AG schriftlich bestätigte Pauschalpreisänderung wird bei der Abrechnung berücksichtigt.",
        "originalOrderInChunk": 2
      },
      {
        "elementType": "subsectionH3",
        "elementId": "chunk1_sec1_sub3",
        "markdownContent": "### 1.5 Umfang der Einheitspreise und inkludierte Kosten\\n- In den vereinbarten Preisen sind **sämtliche Lieferungen und Leistungen** sowie Bauelemente, Werkstücke und Geräte enthalten, die zur ordnungsgemäßen und fachgerechten Ausführung der beauftragten Leistung nötig sind, auch wenn diese im Leistungsverzeichnis oder  in der Leistungsbeschreibung nicht gesondert angeführt oder näher beschrieben wurden. Darunter fallen insbesondere alle Kosten für:\\n    *   Transport\\n    *   Versicherung\\n    *   Verpackung\\n    *   Steuern, Zölle, Gebühren und Abgaben, die mit den Lieferungen und Leistungen des AN zusammenhängen.",
        "originalOrderInChunk": 3
      }
      // ... weitere Elemente in korrekter Reihenfolge und Formatierung
]
\`\`\`

    **Wichtige Hinweise zur Implementierung:**

    *   \`elementType\` muss die semantische Hierarchie widerspiegeln und zur verwendeten Markdown-Formatierung passen (z.B. \`sectionH2\` für \`## ...\`, \`subsectionH3\` für \`### ...\`). Die Textblöcke, die als Listenelemente formatiert werden, könnten einen \`elementType\` wie \`paragraphBlockAsListItem\` oder \`contentListItem\` bekommen.
    *   Der gesamte Text des Chunks muss in den \`markdownContent\`-Feldern enthalten sein, ohne Verluste.
    *   **Höchste Priorität:** Die Lesbarkeit, die klare Struktur durch Überschriften (insbesondere die generierten H3-Titel) und die konsistente Verwendung von Listenelementen für Textblöcke sind entscheidend für den Erfolg. Sei mutig und präzise bei der Generierung der H3-Überschriften. Sie müssen den Kern des folgenden Textes treffen.
    *   Beachte das vom Nutzer gezeigte Beispiel für "Auftragsgrundlagen", wo mehrere kurze, thematisch zusammengehörige Sätze des Originaltextes zu einem einzigen Listenelement zusammengefasst wurden. Dies erfordert ein gutes semantisches Verständnis.

    Stelle sicher, dass das resultierende JSON valide ist und die Struktur des Input-Chunks präzise und vollständig abbildet, wobei der \`markdownContent\` exakt nach diesen detaillierten Vorgaben für maximale Lesbarkeit und Strukturklarheit formatiert ist.
`;

// System-Prompt für Agent 3 (Stufe 3: Element-Analyse - Placeholder, ggf. anpassen)
// Dieser Prompt ist wahrscheinlich sehr ähnlich zum bestehenden Prompt für die Risikoanalyse.
export const SYSTEM_PROMPT_AGENT3_ANALYZE = `
Du bist ein spezialisierter Vertragsanalyse-Agent, der Vertragsklauseln bewertet und klassifiziert.

## Deine Aufgabe
Analysiere die gegebene Vertragsklausel präzise und objektiv. Klassifiziere sie als ROT (kritisch), GELB (bedenklich) oder GRÜN (unbedenklich) basierend auf den unten angegebenen Regeln. Du musst deine Bewertung mit einer klaren Begründung versehen und eine konkrete Handlungsempfehlung geben.

## Analyseregeln
Die folgenden Klauseln und Regelungen sind problematisch und als kritisch (ROT) oder bedenklich (GELB) einzustufen:

* **Pay-When-Paid:** Zahlung an Lindner von Zahlung des Bauherrn abhängig
* **Gewerbliche Schutzrechte:** Übertragung an Auftraggeber oder Bauherrn
* **Gestörter Bauablauf:** Anspruch auf Bauzeitverlängerung und Mehrkosten ausgeschlossen
* **Vertragsstrafen:** Kein Höchstbetrag für Vertragsstrafen (grsl. 10% Auftragssumme)
* **Liquidated Damages:** Vertragliche Schadenspauschalierungen ohne angemessene Begrenzung
* **back-to-back Vertrag:** Vollständige Einbeziehung der Pflichten und Haftung des Bauherrnvertrags
* **Bid-Bonds Bietergarantie:** Hinterlegung einer Angebotsgarantie gefordert
* **Haftungsbegrenzung:** Keine Haftungsbegrenzung auf den Auftragswert bei entsprechender Chancen-Risiken Analyse
* **Patronate:** Patronat entspricht nicht Verfahrensanweisung VA-RE-004

## Nicht akzeptable Klauseln (ROT)
* **Pay-When-Paid Klausel:** Unsere Zahlung darf nicht von der Zahlung des Bauherrn abhängig gemacht werden.
* **Übertragung gewerblicher Schutzrechte:** Eine vollständige Übertragung der Schutzrechte lehnen wir ab. Wir gewähren dem Auftraggeber jedoch ein unbegrenztes Nutzungsrecht.
* **Vertragsstrafen ohne Begrenzung:** Wir akzeptieren Vertragsstrafen bis max. 5% der Auftragssumme. In Ausnahmefällen kann eine Erhöhung auf 10% mit Vorstandsfreiheit erfolgen. Eine Begrenzung der Vertragsstrafe muss im Vertrag vorhanden sein.
* **Back-to-Back Vertragsübernahme:** Wir können eine vollständige Einbeziehung der Pflichten und Haftung aus dem Bauherrnvertrag nicht akzeptieren. Falls Vertragsbedingungen überbunden werden, müssen diese offengelegt und verhandelbar sein.
* **Bietergarantie (Bid-Bond):** Wir stellen keine Angebotsgarantie (Bid-Bond) zur Verfügung.
* **Fehlendes fixes Bauende:** Der Vertrag muss ein klar definiertes Bauende enthalten, entweder direkt im Vertrag oder in einem Besprechungsprotokoll.
* **Keine Verschuldensunabhängigen Klauseln:** Pönale oder Schadenersatz müssen immer ein Verschulden durch uns voraussetzen.

## Verhandelbare Vertragsbedingungen (GELB)
* **Gestörter Bauablauf:** Falls eine Bauzeitverlängerung und Mehrkosten ausgeschlossen sind, möchten wir dies verhandeln und unsere Rechte auf Verlängerung und Mehrkostenansprüche sichern.
* **Vertragserfüllungsbürgschaft:** Derzeit wird eine Erfüllungsgarantie von 20% gefordert. Wir möchten dies auf max. 10% reduzieren.
* **Ausschluss der ÖNORM B 2110:** Die ÖNORM B 2110 ist für uns eine wichtige Vertragsgrundlage. Falls diese ausgeschlossen wird, möchten wir insbesondere über folgende Punkte sprechen:
    * **Sphärenzuordnung (§ 7.2.1 ÖNORM B 2110):** Wir möchten, dass höhere Gewalt in die Sphäre des Auftraggebers fällt. Falls das nicht möglich ist, akzeptieren wir Bauverzugskosten nur, wenn der Auftraggeber das Terminrisiko übernimmt.
    * **Abnahmeregelung:** Die Regelung sollte gemäß ÖNORM B 2110 gestaltet sein.
    * **Mängelregelung:** ein unbeschränktes Zurückbehalterecht ist auszuschließen und eine Regelung entsprechend ÖNORM zu erreichen.
* **Konzernübergreifende Haftung oder Projektübergreifende Haftung:** Wir können keine konzernübergreifende Haftung übernehmen und möchten diesen Punkt anpassen. Idealerweise übernehmen wir auch keine Haftung, die über ein Projekt hinausgeht. Das gilt in beide Richtungen.
* **Persönliche Haftung:** Eine persönliche Haftung kann nur akzeptiert werden, soweit und in dem Umfang diese Haftung auch gesetzlich vorgesehen ist.
* **Sub-Sub-Vergabe:** Da wir mit Montagepartnern (Subfirma) arbeiten, ist ein Ausschluss derselben nachteilig für uns und muss verhandelt werden.

## Für die Kalkulation zu beachtende Punkte
* Höhe der Pönale
* Alle Vertragsstrafen die als Betrag oder %-Satz genannt werden
* Zahlungsbedingungen
* Höhe der Baustellengemeinkosten/Beistellungen
* Höhe des Deckungsrücklass und Haftrücklass
* Bauschadensabzug
* Auslesen welche Fassung der ÖNORM gültig sein soll

## Antwortformat
Deine Antwort muss folgendes JSON-Format haben:
{
  "evaluation": "ROT/GELB/GRÜN",
  "reason": "Begründung für die Bewertung",
  "recommendation": "Konkrete Handlungsempfehlung"
}

Bewerte die Vertragsklausel streng nach den oben genannten Kriterien. Du brauchst keinen Kontext aus einer externen Knowledge Base zu verwenden.
`;


// --- Bestehende Gemini Actions ---

// Erstelle eine Einbettung für einen Text mit Gemini
export const createEmbedding = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // API-Schlüssel aus Umgebungsvariablen lesen (jetzt GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY ist nicht konfiguriert für Embedding");
      throw new ConvexError("GEMINI_API_KEY is not configured for embedding.");
    }

    // Google AI SDK initialisieren
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      // Einbettungs-Modell initialisieren (jetzt text-embedding-004 für 768 Dimensionen)
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
      
      // Einbettung erstellen
      console.log("Generating embedding with text-embedding-004...");
      const result = await embeddingModel.embedContent(args.text);
      const embedding = result.embedding.values;

      // Sicherstellen, dass ein Array zurückgegeben wird
      if (!Array.isArray(embedding)) {
        console.error("Embedding result is not an array:", embedding);
        throw new Error("Failed to generate a valid embedding array.");
      }

      // Einbettungsvektor zurückgeben
      console.log(`Embedding generated successfully (length: ${embedding.length})`);
      return embedding;
    } catch (error: any) {
      console.error("Fehler bei der Erstellung der Einbettung mit text-embedding-004:", error);
      // Gib den Fehler weiter
      throw new ConvexError(`Embedding generation failed: ${error.message || 'Unknown error'}`);
    }
  },
});

// Hilfsfunktion zum Aufruf der Gemini API für strukturierte JSON-Generierung
export const generateStructuredJson = internalAction({
  args: {
    textInput: v.string(),
    maxOutputTokens: v.optional(v.number()),
    systemPrompt: v.optional(v.string()),
    modelName: v.optional(v.string()), // Optional: Erlaube Überschreiben des Modells
  },
  handler: async (ctx, args) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable not set.");
    }

    // Verwende übergebenes Modell oder Fallback auf Flash
    const model = args.modelName ?? "gemini-2.0-flash"; // Default auf Flash
    const max_output_tokens = args.maxOutputTokens ?? 2048; // Standard-Token-Limit

    // System-Prompt standardmäßig oder übergebenen verwenden
    const systemPrompt = args.systemPrompt ?? "You are a helpful assistant.";

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const generativeModel = genAI.getGenerativeModel({
       model: model,
       systemInstruction: systemPrompt,
       generationConfig: {
           responseMimeType: "application/json", // Wichtig: Fordert JSON-Ausgabe an!
       },
    });

    try {
      console.log(`Calling Gemini (${model}) for structured JSON generation...`);
      const result = await generativeModel.generateContent(args.textInput);
      const response = result.response;
      
      // Überprüfung, ob eine Antwort vorhanden ist
      if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
        console.error("Gemini API response is empty or not in the expected format.", response);
        // Versuche, Finish Reason auszulesen, falls vorhanden
        const finishReason = response?.candidates?.[0]?.finishReason;
        const safetyRatings = response?.candidates?.[0]?.safetyRatings;
        console.error(`Finish Reason: ${finishReason}, Safety Ratings: ${JSON.stringify(safetyRatings)}`);
        throw new Error(`Unexpected Gemini API response format or empty response. Finish Reason: ${finishReason}`);
      }

      const jsonText = response.candidates[0].content.parts[0].text;
      
      // WICHTIG: Das Modell sollte dank "application/json" valides JSON liefern.
      // Wir parsen es hier, um sicherzustellen, dass es valide ist, bevor wir es zurückgeben.
      // Die aufrufende Funktion (`structureContractIncrementallyAndCreateJsonElements`)
      // muss das Ergebnis dann noch als den erwarteten Typ (z.B. RawStructuredElement[]) behandeln.
      let parsedJson;
      try {
        // Stelle sicher, dass jsonText ein String ist, bevor geparst wird
        if (typeof jsonText !== 'string') {
            console.error("jsonText is not a string, cannot parse:", jsonText);
            throw new Error("Received non-string content part from Gemini API.");
        }
        parsedJson = JSON.parse(jsonText);
        console.log(`Successfully parsed JSON response from Gemini (${model}).`);
        return parsedJson; // Gib das geparste JSON-Objekt/Array zurück
      } catch (parseError: any) {
        console.error("Failed to parse JSON response from Gemini, despite requesting JSON mime type:", jsonText, "Error:", parseError);
        throw new Error(`Failed to parse JSON response from Gemini: ${parseError.message}`);
      }

    } catch (error: any) {
      console.error(`Error calling Gemini API (${model}):`, error);
      // Gib den Fehler weiter, damit die aufrufende Funktion ihn behandeln kann
      throw new ConvexError(`Gemini API call failed (${model}): ${error.message || 'Unknown error'}`);
    }
  },
});

// Hilfsfunktion zum Aufruf der Gemini API für Analyse mit Pro-Modell (oder überschriebenem Modell)
export const generateAnalysisWithPro = internalAction({
  args: {
    elementMarkdownContent: v.string(),
    elementId: v.string(),
  },
  handler: async (ctx, args) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable not set for Stage 3 element analysis.");
      throw new ConvexError("GEMINI_API_KEY environment variable not set.");
    }

    // Modell gemäß Implementierungsanleitung für Stufe 3
    const modelName = "gemini-2.5-flash-preview-04-17"; 

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const generativeModel = genAI.getGenerativeModel({
       model: modelName,
       systemInstruction: SYSTEM_PROMPT_AGENT3_ANALYZE, // Neuer System-Prompt für Stufe 3
       generationConfig: {
           responseMimeType: "application/json",
       },
    });

    try {
      const result = await generativeModel.generateContent(args.elementMarkdownContent);
      const response = result.response;

      if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
        console.error(`Gemini (${modelName}) API response for Stage 3 (Element ${args.elementId}) is empty or not in the expected format.`, response);
        const finishReason = response?.candidates?.[0]?.finishReason;
        const safetyRatings = response?.candidates?.[0]?.safetyRatings;
        console.error(`Finish Reason: ${finishReason}, Safety Ratings: ${JSON.stringify(safetyRatings)}`);
        return {
            evaluation: "Fehler",
            reason: `Unexpected Gemini API response format or empty response. Finish Reason: ${finishReason}`,
            recommendation: "Analyse konnte nicht durchgeführt werden.",
            isError: true,
            errorMessage: `Unexpected Gemini API response format or empty response. Finish Reason: ${finishReason}`
        };
      }

      const jsonText = response.candidates[0].content.parts[0].text;
      let parsedAnalysisResult;
      try {
        if (typeof jsonText !== 'string') {
            console.error(`jsonText from Stage 3 Gemini (Element ${args.elementId}) is not a string:`, jsonText);
            throw new Error("Received non-string content part from Gemini API for analysis.");
        }
        parsedAnalysisResult = JSON.parse(jsonText);
        
        if (!parsedAnalysisResult.evaluation || !parsedAnalysisResult.reason || !parsedAnalysisResult.recommendation) {
            console.warn(`Parsed JSON from Stage 3 (Element ${args.elementId}) does not match expected analysis format:`, parsedAnalysisResult);
            return {
                evaluation: "Fehler",
                reason: "KI-Antwort für Analyse hatte nicht das erwartete Format.",
                recommendation: "Erneute Analyse versuchen oder Prompt anpassen.",
                isError: true,
                errorMessage: "Parsed JSON from Stage 3 analysis does not match expected format."
            };
        }
        return { 
            ...parsedAnalysisResult, 
            isError: parsedAnalysisResult.isError || false,
            errorMessage: parsedAnalysisResult.errorMessage
        }; 

      } catch (parseError: any) {
        console.error(`Failed to parse JSON response from Gemini Stage 3 (${modelName}, Element ${args.elementId}):`, jsonText, "Error:", parseError);
        return {
            evaluation: "Fehler",
            reason: `Failed to parse JSON response from Gemini Stage 3: ${parseError.message}`,
            recommendation: "Überprüfung der KI-Antwort und des Parsers notwendig.",
            isError: true,
            errorMessage: `Failed to parse JSON response from Gemini Stage 3: ${parseError.message}`
        };
      }

    } catch (error: any) {
      console.error(`Error calling Gemini API (${modelName}) for Stage 3 Analysis (Element ${args.elementId}):`, error);
      return {
            evaluation: "Fehler",
            reason: `Gemini API call failed for Stage 3: ${error.message || 'Unknown error'}`,
            recommendation: "API-Verbindung oder Konfiguration prüfen.",
            isError: true,
            errorMessage: `Gemini API call failed for Stage 3: ${error.message || 'Unknown error'}`
        };
    }
  },
});

// --- NEUE ACTIONS FÜR MEHRSTUFIGE ANALYSE ---

// Stufe 1: Grob-Chunking mit Gemini Pro
export const runStage1Chunking = internalAction({
  args: {
    contractText: v.string(),
  },
  handler: async (ctx, args) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable not set for Stage 1.");
      throw new ConvexError("GEMINI_API_KEY environment variable not set.");
    }

    const modelName = "gemini-2.5-pro-preview-05-06"; // Korrektes Pro-Modell

    console.log(`Starting Stage 1 Chunking with ${modelName}...`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const generativeModel = genAI.getGenerativeModel({
       model: modelName,
       systemInstruction: SYSTEM_PROMPT_AGENT1_CHUNK,
       generationConfig: {
           responseMimeType: "application/json",
           // Ggf. Temperature anpassen, falls nötig (Standard ist oft ok für strukturierte Aufgaben)
           // temperature: 0.2,
       },
    });

    try {
      const result = await generativeModel.generateContent(args.contractText);
      const response = result.response;

      if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
        console.error(`Gemini (${modelName}) API response for Stage 1 is empty or not in the expected format.`, response);
        const finishReason = response?.candidates?.[0]?.finishReason;
        const safetyRatings = response?.candidates?.[0]?.safetyRatings;
        console.error(`Finish Reason: ${finishReason}, Safety Ratings: ${JSON.stringify(safetyRatings)}`);
        throw new Error(`Unexpected Gemini API response format or empty response. Finish Reason: ${finishReason}`);
      }

      const jsonText = response.candidates[0].content.parts[0].text;
      let parsedChunks;
      try {
        if (typeof jsonText !== 'string') {
             console.error("jsonText from Stage 1 Gemini is not a string:", jsonText);
             throw new Error("Received non-string content part from Gemini API.");
         }
        parsedChunks = JSON.parse(jsonText);
        // Validierung (optional aber empfohlen): Überprüfen, ob es ein Array ist und die erwarteten Felder hat
        if (!Array.isArray(parsedChunks) || parsedChunks.length === 0 || !parsedChunks[0].chunkNumber || !parsedChunks[0].identifiedSections || !parsedChunks[0].chunkContent) {
             console.warn("Parsed JSON from Stage 1 does not match expected chunk format:", parsedChunks);
             // Ggf. trotzdem zurückgeben und die aufrufende Funktion validieren lassen, oder hier Fehler werfen
             // throw new Error("Parsed JSON does not match expected chunk format.");
        }
        console.log(`Successfully parsed ${parsedChunks.length} large chunks from Gemini (${modelName}) Stage 1.`);
        return parsedChunks; // Gib das Array der Chunk-Objekte zurück
      } catch (parseError: any) {
        console.error(`Failed to parse JSON response from Gemini Stage 1 (${modelName}), despite requesting JSON mime type:`, jsonText, "Error:", parseError);
        throw new Error(`Failed to parse JSON response from Gemini Stage 1: ${parseError.message}`);
      }

    } catch (error: any) {
      console.error(`Error calling Gemini API (${modelName}) for Stage 1 Chunking:`, error);
      throw new ConvexError(`Gemini API call failed for Stage 1 (${modelName}): ${error.message || 'Unknown error'}`);
    }
  },
});

// Stufe 2: Detaillierte Strukturierung eines großen Chunks mit Gemini Pro
export const runStage2Structuring = internalAction({
  args: {
    chunkContent: v.string(),
    globalChunkNumber: v.number(),
    identifiedSectionsOfParentChunk: v.array(v.string()), // Zur Kontextgabe an das Modell
  },
  handler: async (ctx, args) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable not set for Stage 2.");
      throw new ConvexError("GEMINI_API_KEY environment variable not set.");
    }

    const modelName = "gemini-2.5-pro-preview-05-06"; // Korrektes Pro-Modell

    console.log(`Starting Stage 2 Structuring for global chunk ${args.globalChunkNumber} with ${modelName}...`);

    // Kontext für das Modell vorbereiten (wird im Prompt selbst nicht explizit verwendet,
    // aber es ist gut, ihn ggf. zur Verfügung zu haben oder in Zukunft einzubauen)
    const contextPromptPart = `Dieser Text ist Teil des globalen Chunks Nr. ${args.globalChunkNumber}, welcher folgende Hauptabschnitte umfasst: ${args.identifiedSectionsOfParentChunk.join(", ")}. Strukturiere nun den folgenden Inhalt detailliert:`;

    const userPrompt = `${contextPromptPart}\n\n--- TEXT-CHUNK ZUR STRUKTURIERUNG ---\n${args.chunkContent}\n--- ENDE TEXT-CHUNK ---`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const generativeModel = genAI.getGenerativeModel({
       model: modelName,
       systemInstruction: SYSTEM_PROMPT_AGENT2_STRUCTURE,
       generationConfig: {
           responseMimeType: "application/json",
           // Ggf. Temperature anpassen
           // temperature: 0.2,
       },
    });

    try {
      const result = await generativeModel.generateContent(userPrompt); // Verwende den kombinierten Prompt
      const response = result.response;

      if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
        console.error(`Gemini (${modelName}) API response for Stage 2 (Chunk ${args.globalChunkNumber}) is empty or not in the expected format.`, response);
        const finishReason = response?.candidates?.[0]?.finishReason;
        const safetyRatings = response?.candidates?.[0]?.safetyRatings;
        console.error(`Finish Reason: ${finishReason}, Safety Ratings: ${JSON.stringify(safetyRatings)}`);
        throw new Error(`Unexpected Gemini API response format or empty response. Finish Reason: ${finishReason}`);
      }

      const jsonText = response.candidates[0].content.parts[0].text;
      let parsedStructuredElements;
      try {
         if (typeof jsonText !== 'string') {
             console.error(`jsonText from Stage 2 Gemini (Chunk ${args.globalChunkNumber}) is not a string:`, jsonText);
             throw new Error("Received non-string content part from Gemini API.");
         }
        parsedStructuredElements = JSON.parse(jsonText);
        // Validierung (optional aber empfohlen): Überprüfen, ob es ein Array ist und die erwarteten Felder hat
        if (!Array.isArray(parsedStructuredElements) /* || parsedStructuredElements.length === 0 */) { // Leere Arrays können gültig sein
             console.warn(`Parsed JSON from Stage 2 (Chunk ${args.globalChunkNumber}) is not an array:`, parsedStructuredElements);
             throw new Error("Parsed JSON from Stage 2 is not an array.");
        } else if (parsedStructuredElements.length > 0 && (!parsedStructuredElements[0].elementType || !parsedStructuredElements[0].elementId || !parsedStructuredElements[0].markdownContent || typeof parsedStructuredElements[0].originalOrderInChunk !== 'number')) {
             console.warn(`Parsed JSON from Stage 2 (Chunk ${args.globalChunkNumber}) does not match expected element format:`, parsedStructuredElements[0]);
            //  throw new Error("Parsed JSON elements do not match expected format."); // Ggf. weniger streng sein
        }

        console.log(`Successfully parsed ${parsedStructuredElements.length} structured elements from Gemini (${modelName}) Stage 2 for chunk ${args.globalChunkNumber}.`);
        // Füge globalChunkNumber zu jedem Element hinzu, bevor es zurückgegeben wird
        const elementsWithGlobalChunkNumber = parsedStructuredElements.map((element: any) => ({
            ...element,
            globalChunkNumber: args.globalChunkNumber
        }));
        return elementsWithGlobalChunkNumber; // Gib das Array der strukturierten Elemente zurück

      } catch (parseError: any) {
        console.error(`Failed to parse JSON response from Gemini Stage 2 (${modelName}, Chunk ${args.globalChunkNumber}):`, jsonText, "Error:", parseError);
        throw new Error(`Failed to parse JSON response from Gemini Stage 2: ${parseError.message}`);
      }

    } catch (error: any) {
      console.error(`Error calling Gemini API (${modelName}) for Stage 2 Structuring (Chunk ${args.globalChunkNumber}):`, error);
      throw new ConvexError(`Gemini API call failed for Stage 2 (${modelName}): ${error.message || 'Unknown error'}`);
    }
  },
});

// Stufe 3: Element-Analyse (wird in Schritt 3.3 angepasst/erstellt) 