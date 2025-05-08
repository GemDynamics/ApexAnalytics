Hier ist der überarbeitete und erweiterte Plan für dein Backend mit TypeScript, Convex und Berücksichtigung des Vercel-Deployments sowie weiteren wichtigen Aspekten:

**Übergeordnetes Ziel:** Ein robustes, skalierbares und sicheres Backend für eine KI-gestützte Vertragsanalyse- und Verhandlungssimulations-App.

**Kerntechnologien:**

*   **Backend-Plattform:** Convex (TypeScript)
*   **Frontend:** Next.js (TypeScript) – läuft auf Vercel
*   **KI-Modell:** Gemini API
*   **Deployment:** Vercel für Next.js Frontend und Convex für das Backend (Convex-Deployments sind oft mit Vercel-Deployments verknüpft)

---

**Erweiterter Backend-Plan:**

**1. Authentifizierung und Autorisierung (NEU/DETAILLIERTER)**

*   **Notwendigkeit:** Um Nutzerdaten zu schützen und Aktionen eindeutig Nutzern zuzuordnen (z.B. wer hat welchen Vertrag hochgeladen, wer führt welche Simulation durch).
*   **Lösungsvorschlag:** Integration eines Auth-Providers mit Convex.
    *   **Clerk:** Sehr beliebt und gut mit Convex und Next.js integriert. Bietet eine umfassende Lösung mit UI-Komponenten.
    *   **Convex Built-in Auth (wenn für einfache Fälle ausreichend) oder andere Provider wie Auth0, NextAuth.js (mit Anpassung für Convex).**
*   **Implementierung:**
    *   Die `userId` in den Schemas (z.B. `contracts.userId`, `simulations.userId`) wird durch die ID des authentifizierten Nutzers ersetzt, die Convex automatisch über `ctx.auth.getUserIdentity()` bereitstellt.
    *   **Schema-Anpassung:**
        ```typescript
        // convex/schema.ts - Beispielanpassung
        // contracts: defineTable({
        //   userId: v.string(), // ÄNDERN ZU: automatisch von ctx.auth
        //   ...
        // })
        // Stattdessen wird die userId in den Funktionen über ctx.auth.getUserIdentity() geholt und ggf. gespeichert,
        // oder Convex's Mechanismus für "Eigentümerschaft" genutzt, falls vorhanden/passend.
        // Oft ist es besser, die `userId` explizit zu speichern, wenn sie von `ctx.auth` kommt.
        contracts: defineTable({
            ownerId: v.string(), // ID des Nutzers von ctx.auth.getUserIdentity()
            // ... restliche Felder ...
        }).index("by_ownerId", ["ownerId"]),
        ```
    *   **Funktionsanpassung:** Queries und Mutations müssen die Nutzeridentität prüfen.
        ```typescript
        // convex/contracts.ts - Beispiel
        export const listUserContracts = query({
          args: {}, // Keine userId mehr als Argument, wird aus dem Kontext geholt
          handler: async (ctx) => {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
              // Oder leeres Array zurückgeben, je nach gewünschtem Verhalten
              throw new Error("User not authenticated");
            }
            return await ctx.db
              .query("contracts")
              .withIndex("by_ownerId", (q) => q.eq("ownerId", identity.subject)) // identity.subject ist oft die User-ID
              .order("desc")
              .collect();
          },
        });
        ```
*   **Autorisierung:** Sicherstellen, dass Nutzer nur auf ihre eigenen Daten zugreifen und diese modifizieren können. Dies wird in den jeweiligen Queries und Mutations durch Prüfung der `identity.subject` gegen die `ownerId` der Dokumente implementiert.

**2. Datenbankschema (`convex/schema.ts`)**

*   Das zuvor definierte Schema bleibt in seiner Grundstruktur valide, mit der Anpassung für `ownerId` (siehe Authentifizierung).
*   **Überlegung zu `extractedText`:** Bei sehr großen Verträgen könnte die Speicherung des gesamten Texts direkt im Dokument an Grenzen stoßen oder die Performance beeinträchtigen.
    *   **Alternative:** Den extrahierten Text separat im Convex File Storage speichern (als `.txt`-Datei) und im `contracts`-Dokument nur die `storageId` für diesen Text hinterlegen. Zugriff dann bei Bedarf. Für einen Hackathon ist die direkte Speicherung im Feld aber oft einfacher. Behalte die Token-Limits der Gemini API im Hinterkopf – sehr lange Texte müssen ggf. gekürzt oder in Chunks verarbeitet werden.
*   **Status-Felder:** Die definierten Status (`contracts.status`, `simulations.status`) sind gut für die Nachverfolgung.

**3. Text-Extraktion aus Dateien (PDF/DOCX) (NEU/DETAILLIERTER)**

