# KI-gestützte Vertragsanalyse

Ein fortschrittliches System zur automatisierten Analyse von Verträgen mit KI und juristischen Wissensbasen.

## Projektübersicht

Dieses System ermöglicht eine detaillierte Analyse von Verträgen durch:

1. **Inkrementelle Strukturierung**: Umwandlung unstrukturierter Vertragstexte in strukturierte Markdown-Elemente.
2. **Intelligentes Chunking**: Gruppierung der Vertragselemente in logische Analyse-Einheiten.
3. **Kontextualisierte Klauselanalyse**: Bewertung der Klauseln nach einem Ampelsystem (Rot/Gelb/Grün) mit juristischer Wissensbasis.
4. **Alternative Formulierungen**: Automatische Generierung von besseren Formulierungen für problematische Klauseln.
5. **KI-gestützte Optimierung**: Möglichkeit zur weiteren Verbesserung von Vertragsklauseln.

## Technische Architektur

Das System basiert auf folgenden Komponenten:

- **Frontend**: Next.js mit React und Tailwind CSS für die Benutzeroberfläche
- **Backend**: API-Routen mit Next.js
- **Wissensdatenbank**: Vektordatenbank mit Convex für semantische Suche
- **KI-Integration**: OpenAI (GPT-4 Turbo, Embeddings API)

## Vertragsanalyse-Prozess

1. **Strukturierung**: Ein Vertrag wird durch KI in strukturierte Elemente umgewandelt.
2. **Analyse**: Jede Vertragsklausel wird:
   - Vektorisiert und semantisch in der Wissensdatenbank gesucht
   - Auf Basis relevanter juristischer Regeln und Gesetze analysiert
   - Nach einem Ampelsystem kategorisiert:
     - 🔴 **Rot**: Kritische Klausel, ablehnen oder grundlegend überarbeiten
     - 🟡 **Gelb**: Verhandelbare Klausel, Anpassungen erforderlich
     - 🟢 **Grün**: Akzeptable Klausel
3. **Alternativvorschläge**: Für kritische oder verhandelbare Klauseln werden bessere Formulierungen vorgeschlagen.
4. **Optimierung**: Der Benutzer kann eigene Formulierungen eingeben und mit KI optimieren lassen.

## Wissensbasis

Die Wissensbasis besteht aus:

- Juristischen Analysen des deutschen und österreichischen Vertragsrechts
- Regeln für die Bewertung von Klauseln, kategorisiert nach Schweregrad
- Gerichtsentscheidungen und Expertenmeinungen

## Installation

```bash
# Repository klonen
git clone https://github.com/username/vertragsanalyse.git
cd vertragsanalyse

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen einrichten
cp .env.example .env.local
# Dann .env.local bearbeiten und API-Schlüssel eintragen

# Entwicklungsserver starten
npm run dev
```

## Umgebungsvariablen

Folgende Umgebungsvariablen werden benötigt:

```
GOOGLE_API_KEY=your-google-api-key
OPENAI_API_KEY=your-openai-key
CONVEX_DEPLOYMENT=your-convex-deployment-url
```

Die `GOOGLE_API_KEY` wird für die Gemini-Embeddings verwendet, während die `OPENAI_API_KEY` weiterhin in den Frontend-API-Routen für die Vertragsstrukturierung und -analyse genutzt wird.

## Aktuelle KI-Modell-Konfiguration und Prototyping-Hinweise (Stand: Entwicklung Stufe 0)

Dieser Abschnitt dokumentiert die aktuelle Konfiguration der KI-Modelle und die Strategien zur Handhabung von API-Limits während der Prototyping-Phase. Ziel ist es, später auf robustere Lösungen (z.B. Google Cloud Vertex AI) umzusteigen.

### 1. Embedding-Modell (für Wissensdatenbank & Klausel-Vektorisierung)

- **Modell:** Google Gemini API `models/text-embedding-004`
- **API-Schlüssel:** `GOOGLE_API_KEY` (aus `.env` / Convex Umgebungsvariablen)
- **Begründung:** Nutzung der kostenlosen Stufe für initiales Prototyping und Befüllung der Wissensdatenbank.
- **Bekannte Limits (Hard):**
    - Eingabe-Token-Limit pro Text: 2.048 Tokens.
    - Ausgabe-Dimension: 768.
    - API-Ratenbegrenzungen (RPM/RPD): Die genauen Limits der kostenlosen Stufe sind nicht explizit dokumentiert und müssen im Auge behalten werden.
