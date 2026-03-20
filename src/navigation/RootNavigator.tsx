import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { BottomTabBar } from '../components/BottomTabBar';
import { useTheme } from '../context';
import { AddEntryScreen } from '../screens/AddEntryScreen';
import { EntryDetailsScreen } from '../screens/EntryDetailsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RootStackParamList, TabParamList } from './types';

export type { RootStackNavigationProp } from './types';

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator: React.FC = () => (
  <Tab.Navigator
    tabBar={props => <BottomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

// ─── Root Stack Navigator ─────────────────────────────────────────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      {/* Tabs are the default "home" */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Modal-style stack screens */}
      <Stack.Screen
        name="AddEntry"
        component={AddEntryScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="EntryDetails"
        component={EntryDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};