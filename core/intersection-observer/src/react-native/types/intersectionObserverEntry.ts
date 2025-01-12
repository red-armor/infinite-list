import { View, ScrollView } from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
export type IntersectionObserverEntryProps = {
  root: ScrollView;
  time: number;
  target: View;
  entryKey?: string;
  boundingClientRect: IRectReadOnly;
  intersectionRect: IRectReadOnly;
  rootBounds: IRectReadOnly | null;
  dimensions: ItemsDimensions;
};

/**
 * refer to DOMRectReadOnly
 */
export interface IRectReadOnly {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

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
