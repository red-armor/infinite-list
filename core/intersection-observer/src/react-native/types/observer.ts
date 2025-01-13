import { ScrollView, View } from 'react-native';
export type ObserverProps = {
  root: ScrollView;
  target: View;
  observerKey?: string;
};
