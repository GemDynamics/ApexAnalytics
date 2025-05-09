import { VorbereitungModel } from '../models/vorbereitung.model';
import { VerhandlungsVorbereitung, KlauselStrategie } from '../types/vertrag';
import { connectToDatabase, generateId, isValidObjectId, toObjectId } from '../lib/db';

/**
 * Service zur Verwaltung von Verhandlungsvorbereitungen
 */
export class VorbereitungService {
  /**
   * Gibt eine Verhandlungsvorbereitung anhand der Vertrags-ID zurück
   */
  static async getVorbereitungByVertragId(vertragId: string): Promise<VerhandlungsVorbereitung | null> {
    if (!isValidObjectId(vertragId)) {
      return null;
    }
    
    await connectToDatabase();
    const vorbereitung = await VorbereitungModel.findOne({ vertragId: toObjectId(vertragId) });
    return vorbereitung ? vorbereitung.toJSON() as VerhandlungsVorbereitung : null;
  }

  /**
   * Speichert oder aktualisiert eine Verhandlungsvorbereitung
   */
  static async saveVorbereitung(vorbereitungData: Partial<VerhandlungsVorbereitung>): Promise<VerhandlungsVorbereitung> {
    const { vertragId } = vorbereitungData;
    
    if (!vertragId || !isValidObjectId(vertragId)) {
      throw new Error('Vertrags-ID ist ungültig oder fehlt');
    }
    
    await connectToDatabase();
    
    // Prüfe, ob bereits eine Vorbereitung existiert
    const existingVorbereitung = await VorbereitungModel.findOne({ 
      vertragId: toObjectId(vertragId.toString()) 
    });
    
    if (existingVorbereitung) {
      // Update bestehende Vorbereitung
      Object.assign(existingVorbereitung, vorbereitungData);
      await existingVorbereitung.save();
      return existingVorbereitung.toJSON() as VerhandlungsVorbereitung;
    } else {
      // Neue Vorbereitung erstellen
      const neueVorbereitung = await VorbereitungModel.create(vorbereitungData);
      return neueVorbereitung.toJSON() as VerhandlungsVorbereitung;
    }
  }

  /**
   * Speichert oder aktualisiert die Strategie für eine Klausel
   */
  static async saveKlauselStrategie(
    vertragId: string,
    klauselId: string,
    strategie: Partial<KlauselStrategie>
  ): Promise<KlauselStrategie | null> {
    if (!isValidObjectId(vertragId) || !isValidObjectId(klauselId)) {
      return null;
    }
    
    await connectToDatabase();
    
    // Hole die Vorbereitung 
    let vorbereitung = await VorbereitungModel.findOne({ 
      vertragId: toObjectId(vertragId) 
    });
    
    // Wenn keine Vorbereitung existiert, erstelle eine neue
    if (!vorbereitung) {
      vorbereitung = await VorbereitungModel.create({
        vertragId: toObjectId(vertragId),
        globaleZiele: '',
        nichtVerhandelbarePunkte: '',
        klauselStrategien: []
      });
    }
    
    // Finde den Index der Strategie in der klauselStrategien-Array
    const existingIndex = vorbereitung.klauselStrategien.findIndex(
      (s: { klauselId: { toString: () => string } }) => s.klauselId.toString() === klauselId
    );
    
    if (existingIndex >= 0) {
      // Update bestehende Strategie
      Object.assign(vorbereitung.klauselStrategien[existingIndex], strategie);
    } else {
      // Füge neue Strategie hinzu
      vorbereitung.klauselStrategien.push({
        klauselId: toObjectId(klauselId),
        argumente: strategie.argumente || '',
        strategie: strategie.strategie || ''
      } as any);
    }
    
    await vorbereitung.save();
    
    // Finde die aktualisierte/neue Strategie in der Vorbereitung
    const aktualisiertaVorbereitung = await VorbereitungModel.findOne({ 
      vertragId: toObjectId(vertragId) 
    });
    
    if (!aktualisiertaVorbereitung) {
      return null;
    }
    
    const aktualisiertaStrategie = aktualisiertaVorbereitung.klauselStrategien.find(
      (s: { klauselId: { toString: () => string } }) => s.klauselId.toString() === klauselId
    );
    
    return aktualisiertaStrategie ? aktualisiertaStrategie.toJSON() as KlauselStrategie : null;
  }

  /**
   * Gibt die Strategie für eine Klausel zurück
   */
  static async getKlauselStrategie(
    vertragId: string,
    klauselId: string
  ): Promise<KlauselStrategie | null> {
    if (!isValidObjectId(vertragId) || !isValidObjectId(klauselId)) {
      return null;
    }
    
    await connectToDatabase();
    
    const vorbereitung = await VorbereitungModel.findOne({ 
      vertragId: toObjectId(vertragId) 
    });
    
    if (!vorbereitung) {
      return null;
    }
    
    const strategie = vorbereitung.klauselStrategien.find(
      (s: { klauselId: { toString: () => string } }) => s.klauselId.toString() === klauselId
    );
    
    return strategie ? strategie.toJSON() as KlauselStrategie : null;
  }

  /**
   * Löscht eine Verhandlungsvorbereitung
   */
  static async deleteVorbereitung(vertragId: string): Promise<boolean> {
    if (!isValidObjectId(vertragId)) {
      return false;
    }
    
    await connectToDatabase();
    const result = await VorbereitungModel.findOneAndDelete({ 
      vertragId: toObjectId(vertragId) 
    });
    
    return !!result;
  }
} 