*   **Herausforderung:** Vertragsdokumente kommen meist als PDF oder DOCX. Der Text muss serverseitig extrahiert werden.
*   **Lösungsvorschlag für Convex Actions:**
    *   Nutze Node.js-kompatible Bibliotheken innerhalb der Convex Action, die den Dateiupload verarbeitet.
    *   **PDF:** `pdf-parse` (npm-Paket) ist eine gängige Wahl.
    *   **DOCX:** `mammoth` (npm-Paket) kann DOCX zu HTML oder Markdown konvertieren, woraus dann der Text extrahiert wird.
*   **Implementierung in `convex/contractProcessing.ts` (`handleContractUpload` Action):**
    1.  Datei von `storageId` laden (`await ctx.storage.get(args.storageId)`).
    2.  Dateiinhalt (Buffer) an die entsprechende Bibliothek übergeben.
        ```typescript
        // Beispielhafter Ausschnitt in einer Action
        // const fileBuffer = await ctx.storage.get(args.storageId);
        // if (!fileBuffer) { throw new Error("File not found"); }
        // let extractedText = "";
        // if (args.fileType === "application/pdf") {
        //   const pdf = require("pdf-parse"); // Am Anfang der Datei importieren
        //   const data = await pdf(fileBuffer);
        //   extractedText = data.text;
        // } else if (args.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        //   const mammoth = require("mammoth"); // Am Anfang der Datei importieren
        //   const result = await mammoth.extractRawText({ buffer: fileBuffer });
        //   extractedText = result.value;
        // } else {
        //   // Fallback oder Fehler für nicht unterstützte Typen
        // }
        // await ctx.runMutation(internal.contracts.updateContractStatus, { ..., extractedText });
        ```
    *   **Wichtig:** Die `require` Statements für npm-Pakete müssen am Anfang der Action-Datei stehen. Die Verfügbarkeit der Pakete in der Convex Node.js-Umgebung muss sichergestellt sein (normalerweise über `package.json` deines Convex-Projekts).

**4. Queries, Mutations, Actions**

*   Die zuvor skizzierten Funktionen bleiben relevant.
*   **Umgang mit der Wissensdatenbank in Prompts (DETAILLIERTER):**
    *   **Herausforderung:** Die Wissensdatenbank-Dateien (`Regeln für die Analyse.md`, juristische Texte, Kommunikationsleitfäden) können groß sein und das Token-Limit von Gemini sprengen, wenn sie vollständig in jeden Prompt eingefügt werden.
    *   **Strategie für den Hackathon (pragmatisch):**
        1.  **Selektives Laden/Einfügen:** Lade die Inhalte der relevanten Wissensdateien einmalig beim Start der Action oder halte sie im Speicher der Action (falls möglich und sinnvoll für die Laufzeit einer Action).
        2.  **Kontextbasierte Auswahl:** Füge nur die absolut notwendigen Abschnitte der Wissensdatenbank in den Prompt ein, die für die spezifische Aufgabe (z.B. Analyse einer bestimmten Klausel, Beantwortung einer bestimmten Verhandlungsfrage) relevant sind. Dies erfordert Logik in den Actions, um die Relevanz zu bestimmen.
        3.  **`Regeln für die Analyse.md`:** Diese Datei ist zentral und sollte für den Vertragsanalyse-Agenten immer (ggf. gekürzt auf die Kernregeln) im Systemprompt präsent sein.
        4.  **Juristische Texte:** Bei der Analyse oder dem Generieren von Alternativen zu einer Klausel könnten spezifische Paragraphen aus den juristischen MD-Dateien extrahiert und dem Prompt hinzugefügt werden, die sich auf das Thema der Klausel beziehen (z.B. Gewährleistung, Zahlungsfristen).
        5.  **Kommunikations-/Sales-Leitfäden für Simulation:** Hier könnten allgemeine Prinzipien oder spezifische Taktiken, die zur aktuellen Verhandlungssituation passen, in den Systemprompt des Simulations-Agenten einfließen oder als Referenz für seine Antwortgenerierung dienen.
    *   **Langfristige/Fortgeschrittene Optionen (außerhalb des Hackathon-Zeitrahmens ggf.):**
        *   **RAG (Retrieval Augmented Generation):** Wissensdatenbank in einer Vektordatenbank speichern und vor dem Gemini-Aufruf relevante Chunks abrufen.
        *   **Gemini Function Calling:** Wenn Gemini das unterstützt, könnte es Funktionen aufrufen, um spezifische Informationen aus der Wissensdatenbank (die dann in Convex gespeichert sein könnte) abzurufen.
*   **Fehlerbehandlung:** In Actions und Mutations `try...catch`-Blöcke verwenden und aussagekräftige Fehler an das Frontend weitergeben oder loggen.
*   **API Key Management:** `GEMINI_API_KEY` wird sicher als Environment Variable in Convex und Vercel gespeichert.

**5. Dateispeicher (Convex Storage)**

*   Der Plan, Convex's eigenen Dateispeicher zu nutzen, ist für den Anfang gut und einfach zu integrieren.
    *   Upload-Prozess wie skizziert: Client holt Upload-URL von Mutation, lädt hoch, ruft Action mit `storageId` auf.

