import mongoose, { Document, Schema } from 'mongoose';
import { Simulation, ChatNachricht, SimulationsFortschritt } from '../types/simulation';

// Mongoose-Schema-Typen
export interface ChatNachrichtDocument extends Omit<ChatNachricht, 'id'>, Document {}
export interface SimulationDocument extends Omit<Simulation, 'id' | 'nachrichten'>, Document {
  nachrichten: ChatNachrichtDocument[];
}

// Schemas
const SimulationsFortschrittSchema = new Schema({
  behandelteKlauseln: [{ type: Schema.Types.ObjectId, ref: 'Klausel' }],
  offeneKlauseln: [{ type: Schema.Types.ObjectId, ref: 'Klausel' }],
  aktuelleKlausel: { type: Schema.Types.ObjectId, ref: 'Klausel' }
}, { _id: false });

const ChatNachrichtSchema = new Schema({
  absender: {
    type: String,
    enum: ['bauherr', 'bauunternehmer'],
    required: true
  },
  inhalt: { type: String, required: true },
  zeitstempel: { type: Date, default: Date.now },
  bezugKlauselId: { type: Schema.Types.ObjectId, ref: 'Klausel' }
});

const SimulationSchema = new Schema({
  vertragId: {
    type: Schema.Types.ObjectId,
    ref: 'Vertrag',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['vorbereitet', 'aktiv', 'beendet'],
    default: 'vorbereitet'
  },
  startZeit: { type: Date, default: Date.now },
  endeZeit: { type: Date },
  nachrichten: [ChatNachrichtSchema],
  aktiverKlauselIndex: { type: Schema.Types.ObjectId, ref: 'Klausel' },
  fortschritt: {
    type: SimulationsFortschrittSchema,
    default: {
      behandelteKlauseln: [],
      offeneKlauseln: [],
      aktuelleKlausel: null
    }
  }
}, { timestamps: true });

// Virtuals
SimulationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

ChatNachrichtSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// JSON Serialisierung
SimulationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

// Modell exportieren
export const SimulationModel = mongoose.models.Simulation ||
  mongoose.model<SimulationDocument>('Simulation', SimulationSchema); 