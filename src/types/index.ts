export interface TravelEntry {
  id: string;
  imageUri: string;
  address: string;
  createdAt: string;
  latitude?: number;
  longitude?: number;
  description?: string;
}