**6. Vercel Deployment Integration (NEU/DETAILLIERTER)**

*   **Convex Projekt mit Vercel verknüpfen:**
    1.  **Convex Dashboard:** In den Projekteinstellungen deines Convex-Projekts gibt es normalerweise eine Option, das Projekt mit einem Git-Provider (GitHub, GitLab, Bitbucket) und Vercel zu verknüpfen.
    2.  **Vercel Einstellungen:**
        *   Installiere die Convex-Integration in deinem Vercel-Projekt.
        *   **Environment Variablen in Vercel:**
            *   `CONVEX_DEPLOYMENT`: Wird von der Convex-Integration oft automatisch gesetzt oder muss manuell aus dem Convex Dashboard kopiert werden (die URL deines Production-Deployments, z.B. `https://<your-project>.convex.cloud`).
            *   `NEXT_PUBLIC_CONVEX_URL`: Die gleiche URL wie `CONVEX_DEPLOYMENT`, aber für den Client-seitigen Zugriff im Next.js Code.
            *   `GEMINI_API_KEY`: Muss ebenfalls in den Vercel Environment Variablen für die serverseitigen Funktionen (Next.js API Routes, falls du welche zusätzlich zu Convex nutzt) oder für den Build-Prozess, falls dort benötigt, gesetzt werden. Primär wird er aber von den Convex Actions genutzt und muss daher im Convex Dashboard gesetzt sein.
*   **Build & Deployment Prozess:**
    *   Wenn du Code an dein verknüpftes Git-Repository pushst (z.B. in den `main`-Branch), löst Vercel einen Build deines Next.js-Frontends aus.
    *   Gleichzeitig (oder durch separate Konfiguration/CLI-Befehl `npx convex deploy`) wird dein Convex Backend (Schema, Funktionen) deployed. Die Vercel-Integration für Convex zielt darauf ab, dies zu automatisieren.
*   **`convex/auth.config.js` (oder `.ts`):** Wenn du einen Auth-Provider wie Clerk verwendest, musst du hier die Konfiguration für die verschiedenen Umgebungen (Development, Production) hinterlegen. Die Domain- und ID-Werte dafür bekommst du vom Auth-Provider.

**7. Zusätzliche Überlegungen**

*   **Logging und Monitoring:**
    *   Convex bietet eingebaute Logs, die du im Dashboard einsehen kannst. Für detaillierteres Monitoring könnten externe Dienste in Betracht gezogen werden, aber für den Hackathon reichen die Convex Logs.
    *   Frontend-Logging (z.B. Sentry) kann auch hilfreich sein.
*   **Sicherheit:**
    *   **Input Validierung:** Convex `v` Objekte im Schema und in Funktionsargumenten sind der erste Schritt. Zusätzliche Validierungen in Actions, bevor externe APIs aufgerufen werden.
    *   **Rate Limiting:** Für die Gemini API Aufrufe (Convex hat eigene Rate Limits, aber die externe API ist der Knackpunkt). Implementiere ggf. einfache Retries mit Backoff in den Actions. Für einen Hackathon ist dies oft "best effort".
*   **Löschen von Daten (DSGVO):** Implementiere Mutations, um Verträge und zugehörige Analysen/Simulationen auf Nutzeranfrage zu löschen (unter Berücksichtigung der `ownerId`).
*   **Testen:**
    *   Convex bietet Möglichkeiten zum Testen von Queries und Mutations.
    *   Actions, die externe APIs aufrufen, sind schwieriger. Mocking der API-Aufrufe oder Testen gegen eine Sandbox-Umgebung von Gemini (falls verfügbar).

---

**Zusammenfassender Check – Haben wir an alles gedacht?**

1.  **Kernfunktionalität abgedeckt?** Ja, Vertragsanalyse, -optimierung, Simulation.
2.  **Datenstruktur logisch?** Ja, das Schema ist für die Anwendungsfälle gut strukturiert.
3.  **KI-Integration klar?** Ja, über Convex Actions, die Gemini aufrufen. Prompt-Engineering bleibt ein wichtiger Teil der Implementierung.
4.  **Nutzererfahrung (Backend-Perspektive)?** Authentifizierung ist jetzt drin, Status-Updates helfen dem Frontend.
5.  **Sicherheit und Skalierbarkeit (Grundlagen)?** Authentifizierung, Convex-Skalierbarkeit, API-Key-Management sind adressiert.
6.  **Deployment-Pfad klar?** Ja, mit Vercel und Convex Integration.
7.  **Kritische Abhängigkeiten (Text-Extraktion)?** Konkrete Bibliotheken vorgeschlagen.
8.  **Wissensmanagement für KI?** Pragmatische Lösung für Hackathon skizziert, Herausforderungen bzgl. Token-Limits erwähnt.

Dieser Plan ist nun deutlich umfassender. Die Implementierung der Authentifizierung und der robusten Text-Extraktion werden wichtige erste Schritte sein, nachdem das Grundgerüst mit Schema und einfachen Funktionen steht.
