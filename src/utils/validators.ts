import { Alert } from 'react-native';

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

// ─── Individual validators ────────────────────────────────────────────────────

export const validateImage = (imageUri: string | null | undefined): ValidationResult => {
  if (!imageUri || imageUri.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'A photo is required. Please take a photo before saving.',
    };
  }

  const isValidUri =
    imageUri.startsWith('file://') ||
    imageUri.startsWith('content://') ||
    imageUri.startsWith('ph://') ||
    imageUri.startsWith('http://') ||
    imageUri.startsWith('https://');

  if (!isValidUri) {
    return {
      isValid: false,
      errorMessage: 'The selected image appears to be invalid. Please retake the photo.',
    };
  }

  return { isValid: true, errorMessage: null };
};

export const validateAddress = (address: string | null | undefined): ValidationResult => {
  if (!address || address.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'A location is required. Please allow location access and retake the photo.',
    };
  }

  if (address.trim().length < 3) {
    return {
      isValid: false,
      errorMessage: 'The address seems too short. Please try again.',
    };
  }

  return { isValid: true, errorMessage: null };
};

// ─── Combined validator ───────────────────────────────────────────────────────

export interface EntryValidationResult {
  isValid: boolean;
  errors: {
    image: ValidationResult;
    address: ValidationResult;
  };
}

export const validateEntry = (
  imageUri: string | null | undefined,
  address: string | null | undefined
): EntryValidationResult => {
  const image = validateImage(imageUri);
  const addressResult = validateAddress(address);

  return {
    isValid: image.isValid && addressResult.isValid,
    errors: {
      image,
      address: addressResult,
    },
  };
};

// ─── Alert helpers ────────────────────────────────────────────────────────────

export const showValidationAlert = (title: string, message: string): void => {
  Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
};

export const validateImageWithAlert = (imageUri: string | null | undefined): boolean => {
  const result = validateImage(imageUri);
  if (!result.isValid && result.errorMessage) {
    showValidationAlert('Photo Required', result.errorMessage);
  }
  return result.isValid;
};

export const validateAddressWithAlert = (address: string | null | undefined): boolean => {
  const result = validateAddress(address);
  if (!result.isValid && result.errorMessage) {
    showValidationAlert('Location Required', result.errorMessage);
  }
  return result.isValid;
};

export const validateEntryWithAlert = (
  imageUri: string | null | undefined,
  address: string | null | undefined
): boolean => {
  // Show image error first if both fail
  if (!validateImageWithAlert(imageUri)) return false;
  if (!validateAddressWithAlert(address)) return false;
  return true;
};