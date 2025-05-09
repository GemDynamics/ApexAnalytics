import mongoose, { Document, Schema } from 'mongoose';
import { Vertrag, Klausel, KlauselAnalyse } from '../types/vertrag';

// Definiere die Mongoose-Schema-Typen
export interface KlauselDocument extends KlauselAnalyse, Document {}
export interface VertragDocument extends Omit<Vertrag, 'id' | 'klauseln'>, Document {
  klauseln: KlauselDocument[];
}

// Schemas
const KlauselAnalyseSchema = new Schema({
  begründung: String,
  empfehlung: String,
  problemPunkte: [String]
}, { _id: false });

const KlauselSchema = new Schema({
  chunkNr: Number,
  index: Number,
  titel: String,
  inhalt: String,
  risiko: {
    type: String,
    enum: ['hoch', 'mittel', 'niedrig', 'fehler'],
    default: 'niedrig'
  },
  risikoFarbe: {
    type: String,
    enum: ['rot', 'gelb', 'grün', 'fehler'],
    default: 'grün'
  },
  analyse: {
    type: KlauselAnalyseSchema,
    default: {
      begründung: '',
      empfehlung: '',
      problemPunkte: []
    }
  },
  verhandlungsZiel: { type: String, default: '' }
});

const VertragSchema = new Schema({
  titel: { type: String, required: true },
  status: {
    type: String,
    enum: ['entwurf', 'analysiert', 'verhandelt', 'abgeschlossen'],
    default: 'entwurf'
  },
  erstelltAm: { type: Date, default: Date.now },
  klauseln: [KlauselSchema]
}, { timestamps: true });

// Virtuals
VertragSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

KlauselSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// JSON Serialisierung konfigurieren
VertragSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

// Modell exportieren
export const VertragModel = mongoose.models.Vertrag || 
  mongoose.model<VertragDocument>('Vertrag', VertragSchema); 