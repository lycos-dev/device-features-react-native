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
  // Always call request — iOS/Android will:
  // - Show the system prompt if not yet asked
  // - Return immediately if already granted
  // - Return 'denied' if permanently denied (no prompt shown)
  const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();

  if (status === 'granted') return true;

  if (!canAskAgain) {
    // Permanently denied — guide to Settings
    Alert.alert(
      'Camera Access Denied',
      'Please enable camera access in your device Settings to take photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          style: 'default',
          onPress: () => Linking.openSettings(),
        },
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

  return { uri: asset.uri };
};