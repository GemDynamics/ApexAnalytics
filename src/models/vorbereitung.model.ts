import mongoose, { Document, Schema } from 'mongoose';
import { VerhandlungsVorbereitung, KlauselStrategie } from '../types/vertrag';

// Mongoose-Schema-Typen
export interface KlauselStrategieDocument extends Omit<KlauselStrategie, 'id'>, Document {}
export interface VorbereitungDocument extends Omit<VerhandlungsVorbereitung, 'id' | 'klauselStrategien'>, Document {
  klauselStrategien: KlauselStrategieDocument[];
}

// Schemas
const KlauselStrategieSchema = new Schema({
  klauselId: { type: Schema.Types.ObjectId, ref: 'Klausel', required: true },
  argumente: { type: String, default: '' },
  strategie: { type: String, default: '' }
});

const VorbereitungSchema = new Schema({
  vertragId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Vertrag', 
    required: true,
    index: true
  },
  globaleZiele: { type: String, default: '' },
  nichtVerhandelbarePunkte: { type: String, default: '' },
  klauselStrategien: [KlauselStrategieSchema]
}, { timestamps: true });

// Virtuals
VorbereitungSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

KlauselStrategieSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// JSON Serialisierung
VorbereitungSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

// Modell exportieren
export const VorbereitungModel = mongoose.models.Vorbereitung || 
  mongoose.model<VorbereitungDocument>('Vorbereitung', VorbereitungSchema); 