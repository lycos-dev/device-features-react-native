import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useTheme } from '../context';
import { AddEntryScreen } from '../screens/AddEntryScreen';
import { EntryDetailsScreen } from '../screens/EntryDetailsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RootStackParamList } from './types';

export type { RootStackNavigationProp } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
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