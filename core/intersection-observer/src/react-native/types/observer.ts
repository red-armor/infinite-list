import { ScrollView, View } from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import ReactNativeDocument from '../ReactNativeDocument';
import ContainerObserver from '../ContainerObserver';

export type ObserverProps = {
  root: ObserverRoot;
  target: View;
  observerKey?: string;
  dimensions: ItemsDimensions;
  containerObserver: ContainerObserver;
};

export type ObserverRoot = ScrollView | ReactNativeDocument;
