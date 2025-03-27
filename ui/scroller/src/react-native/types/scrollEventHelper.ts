import type { ContentSizeChangeHandler, SyntheticEventHandler } from './scrollView';

export type EventHandlerName =
  | 'onScroll'
  | 'onScrollEndDrag'
  | 'onScrollBeginDrag'
  | 'onMomentumScrollEnd'
  | 'onMomentumScrollBegin'
  | 'onScrollToTop';

export type InternalEventHandlerName = `_${EventHandlerName}`;

export type ScrollEventHandlerSubscriptionKeys =
  | EventHandlerName
  | 'onContentSizeChange';
export type InternalScrollEventHandlerSubscriptionKeys =
  `_${ScrollEventHandlerSubscriptionKeys}`;

export type ScrollEventHandlerSubscriptions = {
  onScroll: Array<SyntheticEventHandler>;
  onScrollEndDrag: Array<SyntheticEventHandler>;
  onScrollBeginDrag: Array<SyntheticEventHandler>;
  onMomentumScrollEnd: Array<SyntheticEventHandler>;
  onMomentumScrollBegin: Array<SyntheticEventHandler>;
  onContentSizeChange: Array<ContentSizeChangeHandler>;
  onScrollToTop: Array<SyntheticEventHandler>;
};
