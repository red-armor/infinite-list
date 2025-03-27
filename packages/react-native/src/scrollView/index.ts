import { Animated, TouchableOpacity, View } from 'react-native';

import createViewableComponent from './item/createViewableComponent';
import createStickyComponent from './item/sticky-item/createStickyComponent';
import FooterPortal from './portal/FooterPortal';
import HeaderPortal from './portal/HeaderPortal';

export { default as ScrollUpdatingContext } from './context/ScrollUpdatingContext';
export { default as ScrollViewContext } from './context/ScrollViewContext';
export { default as ViewabilityContext } from './context/ViewabilityContext';
export { default as ViewableItemContext } from './context/ViewableItemContext';
export { default as StickyItem } from './item/sticky-item/StickyItem';
export { default as ViewableItem } from './item/ViewableItem';
export { default as Marshal } from './Marshal';
export { default as RefreshControl } from './refresh/Control';
export { default as ScrollHelper } from './ScrollHelper';
export { default as ScrollView } from './ScrollView';
export * from './types';



export const Viewable = {
  View: createViewableComponent(View),
  TouchableOpacity: createViewableComponent(TouchableOpacity),
};

export const ViewableComponent = Viewable;

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export const StickyComponent = {
  View: createStickyComponent(Animated.View),
  TouchableOpacity: createStickyComponent(AnimatedTouchableOpacity),
};

export const ScrollViewPortal = {
  Header: HeaderPortal,
  Footer: FooterPortal,
};

export * from './commons/platform';
export * from './constants';
export { default as useMeasureLayout } from './hooks/useMeasureLayout';
export {default as createViewableComponent} from './item/createViewableComponent';
export {default as createStickyComponent} from './item/sticky-item/createStickyComponent';