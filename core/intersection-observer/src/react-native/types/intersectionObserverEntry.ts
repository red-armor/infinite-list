import { RefObject } from 'react';
import { View, ScrollView } from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import { IClientRectReadOnly, IRectIntersection } from '../../types';
export type IntersectionObserverEntryProps = {
  root: ScrollView | RefObject<ScrollView>;
  target: View;
  entryKey?: string;
  boundingClientRect: IClientRectReadOnly;
  intersectionRect: IRectIntersection | null;
  rootBounds: IClientRectReadOnly | null;
  dimensions: ItemsDimensions;
};

/**
 * refer to DOM IntersectionObserverEntry
 */
export interface IIntersectionObserverEntry {
  readonly boundingClientRect: IClientRectReadOnly;
  readonly intersectionRatio: number;
  readonly intersectionRect: IRectIntersection | null;
  readonly isIntersecting: boolean;
  readonly rootBounds: IClientRectReadOnly | null;
  readonly target: View;
  readonly time: DOMHighResTimeStamp;
}
