import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { SavedJobsProvider } from './src/context/SavedJobsContext';
import { ThemeProvider } from './src/context/ThemeContext.tsx';

export default function App() {
  return (
    <ThemeProvider>
      <SavedJobsProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </SavedJobsProvider>
    </ThemeProvider>
  );
}