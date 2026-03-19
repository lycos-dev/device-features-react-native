import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export class LocationPermissionDeniedError extends Error {
  constructor() {
    super('Location permission was denied. Please enable it in your device settings.');
    this.name = 'LocationPermissionDeniedError';
  }
}

export class LocationUnavailableError extends Error {
  constructor() {
    super('Unable to retrieve your current location. Please try again.');
    this.name = 'LocationUnavailableError';
  }
}

export const getCurrentLocation = async (): Promise<Coordinates> => {
  const { granted } = await Location.requestForegroundPermissionsAsync();

  if (!granted) {
    throw new LocationPermissionDeniedError();
  }

  let location: Location.LocationObject;

  try {
    location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (error) {
    throw new LocationUnavailableError();
  }

  const { latitude, longitude } = location.coords;

  if (!latitude || !longitude) {
    throw new LocationUnavailableError();
  }

  return { latitude, longitude };
};

export const getAddressFromCoords = async (coords: Coordinates): Promise<string> => {
  const { latitude, longitude } = coords;

  let results: Location.LocationGeocodedAddress[];

  try {
    results = await Location.reverseGeocodeAsync({ latitude, longitude });
  } catch (error) {
    throw new Error(
      `Reverse geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  if (!results || results.length === 0) {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }

  const place = results[0];

  // Build a clean, human-readable address from available fields
  const parts: string[] = [
    place.name,
    place.street,
    place.city,
    place.region,
    place.country,
  ].filter((part): part is string => Boolean(part && part.trim()));

  // Deduplicate consecutive identical parts (e.g. city === name)
  const deduplicated = parts.filter((part, index) => part !== parts[index - 1]);

  return deduplicated.length > 0
    ? deduplicated.join(', ')
    : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};

export const getCurrentAddress = async (): Promise<string> => {
  const coords = await getCurrentLocation();
  return getAddressFromCoords(coords);
};