import mongoose from 'mongoose';

// Globale Variable für den Verbindungsstatus
let isConnected = false;

/**
 * Stellt eine Verbindung zur MongoDB-Datenbank her
 */
export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI Umgebungsvariable ist nicht definiert');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB verbunden');
  } catch (error) {
    console.error('MongoDB Verbindungsfehler:', error);
    throw error;
  }
}

/**
 * Generiert eine zufällige ID
 */
export function generateId(): string {
  return new mongoose.Types.ObjectId().toString();
}

/**
 * Prüft, ob ein String eine gültige MongoDB ObjectID ist
 */
export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Konvertiert einen String in eine MongoDB ObjectID
 */
export function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
} 