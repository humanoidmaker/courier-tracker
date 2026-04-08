export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface TrackingEvent {
  status: string;
  timestamp: string;
  location: string;
  notes: string;
}

export interface Charges {
  base_charge: number;
  weight_charge: number;
  distance_charge: number;
  priority_surcharge: number;
  subtotal: number;
  gst: number;
  total: number;
}

export interface Parcel {
  _id: string;
  tracking_number: string;
  sender: { name: string; phone: string; address: string };
  receiver: { name: string; phone: string; address: string };
  weight_kg: number;
  description: string;
  priority: string;
  distance_km: number;
  charges: Charges;
  status: string;
  driver_id: string | null;
  driver?: { name: string; phone: string; vehicle_number: string };
  proof_of_delivery: {
    receiver_name: string;
    signature: string;
    photo: string;
    timestamp: string;
  } | null;
  tracking_events: TrackingEvent[];
  created_at: string;
  updated_at: string;
}

export interface Driver {
  _id: string;
  name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  vehicle_number: string;
  is_active: boolean;
  current_parcels_count: number;
  assigned_parcels?: Parcel[];
  created_at: string;
  updated_at: string;
}

export interface Settings {
  [key: string]: string;
}
