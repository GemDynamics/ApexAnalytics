# BauVertragsanalyse API

Eine API für die Simulation von Bauvertragsverhandlungen, mit der Bauunternehmer ihre Verhandlungsstrategien testen und verbessern können.

## Funktionen

- Verwaltung von Bauverträgen und Klauseln
- Vorbereitung von Verhandlungsstrategien
- Simulation von Verhandlungen mit einem KI-Bauherrn
- Detailliertes Feedback zu abgeschlossenen Simulationen

## Technologien

- TypeScript
- Express.js
- MongoDB/Mongoose
- OpenAI-API für KI-Antworten

## Installation

1. Repository klonen
2. Abhängigkeiten installieren:
   ```
   npm install
   ```
3. `.env`-Datei im Hauptverzeichnis erstellen:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/bauVertragsanalyse
   OPENAI_API_KEY=your_openai_api_key
   ```
4. Entwicklungsserver starten:
   ```
   npm run dev
   ```

## API-Dokumentation

Die vollständige API-Dokumentation ist nach dem Start des Servers verfügbar unter:
```
http://localhost:3000/api-docs
```

### Wichtige Endpunkte

#### Verträge

- `GET /api/v1/vertraege` - Alle Verträge abrufen
- `GET /api/v1/vertraege/:id` - Einen Vertrag abrufen
- `POST /api/v1/vertraege` - Neuen Vertrag erstellen
- `PUT /api/v1/vertraege/:id` - Vertrag aktualisieren
- `DELETE /api/v1/vertraege/:id` - Vertrag löschen

#### Vorbereitungen

- `GET /api/v1/vorbereitungen/:vertragId` - Vorbereitung abrufen
- `POST /api/v1/vorbereitungen` - Vorbereitung speichern
- `DELETE /api/v1/vorbereitungen/:vertragId` - Vorbereitung löschen

#### Simulationen

- `POST /api/v1/simulationen/start/:vertragId` - Simulation starten
- `POST /api/v1/simulationen/:id/nachricht` - Nachricht senden
- `POST /api/v1/simulationen/:id/beenden` - Simulation beenden
- `GET /api/v1/simulationen/:id` - Simulation abrufen

#### Feedback

- `GET /api/v1/feedback/:simulationId` - Feedback abrufen
- `POST /api/v1/feedback/:simulationId/generate` - Feedback generieren

## Projekthintergrund

Die BauVertragsanalyse-Anwendung wurde entwickelt, um Bauunternehmen bei der Vorbereitung und Durchführung von Vertragsverhandlungen zu unterstützen. Durch die Simulation von Verhandlungsgesprächen mit einem auf Bauverträge spezialisierten KI-Bauherrn können Verhandlungsstrategien getestet und verbessert werden.
