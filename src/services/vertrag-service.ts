import { VertragModel } from '../models/vertrag.model';
import { Vertrag, Klausel } from '../types/vertrag';
import { connectToDatabase, generateId, isValidObjectId, toObjectId } from '../lib/db';

/**
 * Service zur Verwaltung von Verträgen und Klauseln
 */
export class VertragService {
  /**
   * Gibt einen Vertrag anhand seiner ID zurück
   */
  static async getVertragById(id: string): Promise<Vertrag | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    
    await connectToDatabase();
    const vertrag = await VertragModel.findById(id);
    return vertrag ? vertrag.toJSON() as Vertrag : null;
  }

  /**
   * Gibt alle Verträge zurück
   */
  static async getAllVertraege(): Promise<Vertrag[]> {
    await connectToDatabase();
    const vertraege = await VertragModel.find().sort({ erstelltAm: -1 });
    return vertraege.map(vertrag => vertrag.toJSON() as Vertrag);
  }

  /**
   * Erstellt einen neuen Vertrag
   */
  static async createVertrag(vertragData: Partial<Vertrag>): Promise<Vertrag> {
    await connectToDatabase();
    const vertrag = await VertragModel.create(vertragData);
    return vertrag.toJSON() as Vertrag;
  }

  /**
   * Aktualisiert einen Vertrag
   */
  static async updateVertrag(id: string, updates: Partial<Vertrag>): Promise<Vertrag | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    
    await connectToDatabase();
    const vertrag = await VertragModel.findByIdAndUpdate(
      id, 
      { ...updates }, 
      { new: true }
    );
    
    return vertrag ? vertrag.toJSON() as Vertrag : null;
  }

  /**
   * Löscht einen Vertrag
   */
  static async deleteVertrag(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) {
      return false;
    }
    
    await connectToDatabase();
    const result = await VertragModel.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Gibt eine Klausel eines Vertrags zurück
   */
  static async getKlausel(vertragId: string, klauselId: string): Promise<Klausel | null> {
    if (!isValidObjectId(vertragId) || !isValidObjectId(klauselId)) {
      return null;
    }
    
    await connectToDatabase();
    const vertrag = await VertragModel.findById(vertragId);
    
    if (!vertrag) {
      return null;
    }
    
    const klausel = vertrag.klauseln.id(klauselId);
    return klausel ? klausel.toJSON() as Klausel : null;
  }

  /**
   * Aktualisiert eine Klausel eines Vertrags
   */
  static async updateKlausel(
    vertragId: string, 
    klauselId: string, 
    updates: Partial<Klausel>
  ): Promise<Klausel | null> {
    if (!isValidObjectId(vertragId) || !isValidObjectId(klauselId)) {
      return null;
    }
    
    await connectToDatabase();
    const vertrag = await VertragModel.findById(vertragId);
    
    if (!vertrag) {
      return null;
    }
    
    const klausel = vertrag.klauseln.id(klauselId);
    
    if (!klausel) {
      return null;
    }
    
    // Aktualisiere die Klausel
    Object.assign(klausel, updates);
    await vertrag.save();
    
    return klausel.toJSON() as Klausel;
  }

  /**
   * Fügt eine neue Klausel zu einem Vertrag hinzu
   */
  static async addKlausel(vertragId: string, klausel: Partial<Klausel>): Promise<Klausel | null> {
    if (!isValidObjectId(vertragId)) {
      return null;
    }
    
    await connectToDatabase();
    const vertrag = await VertragModel.findById(vertragId);
    
    if (!vertrag) {
      return null;
    }
    
    // Neue Klausel erstellen
    vertrag.klauseln.push(klausel as any);
    await vertrag.save();
    
    const neueKlausel = vertrag.klauseln[vertrag.klauseln.length - 1];
    return neueKlausel.toJSON() as Klausel;
  }

  /**
   * Entfernt eine Klausel aus einem Vertrag
   */
  static async removeKlausel(vertragId: string, klauselId: string): Promise<boolean> {
    if (!isValidObjectId(vertragId) || !isValidObjectId(klauselId)) {
      return false;
    }
    
    await connectToDatabase();
    const vertrag = await VertragModel.findById(vertragId);
    
    if (!vertrag) {
      return false;
    }
    
    const klausel = vertrag.klauseln.id(klauselId);
    
    if (!klausel) {
      return false;
    }
    
    // Klausel entfernen
    klausel.deleteOne();
    await vertrag.save();
    
    return true;
  }
} 