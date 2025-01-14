import { ScrollView, View } from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';

export type ObserverProps = {
  root: ScrollView;
  target: View;
  observerKey?: string;
  dimensions: ItemsDimensions;
};
