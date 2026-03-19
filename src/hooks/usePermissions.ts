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

const normalizeStatus = (granted: boolean): PermissionStatus =>
  granted ? 'granted' : 'denied';

export const usePermissions = (): UsePermissionsReturn => {
  const [cameraPermission, requestCamera] = useCameraPermissions();

  const [statuses, setStatuses] = useState<PermissionStatuses>({
    camera: 'undetermined',
    location: 'undetermined',
    notification: 'undetermined',
  });

  // Sync camera permission from Expo hook into local state
  useEffect(() => {
    if (cameraPermission) {
      setStatuses(prev => ({
        ...prev,
        camera: cameraPermission.granted
          ? 'granted'
          : cameraPermission.canAskAgain
          ? 'undetermined'
          : 'denied',
      }));
    }
  }, [cameraPermission]);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const result = await requestCamera();
    const status = normalizeStatus(result.granted);
    setStatuses(prev => ({ ...prev, camera: status }));
    return result.granted;
  }, [requestCamera]);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    setStatuses(prev => ({
      ...prev,
      location: normalizeStatus(granted),
    }));
    return granted;
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    const { granted } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    setStatuses(prev => ({
      ...prev,
      notification: normalizeStatus(granted),
    }));
    return granted;
  }, []);

  const requestAllPermissions = useCallback(async (): Promise<boolean> => {
    const [camera, location, notification] = await Promise.all([
      requestCameraPermission(),
      requestLocationPermission(),
      requestNotificationPermission(),
    ]);
    return camera && location && notification;
  }, [requestCameraPermission, requestLocationPermission, requestNotificationPermission]);

  return {
    statuses,
    requestCameraPermission,
    requestLocationPermission,
    requestNotificationPermission,
    requestAllPermissions,
  };
};
