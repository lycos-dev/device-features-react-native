import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TravelEntry } from '../types';

export type RootStackParamList = {
  Home: undefined;
  AddEntry: undefined;
  EntryDetails: { entry: TravelEntry };
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;