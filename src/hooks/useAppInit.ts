import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

import { requestPermission } from '../services/notificationService';

export interface AppInitState {
  isReady: boolean;
  initError: string | null;
}

export const useAppInit = (): AppInitState => {
  const [state, setState] = useState<AppInitState>({
    isReady: false,
    initError: null,
  });

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Only request notification permission on startup.
        // Camera and location are requested contextually when the user
        // actually taps the camera button — not here.
        await requestPermission();

        // Set up Android notification channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('travel-diary', {
            name: 'Travel Diary',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        // Notification listeners
        notificationListener.current =
          Notifications.addNotificationReceivedListener(notification => {
            console.log('[AppInit] Notification received:', notification.request.identifier);
          });

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener(response => {
            console.log('[AppInit] Notification tapped:', response.notification.request.identifier);
          });

        if (mounted) {
          setState({ isReady: true, initError: null });
        }
      } catch (error) {
        console.error('[AppInit] Initialization error:', error);
        if (mounted) {
          setState({
            isReady: true,
            initError: error instanceof Error ? error.message : 'Initialization failed.',
          });
        }
      }
    };

    init();

    // Re-check notification permission when app returns to foreground
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
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