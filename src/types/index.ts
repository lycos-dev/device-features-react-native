export interface TravelEntry {
  id: string;       // Unique identifier (UUID)
  imageUri: string; // Local URI from camera/gallery
  address: string;  // Human-readable address from GPS
  createdAt: string;// ISO 8601 timestamp string
}