import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ThemeProvider, useTheme } from './src/context';
import { useAppInit } from './src/hooks';
import { RootNavigator } from './src/navigation';

const AppContent: React.FC = () => {
  const { isDark, theme } = useTheme();
  const { isReady, initError } = useAppInit();

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.background }]}>
        <Text style={styles.splashEmoji}>🗺️</Text>
        <ActivityIndicator size="large" color={theme.primary} style={styles.splashSpinner} />
        <Text style={[styles.splashText, { color: theme.textMuted }]}>
          Setting up Travel Diary...
        </Text>
      </View>
    );
  }

  if (initError) {
    console.warn('[App] Init error (non-fatal):', initError);
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  splashEmoji: { fontSize: 72 },
  splashSpinner: { marginTop: 8 },
  splashText: { fontSize: 15, marginTop: 4 },
});