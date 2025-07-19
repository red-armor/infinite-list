import noop from '@x-oasis/noop';
import Marshal from './Marshal';
import {
  ContentSizeChangeHandler,
  InternalScrollEventHandlerSubscriptionKeys,
  ScrollEventHandlerSubscriptionKeys,
  ScrollEventHandlerSubscriptions,
  ScrollEventHelperProps,
  SyntheticEventHandler,
  SyntheticEventHandlerEvent,
} from './types';

/**
 * ScrollEventHelper is bound to ScrollView, Every ScrollView will has its own
 * `ScrollEventHelper`. then ScrollEventHelper will register to ScrollHelper,
 * the ScrollEventHelper event is actually triggered by root ScrollHelper.
 */
class ScrollEventHelper {
  private _disposer: () => void;
  readonly marshal: Marshal;
  private _onScroll: SyntheticEventHandler | undefined;
  private _onScrollEndDrag: SyntheticEventHandler | undefined;
  private _onScrollBeginDrag: SyntheticEventHandler | undefined;
  private _onContentSizeChange: ContentSizeChangeHandler | undefined;
  private _onMomentumScrollEnd: SyntheticEventHandler | undefined;
  private _onMomentumScrollBegin: SyntheticEventHandler | undefined;
  private _onScrollToTop: SyntheticEventHandler | undefined;
  private _subscriptions: ScrollEventHandlerSubscriptions;

  constructor(props: ScrollEventHelperProps) {
    const {
      marshal,
      onScroll,
      onScrollToTop,
      onScrollEndDrag,
      onScrollBeginDrag,
      onContentSizeChange,
      onMomentumScrollEnd,
      onMomentumScrollBegin,
    } = props;

    this.marshal = marshal;
    this._onScroll = onScroll;
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
      onScrollToTop: [],
    };

    this._disposer = noop;
    this.register();
  }

  register() {
    this._disposer = this.marshal
      .getScrollHelper()
      .registerScrollEventHelper(this);
  }

  dispose() {
    if (typeof this._disposer === 'function') this._disposer();
  }

  /**
   *
   * @param fnName
   * @param handler
   * @returns
   *
   * Usage for the updating condition.
   * Internal handler is passing from ScrollView Props, it may change any time.
   *
   */
  updateInternalHandler(
    fnName: ScrollEventHandlerSubscriptionKeys,
    handler?: SyntheticEventHandler | ContentSizeChangeHandler
  ) {
    const key = `_${fnName}` as InternalScrollEventHandlerSubscriptionKeys;
    if (this[key] !== handler) {
      this[key] = handler as any;
      return true;
    }
    return false;
  }

  updateInternalHandlers(handlersMap: {
    [key in ScrollEventHandlerSubscriptionKeys]:
      | SyntheticEventHandler
      | ContentSizeChangeHandler
      | undefined;
  }) {
    Object.keys(handlersMap).forEach((key) => {
      const typedKey = key as ScrollEventHandlerSubscriptionKeys;
      const handler = handlersMap[typedKey];
      this.updateInternalHandler(typedKey, handler);
    });
  }

  // @ts-expect-error - Dynamic event dispatch with variable arguments
  _dispatchEvent(eventName: ScrollEventHandlerSubscriptionKeys, ...rest) {
    const handlers = this._subscriptions[eventName];

    handlers.forEach((handler) => {
      // @ts-expect-error - Dynamic function call with variable arguments
      if (typeof handler === 'function') handler.apply(this, rest);
      // if (typeof handler === 'function') handler.apply(this, rest);
    });
  }

  onScroll(e: SyntheticEventHandlerEvent) {
    if (typeof this._onScroll === 'function') this._onScroll(e);
    this._dispatchEvent('onScroll', e);
  }

  onScrollBeginDrag(e: SyntheticEventHandlerEvent) {
    if (typeof this._onScrollBeginDrag === 'function')
      this._onScrollBeginDrag(e);
    this._dispatchEvent('onScrollBeginDrag', e);
  }

  onScrollEndDrag(e: SyntheticEventHandlerEvent) {
    if (typeof this._onScrollEndDrag === 'function') this._onScrollEndDrag(e);
    this._dispatchEvent('onScrollEndDrag', e);
  }

  onContentSizeChange(w: number, h: number) {
    if (typeof this._onContentSizeChange === 'function')
      this._onContentSizeChange(w, h);
    this._dispatchEvent('onContentSizeChange', w, h);
  }

  onMomentumScrollBegin(e: SyntheticEventHandlerEvent) {
    if (typeof this._onMomentumScrollBegin === 'function')
      this._onMomentumScrollBegin(e);
    this._dispatchEvent('onMomentumScrollBegin', e);
  }

  onMomentumScrollEnd(e: SyntheticEventHandlerEvent) {
    if (typeof this._onMomentumScrollEnd === 'function')
      this._onMomentumScrollEnd(e);
    this._dispatchEvent('onMomentumScrollEnd', e);
  }

  onScrollToTop(e: SyntheticEventHandlerEvent) {
    if (typeof this._onScrollToTop === 'function') this._onScrollToTop(e);
    this._dispatchEvent('onScrollToTop', e);
  }

  subscribeEventHandler(
    eventName: ScrollEventHandlerSubscriptionKeys,
    handler: (...args: any[]) => void
  ) {
    const target = this._subscriptions[eventName];
    if (target) {
      const index = target.findIndex((t) => t === handler);
      if (index === -1) target.push(handler as any);
      return () => {
        const target = this._subscriptions[eventName];
        const index = target.findIndex((t) => t === handler);
        if (index !== -1) target.splice(index, 1);
      };
    }
    return () => {
      //
    };
  }
}

export default ScrollEventHelper;
