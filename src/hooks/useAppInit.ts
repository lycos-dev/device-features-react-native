import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

import { requestPermission } from '../services/notificationService';
import { usePermissions } from './usePermissions';

export interface AppInitState {
  isReady: boolean;
  permissionsGranted: boolean;
  initError: string | null;
}

export const useAppInit = (): AppInitState => {
  const { requestAllPermissions } = usePermissions();
  const [state, setState] = useState<AppInitState>({
    isReady: false,
    permissionsGranted: false,
    initError: null,
  });

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // 1. Request all permissions on startup
        const granted = await requestAllPermissions();

        // 2. Set up notification channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('travel-diary', {
            name: 'Travel Diary',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        // 3. Set up notification listeners
        notificationListener.current =
          Notifications.addNotificationReceivedListener(notification => {
            // Notification received while app is foregrounded
            console.log('[AppInit] Notification received:', notification.request.identifier);
          });

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener(response => {
            // User tapped on a notification
            console.log('[AppInit] Notification tapped:', response.notification.request.identifier);
          });

        if (mounted) {
          setState({ isReady: true, permissionsGranted: granted, initError: null });
        }
      } catch (error) {
        console.error('[AppInit] Initialization error:', error);
        if (mounted) {
          setState({
            isReady: true, // Still mark ready so app doesn't hang
            permissionsGranted: false,
            initError: error instanceof Error ? error.message : 'Initialization failed.',
          });
        }
      }
    };

    init();

    // Re-request notification permission when app comes back to foreground
    // (user may have granted it in Settings while app was backgrounded)
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        await requestPermission();
      }
      appStateRef.current = nextState;
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      mounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
      appStateSub.remove();
    };
  }, []);

  return state;
};