- **Implementierte Gegenmaßnahmen / Strategien:**
    - **Batching & Delay:** Die Convex Action `getEmbeddings` in `convex/knowledgeBase.ts` teilt Anfragen in Sub-Batches auf (`MAX_TEXTS_PER_EMBEDDING_BATCH`, Standard: 100 Texte) und fügt eine konfigurierbare Verzögerung (`DELAY_BETWEEN_EMBEDDING_BATCHES_MS`, Standard: 1000ms) zwischen den Batches ein, um Ratenlimits nicht zu überschreiten.
    - **Token-Warnung:** Eine grobe Schätzung der Zeichenlänge (`MAX_CHARS_PER_TEXT_CHUNK`) warnt in der Konsole, wenn einzelne Texte das 2048-Token-Limit überschreiten könnten. *Hinweis: Die Texte sollten idealerweise vorab passend aufbereitet/gekürzt werden.*
    - **Retry-Mechanismus:** API-Aufrufe nutzen die Hilfsfunktion `fetchWithRetry` (siehe unten).
- **Zukünftige Umstellung:** Für den Produktiveinsatz und zur Aufhebung der Limitierungen ist eine Migration zu Google Cloud Vertex AI Embeddings geplant.

### 2. Textgenerierungs- / Analyse-Modelle (für Strukturierung, Klauselanalyse, etc.)

- **Geplantes Modell (ab Stufe 1 des Gesamtplans):** Google Gemini API `gemini-2.0-flash-001` (oder Nachfolger)
- **API-Schlüssel:** `GOOGLE_API_KEY` (aus `.env` / Convex Umgebungsvariablen)
- **Begründung:** Gutes Verhältnis von Kosten, Geschwindigkeit und Leistung für komplexe Textaufgaben.
- **Bekannte Limits (Hard):**
    - Anfragen pro Minute (RPM): 15
    - Tokens pro Minute (TPM): 1.000.000
    - Anfragen pro Tag (RPD): 1.500
    - Eingabe-Token-Limit: 1.048.576
    - Ausgabe-Token-Limit: 8.192
- **Implementierte/Geplante Gegenmaßnahmen / Strategien:**
    - **Retry-Mechanismus:** Alle API-Aufrufe an dieses Modell sollen die Hilfsfunktion `fetchWithRetry` (siehe unten) verwenden.
    - **Prompt Engineering:** Sorgfältige Gestaltung der System-Prompts, um die KI anzuweisen, innerhalb der Ausgabe-Token-Limits zu bleiben und präzise Antworten zu generieren.
    - **Eingabe-Management:** Die Logik, die Kontext und Anfragen für die KI zusammenstellt, muss das hohe Eingabe-Token-Limit im Auge behalten, aber auch auf Effizienz achten.
    - **Monitoring:** Die API-Nutzung sollte über das Google Cloud Dashboard überwacht werden, um die Einhaltung der RPD/TPM-Limits sicherzustellen.
    - **"Weiche Grenzen":** Als Designprinzip sollte versucht werden, nicht ständig an den harten Limits zu operieren, sondern einen Puffer einzuplanen. Dies wird primär durch das Anwendungsdesign und die Frequenz der Funktionsaufrufe gesteuert.
- **Zukünftige Umstellung:** Für höhere Skalierbarkeit und ggf. Finetuning-Möglichkeiten ist eine Migration zu Google Cloud Vertex AI für diese Modelle ebenfalls eine Option.

### 3. Hilfsfunktion: `fetchWithRetry`

- **Standort:** `convex/utils/llmUtils.ts`
- **Zweck:** Stellt eine robuste Methode für API-Aufrufe bereit, die automatisch Wiederholungsversuche bei bestimmten transienten Fehlern durchführt.
- **Funktionsweise:**
    - Führt einen `fetch`-Aufruf aus.
    - Bei HTTP-Statuscodes wie `429` (Too Many Requests), `500`, `502`, `503`, `504` oder bei Netzwerkfehlern wird ein Wiederholungsversuch gestartet.
    - Nutzt exponentiellen Backoff zwischen den Versuchen (beginnend mit `INITIAL_BACKOFF_MS`, maximal `MAX_BACKOFF_MS`).
    - Fügt einen "Jitter" (zufällige Zeitabweichung) hinzu, um gleichzeitige Retries zu vermeiden.
    - Führt maximal `MAX_RETRIES` Wiederholungsversuche durch.
    - Loggt Versuche, Fehler und Wartezeiten in der Konsole.
- **Verwendung:** Diese Funktion wird aktuell von `convex/knowledgeBase.ts` für Embedding-Aufrufe genutzt und sollte für alle zukünftigen KI-Modellaufrufe verwendet werden.

## Weiterentwicklung

Geplante Erweiterungen:

- Integration weiterer Rechtsordnungen (Schweiz, EU-Recht)
- Verbesserung der Analysekonsistenz durch Finetuning der KI-Modelle
- Umfassendere Vertragsmanagement-Funktionen
- Exportmöglichkeiten für die Analysen
- Kollaborative Bearbeitung von Verträgen

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe die LICENSE.md Datei für Details.
