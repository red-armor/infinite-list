import { View, ScrollView } from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import { IVerboseRectReadOnly } from '../../types';
export type IntersectionObserverEntryProps = {
  root: ScrollView;
  target: View;
  entryKey?: string;
  boundingClientRect: IVerboseRectReadOnly;
  intersectionRect: IVerboseRectReadOnly;
  rootBounds: IVerboseRectReadOnly | null;
  dimensions: ItemsDimensions;
};

/**
 * refer to DOM IntersectionObserverEntry
 */
export interface IIntersectionObserverEntry {
  readonly boundingClientRect: IVerboseRectReadOnly;
  readonly intersectionRatio: number;
  readonly intersectionRect: IVerboseRectReadOnly;
  readonly isIntersecting: boolean;
  readonly rootBounds: IVerboseRectReadOnly | null;
  readonly target: View;
  readonly time: DOMHighResTimeStamp;
}
