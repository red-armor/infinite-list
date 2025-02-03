import { ScrollView, View } from 'react-native';
import ReactNativeDocument from '../ReactNativeDocument';
import ContainerObserver from '../ContainerObserver';

export type ObserverProps = {
  root: ObserverRoot;
  target: View;
  observerKey?: string;
  containerObserver: ContainerObserver;
};

export type ObserverRoot = ScrollView | ReactNativeDocument;
