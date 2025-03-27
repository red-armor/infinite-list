import { type RefObject, createContext } from 'react';
import type { ScrollView } from 'react-native';
import type { IntersectionObserver } from '@infinite-list/intersection-observer/react-native';
import type Marshal from '../Marshal';
import type PortalManager from '../portal/Manager';

export type ScrollerRef = RefObject<ScrollView>;

export const defaultScrollViewContext = {
  marshal: null,
  intersectionObserver: null,
  portalManager: null,
  scrollerRef: null!,
};

export interface ScrollViewContextValue {
  marshal: null | Marshal;
  intersectionObserver: null | IntersectionObserver;
  portalManager: null | PortalManager;
  scrollerRef: ScrollerRef;
}
export default createContext<ScrollViewContextValue>(defaultScrollViewContext);
