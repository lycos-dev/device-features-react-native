import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

export interface CameraResult {
  uri: string;
}

export class CameraPermissionDeniedError extends Error {
  constructor() {
    super('Camera permission was denied.');
    this.name = 'CameraPermissionDeniedError';
  }
}

export class CameraCancelledError extends Error {
  constructor() {
    super('Camera action was cancelled by the user.');
    this.name = 'CameraCancelledError';
  }
}

export const ensureCameraPermission = async (): Promise<boolean> => {
  const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();

  if (status === 'granted') return true;

  if (!canAskAgain) {
    Alert.alert(
      'Camera Access Denied',
      'Please enable camera access in your device Settings to take photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', style: 'default', onPress: () => Linking.openSettings() },
      ]
    );
  }

  return false;
};

export const openCamera = async (): Promise<CameraResult> => {
  let result: ImagePicker.ImagePickerResult;

  try {
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
      exif: true,
    });
  } catch (error) {
    throw new Error(
      `Failed to launch camera: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  if (result.canceled) {
    throw new CameraCancelledError();
  }

  const asset = result.assets?.[0];

  if (!asset?.uri || asset.uri.trim() === '') {
    throw new Error('No image was returned from the camera. Please try again.');
  }

  const { uri, width, height, exif } = asset;

  // ── Rotation fix ───────────────────────────────────────────────────────────
  // EXIF orientation tells us how the camera was physically held.
  // Orientation 6 = 90° clockwise (phone held landscape-right)
  // Orientation 8 = 90° counter-clockwise (phone held landscape-left)
  // Orientation 3 = 180° (phone held upside down)
  // We rotate the image to correct it back to upright portrait.
  const orientation = exif?.Orientation ?? exif?.orientation;

  let rotation = 0;
  if (orientation === 6) rotation = 90;
  else if (orientation === 8) rotation = -90;
  else if (orientation === 3) rotation = 180;

  // Also catch cases where EXIF is missing but dimensions reveal landscape
  const isLandscape = width && height && width > height;
  if (rotation === 0 && isLandscape) rotation = 90;

  if (rotation !== 0) {
    const rotated = await ImageManipulator.manipulateAsync(
      uri,
      [{ rotate: rotation }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );
    return { uri: rotated.uri };
  }

  return { uri };
};