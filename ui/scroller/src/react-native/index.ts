import type ScrollerScrollView from './ScrollView';
import FooterPortal from './portal/FooterPortal';
import HeaderPortal from './portal/HeaderPortal';

export { default as ScrollViewContext } from './context/ScrollViewContext';
export { default as IntersectionObserverTouchableOpacity } from './intersection/IntersectionObserverTouchableOpacity';
export { default as IntersectionObserverView } from './intersection/IntersectionObserverView';
export { default as Marshal } from './Marshal';
export { default as ScrollHelper } from './ScrollHelper';
export { default as StickyView } from './sticky/StickyView';
export * from './types';

export const ScrollViewPortal = {
  Header: HeaderPortal,
  Footer: FooterPortal,
};

export * from './commons/platform';
export * from './constants';

/**
 * to make exported ScrollView type compatible with react-native
 */
export type ScrollView = typeof ScrollerScrollView;

export { default as ScrollView } from './ScrollView';
