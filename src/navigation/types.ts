import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  AddEntry: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;