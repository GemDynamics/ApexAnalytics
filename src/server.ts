import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './api/routes';
import swaggerUiRoutes from './api/swagger-ui';
import { errorHandler } from './api/middleware/error-handler';
import { requestLogger } from './api/middleware/request-logger';
import { connectToDatabase } from './lib/db';

// Umgebungsvariablen laden
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Swagger UI
app.use(swaggerUiRoutes);

// API-Routen
app.use(routes);

// Error-Handler
app.use(errorHandler);

// Server starten
app.listen(PORT, async () => {
  // Verbindung zur Datenbank herstellen
  await connectToDatabase();
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`API-Dokumentation verfügbar unter: http://localhost:${PORT}/api-docs`);
});

// Für Tests exportieren
export default app; 