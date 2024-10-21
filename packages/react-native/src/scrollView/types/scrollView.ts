import { ForwardedRef, MutableRefObject, PropsWithChildren } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
  View,
  ViewPagerAndroidOnPageScrollEventData,
  ViewPagerAndroidOnPageSelectedEventData,
  ViewPagerAndroidProps,
  ViewProps,
  ViewStyle,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import {
  ViewabilityConfig,
  ViewabilityConfigCallbackPairs,
} from '@infinite-list/data-model';

import Marshal from '../Marshal';
import ScrollEventHelper from '../ScrollEventHelper';
import ScrollHelper from '../ScrollHelper';
import { StickyMode } from './stickyMarshal';

export interface ViewRendererProps extends ViewProps {
  ref?: ForwardedRef<View>;
  scrollViewKey: string;
}

export type GetScrollHelper = () => ScrollHelper;

export type SpectrumScrollViewRef = MutableRefObject<
  ScrollView | View | undefined
>;

export interface ViewRendererPropsWithForwardRef extends ScrollViewProps {
  forwardRef?: ForwardedRef<View>;
  scrollViewKey: string;
}

export type RefreshControlProps = {
  refreshing?: boolean;
  useSmoothControl?: boolean;
  onRefresh?: (() => void) | undefined;
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
  scrollViewKey: string;
  getScrollHelper: GetScrollHelper;

  scrollEventHelper: ScrollEventHelper;
}

export interface AnimatedScrollRendererPropsWithForwardRef
  extends ScrollRendererPropsWithForwardRef {
  animatedValue?: MutableRefObject<Animated.Value>;
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

    scrollUpdating?: boolean;
    setMarshal?: (marshal: Marshal) => void;

    animatedX?: MutableRefObject<Animated.Value>;
    animatedY?: MutableRefObject<Animated.Value>;
    onEndReachedThreshold?: number;
    onEndReachedTimeoutThreshold?: number;
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

export enum ScrollHandlerName {
  onScroll = 'onScroll',
  onScrollEndDrag = 'onScrollEndDrag',
  onScrollBeginDrag = 'onScrollBeginDrag',
  onMomentumScrollEnd = 'onMomentumScrollEnd',
  onMomentumScrollBegin = 'onMomentumScrollBegin',
}

export type SyntheticEventHandler = (
  event: NativeSyntheticEvent<NativeScrollEvent>
) => void;

export type ContentSizeChangeHandler = (w: number, h: number) => void;
export type EventHandler = SyntheticEventHandler;
export type OnLayout = (event: LayoutChangeEvent) => void;
export type ScrollHandler = SyntheticEventHandler;
export type MomentumScrollEndHandler = () => void;
export type OnEndReachedHandler = (opts: { distanceFromEnd: number }) => void;

export interface ViewToken {
  item: any;
  key: string;
  index: number | null;
  isViewable: boolean;
  section?: any;
}
export type OnViewableItemChangedInfo = {
  viewableItems: ViewToken[];
  changed: ViewToken[];
};

export type OnViewableItemsChanged =
  | ((info: OnViewableItemChangedInfo) => void)
  | null;
