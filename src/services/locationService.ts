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

const LOCATION_TIMEOUT_MS = 10000;

export const getCurrentLocation = async (): Promise<Coordinates> => {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) throw new LocationPermissionDeniedError();

  // Race location fetch against a timeout to avoid hanging indefinitely
  const locationPromise = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new LocationUnavailableError()), LOCATION_TIMEOUT_MS)
  );

  let location: Location.LocationObject;
  try {
    location = await Promise.race([locationPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof LocationUnavailableError) throw error;
    throw new LocationUnavailableError();
  }

  const { latitude, longitude } = location.coords;
  if (latitude == null || longitude == null) throw new LocationUnavailableError();

  return { latitude, longitude };
};

export const getAddressFromCoords = async (coords: Coordinates): Promise<string> => {
  const { latitude, longitude } = coords;
  const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  let results: Location.LocationGeocodedAddress[];
  try {
    results = await Location.reverseGeocodeAsync({ latitude, longitude });
  } catch {
    return fallback;
  }

  if (!results?.length) return fallback;

  const place = results[0];
  const parts = [
    place.name,
    place.street,
    place.city,
    place.region,
    place.country,
  ].filter((p): p is string => Boolean(p?.trim()));

  // Deduplicate consecutive identical parts
  const deduped = parts.filter((p, i) => p !== parts[i - 1]);

  return deduped.length > 0 ? deduped.join(', ') : fallback;
};

export const getCurrentAddress = async (): Promise<string> => {
  const coords = await getCurrentLocation();
  return getAddressFromCoords(coords);
};