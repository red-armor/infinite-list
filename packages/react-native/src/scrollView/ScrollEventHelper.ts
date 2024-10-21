import noop from '@x-oasis/noop';

import Marshal from './Marshal';
import ScrollHelper from './ScrollHelper';
import {
  ContentSizeChangeHandler,
  OnEndReachedHandler,
  ScrollEventHandlerSubscriptionKeys,
  ScrollEventHandlerSubscriptions,
  SyntheticEventHandler,
} from './types';

class ScrollEventHelper {
  public marshal: Marshal;
  private _disposer: Function;
  private _scrollHelper: ScrollHelper;
  private _onScroll: SyntheticEventHandler | undefined;
  private _onScrollEndDrag: SyntheticEventHandler | undefined;
  private _onScrollBeginDrag: SyntheticEventHandler | undefined;
  private _onContentSizeChange: ContentSizeChangeHandler | undefined;
  private _onMomentumScrollEnd: SyntheticEventHandler | undefined;
  private _onMomentumScrollBegin: SyntheticEventHandler | undefined;
  private _onScrollToTop: SyntheticEventHandler | undefined;
  private _subscriptions: ScrollEventHandlerSubscriptions;
  private _onEndReached: ({ distanceFromEnd }) => void;

  constructor(props: {
    marshal: Marshal;
    scrollHelper: ScrollHelper;
    onEndReached?: OnEndReachedHandler;
    onScroll?: SyntheticEventHandler;
    onScrollEndDrag?: SyntheticEventHandler;
    onScrollBeginDrag?: SyntheticEventHandler;
    onContentSizeChange?: ContentSizeChangeHandler;
    onMomentumScrollEnd?: SyntheticEventHandler;
    onMomentumScrollBegin?: SyntheticEventHandler;
    onScrollToTop?: SyntheticEventHandler;
  }) {
    const {
      marshal,
      onScroll,
      scrollHelper,
      onEndReached,
      onScrollToTop,
      onScrollEndDrag,
      onScrollBeginDrag,
      onContentSizeChange,
      onMomentumScrollEnd,
      onMomentumScrollBegin,
    } = props;

    this.marshal = marshal;
    this._onEndReached = onEndReached;
    this._onScroll = onScroll;
    this._scrollHelper = scrollHelper;
    this._onScrollBeginDrag = onScrollBeginDrag;
    this._onScrollEndDrag = onScrollEndDrag;
    this._onContentSizeChange = onContentSizeChange;
    this._onMomentumScrollEnd = onMomentumScrollEnd;
    this._onMomentumScrollBegin = onMomentumScrollBegin;
    this._onScrollToTop = onScrollToTop;

    this._subscriptions = {
      onScroll: [],
      onScrollBeginDrag: [],
      onScrollEndDrag: [],
      onMomentumScrollEnd: [],
      onMomentumScrollBegin: [],
      onContentSizeChange: [],
      onEndReached: [],
      onScrollToTop: [],
    };

    this._disposer = noop;
    this.register();
  }

  register() {
    this._disposer = this._scrollHelper.registerScrollEventHelper(this);
  }

  dispose() {
    if (typeof this._disposer === 'function') this._disposer();
  }

  updateInternalHandler(
    fnName: string,
    handler: SyntheticEventHandler | ContentSizeChangeHandler
  ) {
    const internalName = `_${fnName}`;
    if (this[internalName] !== handler) {
      this[internalName] = handler;
      return true;
    }
    return false;
  }

  _dispatchEvent(eventName: ScrollEventHandlerSubscriptionKeys, ...rest) {
    const handlers = this._subscriptions[eventName];

    handlers.forEach(handler => {
      if (typeof handler === 'function') handler.apply(this, rest);
    });
  }

  onScroll(e) {
    if (typeof this._onScroll === 'function') this._onScroll(e);
    this._dispatchEvent('onScroll', e);
  }
  onScrollBeginDrag(e) {
    if (typeof this._onScrollBeginDrag === 'function')
      this._onScrollBeginDrag(e);
    this._dispatchEvent('onScrollBeginDrag', e);
  }
  onScrollEndDrag(e) {
    if (typeof this._onScrollEndDrag === 'function') this._onScrollEndDrag(e);
    this._dispatchEvent('onScrollEndDrag', e);
  }
  onContentSizeChange(w: number, h: number) {
    if (typeof this._onContentSizeChange === 'function')
      this._onContentSizeChange(w, h);
    this._dispatchEvent('onContentSizeChange', w, h);
  }
  onMomentumScrollBegin(e) {
    if (typeof this._onMomentumScrollBegin === 'function')
      this._onMomentumScrollBegin(e);
    this._dispatchEvent('onMomentumScrollBegin', e);
  }
  onMomentumScrollEnd(e) {
    if (typeof this._onMomentumScrollEnd === 'function')
      this._onMomentumScrollEnd(e);
    this._dispatchEvent('onMomentumScrollEnd', e);
  }
  onScrollToTop(e) {
    if (typeof this._onScrollToTop === 'function') this._onScrollToTop(e);
    this._dispatchEvent('onScrollToTop', e);
  }

  onEndReached(props: {
    distanceFromEnd: number;
    contentLength: number;
    visibleLength: number;
    offset: number;
  }) {
    if (typeof this._onEndReached === 'function') this._onEndReached(props);
    this._dispatchEvent('onEndReached', props);
  }

  subscribeEventHandler(
    eventName: ScrollEventHandlerSubscriptionKeys,
    handler: Function
  ) {
    const target = this._subscriptions[eventName];
    if (target) {
      const index = target.findIndex(t => t === handler);
      if (index === -1) target.push(handler as any);
      return () => {
        const target = this._subscriptions[eventName];
        const index = target.findIndex(t => t === handler);
        if (index !== -1) target.splice(index, 1);
      };
    }
    return () => {};
  }
}

export default ScrollEventHelper;
