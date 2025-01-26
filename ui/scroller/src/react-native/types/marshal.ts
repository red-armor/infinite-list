import { MutableRefObject } from 'react';
import { Animated } from 'react-native';
import { StickyMode } from './stickyMarshal';
import { SyntheticEventHandler, ContentSizeChangeHandler } from './scrollView';
import Marshal from '../Marshal';
import ScrollHelper from '../ScrollHelper';
import { SpectrumScrollViewRef } from './scrollView';

export type SetScrollUpdating = (falsy: boolean) => void;

export type MarshalProps = {
  id: string;
  animated?: boolean;
  horizontal?: boolean;
  parentMarshal: Marshal | null;
  scrollUpdating?: boolean;
  ref: SpectrumScrollViewRef;
  ownerScrollHelper: ScrollHelper | null | undefined;
  animatedValueX: MutableRefObject<Animated.Value>;
  animatedValueY: MutableRefObject<Animated.Value>;
} & Omit<ScrollHelperProps, 'marshal'> &
  Omit<ScrollEventHelperProps, 'marshal'>;

export type ScrollHelperProps = {
  marshal: Marshal;

  id: string;
  stickyMode?: StickyMode;
  horizontal: boolean;
  // ownerScrollHelper: ScrollHelper | null | undefined;
  ref: SpectrumScrollViewRef;
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
