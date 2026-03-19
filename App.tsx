import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';  // ← must be expo-status-bar
import React from 'react';

import { ThemeProvider, useTheme } from './src/context';
import { RootNavigator } from './src/navigation';

const AppContent: React.FC = () => {
  const { isDark } = useTheme();

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