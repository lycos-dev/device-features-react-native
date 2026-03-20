import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

import { BottomTabBar } from '../components/BottomTabBar';
import { useTheme } from '../context';
import { AddEntryScreen } from '../screens/AddEntryScreen';
import { EntryDetailsScreen } from '../screens/EntryDetailsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RootStackParamList, TabParamList } from './types';

export type { RootStackNavigationProp } from './types';

const LAST_TAB_KEY = '@travel_diary_last_tab';

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator: React.FC<{ initialTab: keyof TabParamList }> = ({ initialTab }) => (
  <Tab.Navigator
    tabBar={props => <BottomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
    initialRouteName={initialTab}
    screenListeners={{
      // Persist whichever tab the user is on so that if iOS kills the process
      // (which it does when camera permission is changed in Settings), the app
      // relaunches back on the same tab instead of resetting to Home.
      state: e => {
        const state = (e.data as any)?.state;
        if (state) {
          const activeTab = state.routes[state.index]?.name;
          if (activeTab) {
            AsyncStorage.setItem(LAST_TAB_KEY, activeTab).catch(() => {});
          }
        }
      },
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

// ─── Root Stack Navigator ─────────────────────────────────────────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { theme } = useTheme();
  const [initialTab, setInitialTab] = useState<keyof TabParamList | null>(null);

  useEffect(() => {
    // On iOS, changing the camera permission in device Settings causes iOS to
    // kill and cold-relaunch the app process. We restore the last active tab
    // from AsyncStorage so the user lands back on Settings rather than Home.
    AsyncStorage.getItem(LAST_TAB_KEY)
      .then(saved => {
        const validTabs: Array<keyof TabParamList> = ['Home', 'Settings'];
        const tab = validTabs.includes(saved as keyof TabParamList)
          ? (saved as keyof TabParamList)
          : 'Home';
        setInitialTab(tab);
      })
      .catch(() => setInitialTab('Home'));
  }, []);

  if (initialTab === null) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Tabs">
        {() => <TabNavigator initialTab={initialTab} />}
      </Stack.Screen>

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