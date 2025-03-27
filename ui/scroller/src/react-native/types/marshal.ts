import type { MutableRefObject } from 'react';
import type {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import type {
  IntersectionObserver,
  IntersectionObserverCallback,
} from '@infinite-list/intersection-observer/react-native';
import type Marshal from '../Marshal';
import type {
  ContentSizeChangeHandler,
  InfiniteListScrollViewRef,
  SyntheticEventHandler,
} from './scrollView';
import type { StickyMode } from './stickyMarshal';

export type SetScrollUpdating = (falsy: boolean) => void;

export type MarshalProps = {
  id: string;
  animated?: boolean;
  horizontal?: boolean;
  parentMarshal: Marshal | null;
  scrollUpdating?: boolean;
  ref: InfiniteListScrollViewRef;
  intersectionObserver: IntersectionObserver | null;
  intersectionObserverCallback?: IntersectionObserverCallback;

  animatedValueX?: MutableRefObject<Animated.Value>;
  animatedValueY?: MutableRefObject<Animated.Value>;
} & Omit<ScrollHelperProps, 'marshal'> &
  Omit<ScrollEventHelperProps, 'marshal'>;

export type ScrollHelperProps = {
  marshal: Marshal;

  id: string;
  stickyMode?: StickyMode;
  horizontal: boolean;
  ref: InfiniteListScrollViewRef;
  animatedValueX?: MutableRefObject<Animated.Value>;
  animatedValueY?: MutableRefObject<Animated.Value>;
  intersectionObserver: IntersectionObserver | null;
  intersectionObserverCallback?: IntersectionObserverCallback;
};

export type ScrollEventHelperProps = {
  marshal: Marshal;
  onScroll?: SyntheticEventHandler;
  onScrollEndDrag?: SyntheticEventHandler;
  onScrollBeginDrag?: SyntheticEventHandler;
  onContentSizeChange?: ContentSizeChangeHandler;
  onMomentumScrollEnd?: SyntheticEventHandler;
  onMomentumScrollBegin?: SyntheticEventHandler;
  onScrollToTop?: SyntheticEventHandler;
};

export type ScrollEventHandler = (
  e: NativeSyntheticEvent<NativeScrollEvent>
) => void;
