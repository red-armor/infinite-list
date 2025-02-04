import { ForwardedRef, MutableRefObject, PropsWithChildren } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
  View,
  // @ts-ignore
  ViewPagerAndroidOnPageScrollEventData,
  // @ts-ignore
  ViewPagerAndroidOnPageSelectedEventData,
  // @ts-ignore
  ViewPagerAndroidProps,
  ViewProps,
  ViewStyle,
} from 'react-native';

import {
  ViewabilityConfig,
  ViewabilityConfigCallbackPairs,
} from '@infinite-list/viewable';

import Marshal from '../Marshal';
import ScrollEventHelper from '../ScrollEventHelper';
import ScrollHelper from '../ScrollHelper';
import { StickyMode } from './stickyMarshal';

// import PagerView from 'react-native-pager-view';
// TODO
type PagerView = any;

export interface ViewRendererProps extends ViewProps {
  ref?: ForwardedRef<View>;
}

export type GetScrollHelper = () => ScrollHelper;

export type SpectrumScrollViewRef = MutableRefObject<ScrollView>;

export interface ViewRendererPropsWithForwardRef extends ScrollViewProps {
  forwardRef?: ForwardedRef<View>;
}

export type RefreshControlProps = {
  refreshing?: boolean;
  useSmoothControl?: boolean;
  onRefresh?: (() => void) | undefined | null;
  refreshControlStartCorrection?: number;
  triggerOnRefreshThresholdValue?: number;
  refreshControlContentContainerStyle?: ViewStyle;
};

export type SmoothControlProps = PropsWithChildren<
  RefreshControlProps & {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    layoutRef: MutableRefObject<{
      x: number;
      y: number;
    }>;
    animatedValue: MutableRefObject<Animated.Value>;
    lottieAnimatedValueRef: MutableRefObject<Animated.Value>;
  }
>;

export interface ScrollRendererProps
  extends RefreshControlProps,
    ScrollViewProps {
  ref?: ForwardedRef<ScrollView>;
  scrollViewKey: string;
  getScrollHelper: GetScrollHelper;

  scrollEventHelper: ScrollEventHelper;
}

export interface AnimatedScrollRendererProps extends ScrollRendererProps {
  animatedValue?: MutableRefObject<Animated.Value>;
}

export interface ScrollRendererPropsWithForwardRef
  extends RefreshControlProps,
    ScrollViewProps {
  forwardRef?: ForwardedRef<ScrollView>;
  // scrollViewKey: string;
  // getScrollHelper: GetScrollHelper;

  // scrollEventHelper: ScrollEventHelper;
}

export interface AnimatedScrollRendererPropsWithForwardRef
  extends ScrollRendererPropsWithForwardRef {
  forwardRef?: ForwardedRef<ScrollView>;
}

export interface AnimatedViewPagerRenderProps extends ViewPagerAndroidProps {
  ref?: ForwardedRef<PagerView>;
  scrollViewKey: string;
  getScrollHelper: GetScrollHelper;
  pagerOffsetRef?: MutableRefObject<Animated.Value>;
  pagerPositionRef?: MutableRefObject<Animated.Value>;
}

export interface AnimatedViewPagerRenderPropsWithForwardRef
  extends ViewPagerAndroidProps {
  forwardRef?: ForwardedRef<PagerView>;
  scrollViewKey: string;
  pagerOffsetRef?: MutableRefObject<Animated.Value>;
  pagerPositionRef?: MutableRefObject<Animated.Value>;
  getScrollHelper: GetScrollHelper;
}

export type SpectrumScrollViewProps = ScrollViewProps &
  RefreshControlProps & {
    id?: string;
    /**
     *
     */
    animated?: boolean;

    stickyMode?: StickyMode;

    enableViewPager?: boolean;

    /**
     * @platform android
     */
    pagerOffsetRef?: MutableRefObject<Animated.Value>;

    /**
     * @platform android
     */
    pagerPositionRef?: MutableRefObject<Animated.Value>;

    /**
     * enable / disable trigger scroll event in current ScrollView
     */
    scrollUpdating?: boolean;
    /**
     *
     * @param marshal
     * @returns
     *
     * to get scroller marshal from passing props, just like `setRef`
     */
    setMarshal?: (marshal: Marshal) => void;

    animatedX?: MutableRefObject<Animated.Value>;
    animatedY?: MutableRefObject<Animated.Value>;
    viewabilityConfig?: ViewabilityConfig;
    viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs;

    // on support Pager condition
    onPageScroll?:
      | ((
          event: NativeSyntheticEvent<ViewPagerAndroidOnPageScrollEventData>
        ) => void)
      | undefined;
    onPageSelected?:
      | ((
          event: NativeSyntheticEvent<ViewPagerAndroidOnPageSelectedEventData>
        ) => void)
      | undefined;
    onPageScrollStateChanged?:
      | ((state: 'Idle' | 'Dragging' | 'Settling') => void)
      | undefined;
  };

export type SpectrumScrollViewPropsWithRef = SpectrumScrollViewProps & {
  ref?: ForwardedRef<ScrollView>;
};
export type SpectrumScrollViewPropsWithForwardRef = SpectrumScrollViewProps & {
  forwardRef?: ForwardedRef<ScrollView>;
};

export type SyntheticEventHandlerEvent =
  NativeSyntheticEvent<NativeScrollEvent>;

export type SyntheticEventHandler = (event: SyntheticEventHandlerEvent) => void;

export type ContentSizeChangeHandler = (w: number, h: number) => void;
export type EventHandler = SyntheticEventHandler;
export type OnLayout = (event: LayoutChangeEvent) => void;
export type ScrollHandler = SyntheticEventHandler;
export type MomentumScrollEndHandler = () => void;
export type OnEndReachedHandler = (opts: { distanceFromEnd: number }) => void;

export type ScrollToOption =
  | number
  | {
      x?: number | undefined;
      y?: number | undefined;
      animated?: boolean | undefined;
    };
