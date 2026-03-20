import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

const NOTIF_PREF_KEY = '@travel_diary_notifications_enabled';

// Configure foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Preference storage ───────────────────────────────────────────────────────

export const getNotificationPref = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(NOTIF_PREF_KEY);
    // Default to true if not yet set (first launch handled by promptIfNeeded)
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
};

export const setNotificationPref = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIF_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    console.warn('[NotificationService] Failed to save notification preference.');
  }
};

// ─── System permission ────────────────────────────────────────────────────────

export const requestPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('travel-diary', {
      name: 'Travel Diary',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  if (granted) return true;
  if (!canAskAgain) return false;

  const { granted: newGranted } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });

  return newGranted;
};

export const getSystemPermissionStatus = async (): Promise<boolean> => {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
};

// ─── First-launch prompt ──────────────────────────────────────────────────────
// Call this once on app init. Shows an Alert asking the user if they want
// notifications, then requests the system permission if they say yes.

export const promptNotificationPermissionIfNeeded = async (): Promise<void> => {
  try {
    const alreadySet = await AsyncStorage.getItem(NOTIF_PREF_KEY);
    // Only prompt on first launch (key not yet written)
    if (alreadySet !== null) return;

    Alert.alert(
      'Enable Notifications?',
      'Get notified when a travel entry is saved.',
      [
        {
          text: 'Not now',
          style: 'cancel',
          onPress: async () => {
            await setNotificationPref(false);
          },
        },
        {
          text: 'Enable',
          onPress: async () => {
            const granted = await requestPermission();
            await setNotificationPref(granted);
            if (!granted) {
              Alert.alert(
                'Permission Denied',
                'You can enable notifications later in Settings.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  } catch {
    console.warn('[NotificationService] Failed to check notification preference.');
  }
};

// ─── Send notification ────────────────────────────────────────────────────────
// Checks both the user preference AND the system permission before sending.

export const sendNotification = async (title: string, body: string): Promise<void> => {
  const userEnabled = await getNotificationPref();
  if (!userEnabled) return;

  const systemGranted = await getSystemPermissionStatus();
  if (!systemGranted) {
    console.warn('[NotificationService] System permission not granted — skipping.');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { source: 'travel-diary' },
      },
      trigger: null,
    });
  } catch (error) {
    console.error(
      '[NotificationService] Failed to send:',
      error instanceof Error ? error.message : error
    );
  }
};

export const sendEntrySavedNotification = async (address: string): Promise<void> => {
  await sendNotification(
    '📍 Travel Entry Saved!',
    `Your diary entry from "${address}" has been saved.`
  );
};

// ─── Open system settings ─────────────────────────────────────────────────────
// Used by the Settings toggle when system permission is denied so user
// can go to device settings to re-enable.

export const openNotificationSettings = (): void => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};