import mongoose from 'mongoose';
import { BusRoute } from '../@types/Bus';

const routeSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    busType: { type: String, required: true },
    busNumber: { type: Number, unique: true, required: true },
    busDepot: { type: String, required: true },
    busStatus: { type: String, required: true },
    busRoute: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Place' }],
    routeInfo: [{ type: Object }], // Reference to Place model
  },
  {
    timestamps: true,
  }
);

routeSchema.index({ 'routeInfo.placeName': 1 });

export const Bus = mongoose.model<BusRoute>('Bus', routeSchema);
