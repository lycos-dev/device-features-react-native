import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../context';
import {
  getNotificationPref,
  getSystemPermissionStatus,
  openNotificationSettings,
  requestPermission as requestNotificationPermission,
  setNotificationPref,
} from '../../services/notificationService';

// ─── Animated toggle ──────────────────────────────────────────────────────────
const Toggle: React.FC<{
  value: boolean;
  onToggle: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
  disabled?: boolean;
}> = ({ value, onToggle, theme, disabled }) => {
  const translateX = useRef(new Animated.Value(value ? 30 : 2)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 30 : 2,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [value]);

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.9}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <View style={[
        styles.toggleTrack,
        {
          backgroundColor: value ? theme.primary : theme.surfaceSecondary,
          borderColor: value ? theme.primary : theme.border,
          opacity: disabled ? 0.4 : 1,
        },
      ]}>
        <Animated.View style={[
          styles.toggleKnob,
          {
            backgroundColor: value ? theme.surface : '#FFFFFF',
            transform: [{ translateX }],
          },
        ]} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Settings row ─────────────────────────────────────────────────────────────
const SettingsRow: React.FC<{
  icon: string;
  title: string;
  subtitle: string;
  theme: ReturnType<typeof useTheme>['theme'];
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}> = ({ icon, title, subtitle, theme, right, onPress, isLast }) => (
  <TouchableOpacity
    style={[
      styles.row,
      !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
    ]}
    onPress={onPress}
    activeOpacity={onPress ? 0.6 : 1}
    disabled={!onPress}
  >
    <View style={styles.rowLeft}>
      <View style={[styles.iconWrap, { backgroundColor: theme.surfaceSecondary }]}>
        <Text style={[styles.rowIcon, { color: theme.textSecondary }]}>{icon}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>
      </View>
    </View>
    {right}
  </TouchableOpacity>
);

// ─── Open device settings ─────────────────────────────────────────────────────
const openDeviceSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};

