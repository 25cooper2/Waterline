import mongoose from 'mongoose';

const logbookSchema = new mongoose.Schema({
  boatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boat', required: true },
  entryDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  startLocation: { type: String, default: null },
  endLocation: { type: String, default: null },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  distance: { type: Number, default: null },
  locks: { type: Number, default: null },
  weather: { type: String, default: null },
  conditions: { type: String, default: null },
  fuelUsed: { type: Number, default: null },
  notes: { type: String, default: null },
  highlights: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

logbookSchema.index({ boatId: 1, entryDate: -1 });

export default mongoose.model('Logbook', logbookSchema);
