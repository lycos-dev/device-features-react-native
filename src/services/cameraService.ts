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
  // Check current permission status before launching
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    throw new CameraPermissionDeniedError();
  }

  let result: ImagePicker.ImagePickerResult;

  try {
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
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

  if (!asset?.uri) {
    throw new Error('No image was returned from the camera.');
  }

  return { uri: asset.uri };
};