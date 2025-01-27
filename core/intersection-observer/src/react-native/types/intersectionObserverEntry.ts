import { View, ScrollView } from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import { IClientRectReadOnly } from '../../types';
export type IntersectionObserverEntryProps = {
  root: ScrollView;
  target: View;
  entryKey?: string;
  boundingClientRect: IClientRectReadOnly;
  intersectionRect: IClientRectReadOnly;
  rootBounds: IClientRectReadOnly | null;
  dimensions: ItemsDimensions;
};

/**
 * refer to DOM IntersectionObserverEntry
 */
export interface IIntersectionObserverEntry {
  readonly boundingClientRect: IClientRectReadOnly;
  readonly intersectionRatio: number;
  readonly intersectionRect: IClientRectReadOnly;
  readonly isIntersecting: boolean;
  readonly rootBounds: IClientRectReadOnly | null;
  readonly target: View;
  readonly time: DOMHighResTimeStamp;
}
