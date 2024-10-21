import { Animated, TouchableOpacity, View } from 'react-native';

import createViewableComponent from './item/createViewableComponent';
import createStickyComponent from './item/sticky-item/createStickyComponent';
import FooterPortal from './portal/FooterPortal';
import HeaderPortal from './portal/HeaderPortal';

export { default as ScrollView } from './ScrollView';
export { default as ViewableItem } from './item/ViewableItem';
export { default as StickyItem } from './item/sticky-item/StickyItem';
export { default as ScrollViewContext } from './context/ScrollViewContext';
export { default as ScrollUpdatingContext } from './context/ScrollUpdatingContext';
export { default as ViewabilityContext } from './context/ViewabilityContext';
export { default as ViewableItemContext } from './context/ViewableItemContext';
export { default as ScrollHelper } from './ScrollHelper';

export { default as Marshal } from './Marshal';
export * from './types';
export { default as RefreshControl } from './refresh/Control';

export { createViewableComponent, createStickyComponent };

export const Viewable = {
  View: createViewableComponent(View),
  TouchableOpacity: createViewableComponent(TouchableOpacity),
};

export const ViewableComponent = Viewable;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(
  TouchableOpacity
);

export const StickyComponent = {
  View: createStickyComponent(Animated.View),
  TouchableOpacity: createStickyComponent(AnimatedTouchableOpacity),
};

export const ScrollViewPortal = {
  Header: HeaderPortal,
  Footer: FooterPortal,
};

export * from './constants';
export * from './commons/platform';
export { default as useMeasureLayout } from './hooks/useMeasureLayout';
