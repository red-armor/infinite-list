import type { View } from 'react-native';
import type { ItemsDimensions } from '@infinite-list/items-dimensions';
import type { IClientRectReadOnly, IRectIntersection } from '../../types';
import type Observer from '../Observer';

export type IntersectionObserverEntryProps = {
  target: View;
  entryKey?: string;
  observer: Observer;
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
  // readonly entryKey: string;
  readonly observer: Observer;
}
