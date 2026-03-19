import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,   // ← add this
    shouldShowList: true,     // ← add this
  }),
});

export const requestPermission = async (): Promise<boolean> => {
  // Android 13+ requires explicit POST_NOTIFICATIONS permission
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
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return newGranted;
};

export const sendNotification = async (title: string, body: string): Promise<void> => {
  const hasPermission = await requestPermission();

  if (!hasPermission) {
    console.warn('[NotificationService] Permission not granted — skipping notification.');
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
      trigger: null, // null = fire immediately
    });
  } catch (error) {
    console.error(
      '[NotificationService] Failed to send notification:',
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