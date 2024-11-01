import { Document } from 'mongoose';

export interface RouteInfo {
  placeName: string;
  location: string;
  departureTime: string;
  actualTime: string;
}

export interface BusRoute extends Document {
  from: string;
  to: string;
  busType: string;
  busNumber: number;
  busDepot: string;
  busStatus: string;
  busRoute: mongoose.Schema.Types.ObjectId[];
  routeInfo: [];
  createdAt: Date;
}