// ─── SettingsScreen ───────────────────────────────────────────────────────────
export const SettingsScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const themeTranslateX = useRef(new Animated.Value(isDark ? 30 : 2)).current;

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationGranted, setLocationGranted] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [systemNotifGranted, setSystemNotifGranted] = useState(false);
  const [notifLoading, setNotifLoading] = useState(true);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ─── Load all permission states ───────────────────────────────────────────
  const syncPermissions = useCallback(async () => {
    try {
      const { granted: locGranted } = await Location.getForegroundPermissionsAsync();
      setLocationGranted(locGranted);

      const [pref, sysGranted] = await Promise.all([
        getNotificationPref(),
        getSystemPermissionStatus(),
      ]);
      setSystemNotifGranted(sysGranted);
      // If system revoked notifications externally, reflect that
      setNotifEnabled(pref && sysGranted);
    } catch {
      // silent
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // On mount — load permissions
  useEffect(() => {
    syncPermissions();
  }, [syncPermissions]);

  // ─── AppState listener — re-sync when returning from device Settings ───────
  // This is the key fix: when iOS/Android restarts the app or brings it back
  // to foreground after a permission change, we re-read all permission states
  // so the toggles reflect reality without the user needing to restart.
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        await syncPermissions();
      }
      appStateRef.current = nextState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [syncPermissions]);

  // ─── Theme toggle ─────────────────────────────────────────────────────────
  const handleThemeToggle = useCallback(() => {
    Animated.spring(themeTranslateX, {
      toValue: isDark ? 2 : 30,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
    toggleTheme();
  }, [isDark, toggleTheme]);

  // ─── Camera toggle ────────────────────────────────────────────────────────
  const handleCameraToggle = useCallback(async () => {
    if (cameraPermission?.granted) {
      Alert.alert(
        'Camera Permission',
        'To revoke camera access, go to your device Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openDeviceSettings },
        ]
      );
      return;
    }
    if (cameraPermission?.canAskAgain) {
      await requestCameraPermission();
    } else {
      Alert.alert(
        'Camera Permission Required',
        'Camera access is blocked. Open Settings to enable it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openDeviceSettings },
        ]
      );
    }
  }, [cameraPermission, requestCameraPermission]);

  // ─── Location toggle ──────────────────────────────────────────────────────
  const handleLocationToggle = useCallback(async () => {
    if (locationGranted) {
      Alert.alert(
        'Location Permission',
        'To revoke location access, go to your device Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openDeviceSettings },
        ]
      );
      return;
    }
    const { granted, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (granted) {
      setLocationGranted(true);
    } else if (!canAskAgain) {
      Alert.alert(
        'Location Permission Required',
        'Location access is blocked. Open Settings to enable it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openDeviceSettings },
        ]
      );
    }
  }, [locationGranted]);

  // ─── Notification toggle ──────────────────────────────────────────────────
  const handleNotifToggle = useCallback(async () => {
    if (!systemNotifGranted) {
      Alert.alert(
        'Notification Permission Required',
        'Notifications are blocked by your device. Open Settings to enable them.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openNotificationSettings },
        ]
      );
      return;
    }
    const next = !notifEnabled;
    if (next) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Denied',
          'Could not enable notifications. Please check your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openNotificationSettings },
          ]
        );
        return;
      }
      setSystemNotifGranted(true);
    }
    await setNotificationPref(next);
    setNotifEnabled(next);
  }, [notifEnabled, systemNotifGranted]);

  // ─── Subtitles ────────────────────────────────────────────────────────────
  const cameraGranted = cameraPermission?.granted ?? false;
  const cameraSubtitle = !cameraPermission
    ? 'Loading...'
    : cameraGranted
    ? 'Access granted'
    : cameraPermission.canAskAgain
    ? 'Tap to grant access'
    : 'Blocked — tap to open Settings';

  const locationSubtitle = locationGranted
    ? 'Access granted'
    : 'Tap to grant access';

  const notifSubtitle = notifLoading
    ? 'Loading...'
    : !systemNotifGranted
    ? 'Blocked — tap to open Settings'
    : notifEnabled
    ? 'Notify me when an entry is saved'
    : 'Notifications are off';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
      </View>

      <View style={styles.content}>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingsRow
            icon={isDark ? '☽' : '✦'}
            title={isDark ? 'Dark mode' : 'Light mode'}
            subtitle={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            theme={theme}
            isLast
            right={
              <Toggle value={isDark} onToggle={handleThemeToggle} theme={theme} />
            }
          />
        </View>

        {/* Permissions */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 24 }]}>
          PERMISSIONS
        </Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingsRow
            icon="⊙"
            title="Camera"
            subtitle={cameraSubtitle}
            theme={theme}
            onPress={!cameraGranted ? handleCameraToggle : undefined}
            right={
              <Toggle
                value={cameraGranted}
                onToggle={handleCameraToggle}
                theme={theme}
                disabled={!cameraPermission}
              />
            }
          />
          <SettingsRow
            icon="◎"
            title="Location"
            subtitle={locationSubtitle}
            theme={theme}
            onPress={!locationGranted ? handleLocationToggle : undefined}
            right={
              <Toggle
                value={locationGranted}
                onToggle={handleLocationToggle}
                theme={theme}
              />
            }
          />
          <SettingsRow
            icon="◈"
            title="Notifications"
            subtitle={notifSubtitle}
            theme={theme}
            onPress={!systemNotifGranted ? openNotificationSettings : undefined}
            isLast
            right={
              <Toggle
                value={notifEnabled}
                onToggle={handleNotifToggle}
                theme={theme}
                disabled={notifLoading}
              />
            }
          />
        </View>

        {/* About */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 24 }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingsRow
            icon="◈"
            title="Travel Diary"
            subtitle="Version 1.0.0"
            theme={theme}
            isLast
          />
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  content: {
    padding: 20,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIcon: { fontSize: 16 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '500' },
  rowSubtitle: { fontSize: 12 },

  toggleTrack: {
    width: 60,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
  },
  toggleKnob: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});