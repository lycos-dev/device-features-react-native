import * as ImagePicker from 'expo-image-picker';

export interface CameraResult {
  uri: string;
}

export class CameraPermissionDeniedError extends Error {
  constructor() {
    super('Camera permission was denied. Please enable it in your device settings.');
    this.name = 'CameraPermissionDeniedError';
  }
}

export class CameraCancelledError extends Error {
  constructor() {
    super('Camera action was cancelled by the user.');
    this.name = 'CameraCancelledError';
  }
}

export const openCamera = async (): Promise<CameraResult> => {
  let permissionResult: ImagePicker.CameraPermissionResponse;

  try {
    permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  } catch {
    throw new Error('Failed to request camera permissions.');
  }

  if (permissionResult.status !== 'granted') {
    throw new CameraPermissionDeniedError();
  }

  let result: ImagePicker.ImagePickerResult;

  try {
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Native crop editor has iOS overflow bugs — skip it
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