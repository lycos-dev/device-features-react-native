import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionStatuses {
  camera: PermissionStatus;
  location: PermissionStatus;
  notification: PermissionStatus;
}

export interface UsePermissionsReturn {
  statuses: PermissionStatuses;
  requestCameraPermission: () => Promise<boolean>;
  requestLocationPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
  requestAllPermissions: () => Promise<boolean>;
}

// ... full implementation with useEffect, useCallback, useState