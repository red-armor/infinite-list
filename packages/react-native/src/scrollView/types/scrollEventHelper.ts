import {
  ContentSizeChangeHandler,
  OnEndReachedHandler,
  SyntheticEventHandler,
} from './scrollView';

export type EventHandlerName =
  | 'onScroll'
  | 'onScrollEndDrag'
  | 'onScrollBeginDrag'
  | 'onMomentumScrollEnd'
  | 'onMomentumScrollBegin'
  | 'onScrollToTop';
export type ScrollEventHandlerSubscriptionKeys =
  | EventHandlerName
  | 'onContentSizeChange'
  | 'onEndReached';

export type ScrollEventHandlerSubscriptions = {
  onScroll: Array<SyntheticEventHandler>;
  onScrollEndDrag: Array<SyntheticEventHandler>;
  onScrollBeginDrag: Array<SyntheticEventHandler>;
  onMomentumScrollEnd: Array<SyntheticEventHandler>;
  onMomentumScrollBegin: Array<SyntheticEventHandler>;
  onContentSizeChange: Array<ContentSizeChangeHandler>;
  onEndReached: Array<OnEndReachedHandler>;
  onScrollToTop: Array<SyntheticEventHandler>;
};
