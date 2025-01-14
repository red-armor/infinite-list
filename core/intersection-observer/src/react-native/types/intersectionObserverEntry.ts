import { View, ScrollView } from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import { IRectReadOnly } from '../../types';
export type IntersectionObserverEntryProps = {
  root: ScrollView;
  target: View;
  entryKey?: string;
  boundingClientRect: IRectReadOnly;
  intersectionRect: IRectReadOnly;
  rootBounds: IRectReadOnly | null;
  dimensions: ItemsDimensions;
};

/**
 * refer to DOM IntersectionObserverEntry
 */
export interface IIntersectionObserverEntry {
  readonly boundingClientRect: IRectReadOnly;
  readonly intersectionRatio: number;
  readonly intersectionRect: IRectReadOnly;
  readonly isIntersecting: boolean;
  readonly rootBounds: IRectReadOnly | null;
  readonly target: View;
  readonly time: DOMHighResTimeStamp;
}
