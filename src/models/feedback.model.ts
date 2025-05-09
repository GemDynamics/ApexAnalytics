import mongoose, { Document, Schema } from 'mongoose';
import { VerhandlungsFeedback, Bewertungspunkt } from '../types/feedback';

// Mongoose-Schema-Typen
export interface BewertungspunktDocument extends Omit<Bewertungspunkt, 'id'>, Document {}
export interface FeedbackDocument extends Omit<VerhandlungsFeedback, 'id' | 'stärken' | 'verbesserungsPotenzial' | 'emotionaleIntelligenz'>, Document {
  stärken: BewertungspunktDocument[];
  verbesserungsPotenzial: BewertungspunktDocument[];
  emotionaleIntelligenz: BewertungspunktDocument[];
}

// Schemas
const BewertungspunktSchema = new Schema({
  text: { type: String, required: true },
  gewichtung: { type: Number, min: 1, max: 5, default: 3 },
  kategorie: {
    type: String,
    enum: ['stärke', 'verbesserung', 'emotionaleIntelligenz'],
    required: true
  }
});

const FeedbackSchema = new Schema({
  simulationId: {
    type: Schema.Types.ObjectId,
    ref: 'Simulation',
    required: true,
    index: true
  },
  erstelltAm: { type: Date, default: Date.now },
  gesamtBewertung: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  stärken: [BewertungspunktSchema],
  verbesserungsPotenzial: [BewertungspunktSchema],
  emotionaleIntelligenz: [BewertungspunktSchema],
  tippsNächsteVerhandlung: { type: String, required: true },
  nächsteÜbungEmpfohlenIn: { type: Number, default: 3 }
}, { timestamps: true });

// Virtuals
FeedbackSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

BewertungspunktSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// JSON Serialisierung
FeedbackSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

// Modell exportieren
export const FeedbackModel = mongoose.models.VerhandlungsFeedback ||
  mongoose.model<FeedbackDocument>('VerhandlungsFeedback', FeedbackSchema); 