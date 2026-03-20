import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TravelEntry } from '../types';

// ─── Stack (modal screens) ────────────────────────────────────────────────────
export type RootStackParamList = {
  Tabs: undefined;
  AddEntry: undefined;
  EntryDetails: { entry: TravelEntry };
};

// ─── Bottom tabs ──────────────────────────────────────────────────────────────
export type TabParamList = {
  Home: undefined;
  Settings: undefined;
};

// ─── Composite — screens inside tabs can also push stack screens ──────────────
export type RootStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;