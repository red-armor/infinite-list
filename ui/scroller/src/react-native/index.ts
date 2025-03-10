import FooterPortal from './portal/FooterPortal';
import HeaderPortal from './portal/HeaderPortal';

import ScrollerScrollView from './ScrollView';
export { default as ScrollViewContext } from './context/ScrollViewContext';
export { default as ScrollHelper } from './ScrollHelper';
export { default as IntersectionObserverView } from './intersection/IntersectionObserverView';
export { default as IntersectionObserverTouchableOpacity } from './intersection/IntersectionObserverTouchableOpacity';
export { default as StickyView } from './sticky/StickyView';

export { default as Marshal } from './Marshal';
export * from './types';
export { default as RefreshControl } from './refresh/Control';

export const ScrollViewPortal = {
  Header: HeaderPortal,
  Footer: FooterPortal,
};

export * from './constants';
export * from './commons/platform';

/**
 * to make exported ScrollView type compatible with react-native
 */
export type ScrollView = typeof ScrollerScrollView;
export { ScrollerScrollView as ScrollView };
