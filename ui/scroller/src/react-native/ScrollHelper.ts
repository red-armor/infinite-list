import SelectValue, {
  selectHorizontalValue,
  selectVerticalValue,
} from '@x-oasis/select-value';
import { MutableRefObject } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Animated,
} from 'react-native';
import { ReactNativeDocumentBase } from '@infinite-list/intersection-observer/react-native';

import Marshal from './Marshal';
import ScrollEventHelper from './ScrollEventHelper';
import StickyMarshal from './sticky/StickyMarshal';
import {
  DEFAULT_LAYOUT_MEASUREMENT,
  DEFAULT_SCROLL_EVENT_METRICS,
  DEFAULT_SCROLL_HELPER_LAYOUT,
  DEFAULT_SCROLL_METRICS,
} from './commons/constants';
import { isIos } from './commons/platform';
import { ScrollMetrics, ContentSize } from '@infinite-list/types';
import {
  ScrollEventHandlerSubscriptionKeys,
  ScrollEventMetrics,
  ScrollHelperProps,
  ScrollSize,
  InfiniteListScrollViewRef,
  StickyMode,
  ViewableItemLayout,
} from './types';

/**
 * The same direction ScrollView only has one ScrollHelper, it only belongs to the root
 * ScrollView. The usage of ScrollHelper is to trigger registered ScrollEventHelper
 *
 * - For nested scrollers, there are two main scenarios for handling viewport logic:
 *   - Initialization
 *     - onContentSizeChanged: Handles cases without a parentScrollHelper (when it's the top level)
 *     - onLayout: Handles non-root cases, where we need to know its own layout first to calculate its children
 *   - Element scrolling
 *     - This is mainly handled through ItemDimensions
 *
 *   Issues:
 *     - Mounting: The current ScrollView design is based on ScrollHelper implementation.
 *       Therefore, Items are also processed relative to the parent scrollHelper
 */
class ScrollHelper {
  public id: string;

  public selectValue: SelectValue;

  // private _reverseOrientationRootChildren: ScrollHelper[] = [];

  private _stickyMarshal: StickyMarshal;

  private _scrollMetrics: ScrollMetrics = DEFAULT_SCROLL_METRICS;

  private _contentSize: ContentSize;

  private _scrollEventMetrics: ScrollEventMetrics =
    DEFAULT_SCROLL_EVENT_METRICS;

  private _layoutMeasurement: ScrollSize;

  private _layout: ViewableItemLayout = DEFAULT_SCROLL_HELPER_LAYOUT;

  private _scrollEventHelpers: ScrollEventHelper[] = [];

  private _ref: InfiniteListScrollViewRef;

  readonly _horizontal: boolean;

  private _marshal: Marshal;

  private _scrollEnabledHandler?: { (falsy: boolean): void };

  public hasInteraction: boolean;

  private onRefreshListeners: Function[] = [];

  ownerDocument: ReactNativeDocumentBase;

  private _animatedValueX: Animated.Value;

  private _animatedValueY: Animated.Value;

  constructor(props: ScrollHelperProps) {
    const {
      id,
      ref,
      stickyMode,
      horizontal,
      marshal,
      animatedValueX,
      animatedValueY,
    } = props;
    this._marshal = marshal;

    this.id = id;
    this._ref = ref;
    this._stickyMarshal = new StickyMarshal({
      stickyMode,
      marshal: this._marshal,
    });
    this._horizontal = horizontal;
    this.selectValue = horizontal ? selectHorizontalValue : selectVerticalValue;
    this._layoutMeasurement = DEFAULT_LAYOUT_MEASUREMENT;
    this._contentSize = DEFAULT_SCROLL_EVENT_METRICS.contentSize;
    this.resolveScrollMetrics();

    this._animatedValueY = animatedValueY?.current || new Animated.Value(0);
    this._animatedValueX = animatedValueX?.current || new Animated.Value(0);

    this.hasInteraction = false;

    const parentMarshal = this._marshal.getParentMarshal();

    this.ownerDocument = new ReactNativeDocumentBase({
      id,
      node: this._ref,
      ownerDocument: parentMarshal ? parentMarshal.ownerDocument : null,
    });
    this.getEventHandlers = this.getEventHandlers.bind(this);
    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onMomentumScrollEnd = this.onMomentumScrollEnd.bind(this);
    this.onScrollEndDrag = this.onScrollEndDrag.bind(this);
    this.onScrollBeginDrag = this.onScrollBeginDrag.bind(this);
    this.onMomentumScrollBegin = this.onMomentumScrollBegin.bind(this);
    this.onScrollToTop = this.onScrollToTop.bind(this);
  }

  get ownerScrollHelper() {
    return this._marshal.scrollHelper;
  }

  addEventListener(
    eventName: ScrollEventHandlerSubscriptionKeys,
    handler: Function
  ) {
    return this._marshal
      .getScrollEventHelper()
      .subscribeEventHandler(eventName, handler);
  }

  addListener(
    eventName: ScrollEventHandlerSubscriptionKeys,
    handler: Function
  ) {
    return this._marshal
      .getScrollEventHelper()
      .subscribeEventHandler(eventName, handler);
  }

  addOnRefreshListener(fn: Function) {
    const index = this.onRefreshListeners.findIndex(
      (listener) => fn === listener
    );

    if (index === -1) this.onRefreshListeners.push(fn);
    return () => {
      const index = this.onRefreshListeners.findIndex(
        (listener) => fn === listener
      );
      if (index !== -1) this.onRefreshListeners.splice(index, 1);
    };
  }

  invokeOnRefreshListener() {
    this.onRefreshListeners.forEach((fn) => fn.call(this));
  }

  getMarshal() {
    return this._marshal;
  }

  getStickyMarshal() {
    return this._stickyMarshal;
  }

  getHorizontal() {
    return this._horizontal;
  }

  get contentSize() {
    return this._contentSize;
  }

  getAnimatedValue() {
    return this._horizontal ? this._animatedValueX : this._animatedValueY;
  }

  addScrollEnabledHandler(handler: { (falsy: boolean): void }) {
    this._scrollEnabledHandler = handler;
  }

  enableScroll() {
    if (typeof this._scrollEnabledHandler === 'function') {
      this._scrollEnabledHandler(true);
    }
  }

  disableScroll() {
    if (typeof this._scrollEnabledHandler === 'function') {
      this._scrollEnabledHandler(false);
    }
  }

  registerScrollEventHelper(scrollEventHelper: ScrollEventHelper) {
    const index = this._scrollEventHelpers.findIndex(
      (e) => scrollEventHelper === e
    );
    if (index === -1) {
      this._scrollEventHelpers.push(scrollEventHelper);
    }

    return () => {
      const index = this._scrollEventHelpers.findIndex(
        (e) => scrollEventHelper === e
      );
      if (index !== -1) this._scrollEventHelpers.splice(index, 1);
    };
  }

  // registerReverseOrientationChild(child: ScrollHelper) {
  //   const index = this._reverseOrientationRootChildren.findIndex(
  //     (v) => v === child
  //   );
  //   if (index === -1) this._reverseOrientationRootChildren.push(child);

  //   return () => {
  //     const index = this._reverseOrientationRootChildren.findIndex(
  //       (v) => v === child
  //     );
  //     if (index !== -1) this._reverseOrientationRootChildren.splice(index, 1);
  //   };
  // }

  /**
   *
   * @returns
   *
   * To ensure the nested reverse direction ScrollView should be in considered..
   * for example, vertical ScrollView include a horizontal ScrollView, when scrolling
   * on vertical ScrollView, the horizontal ScrollView should be checked whether it
   * is in viewport as well...
   *
   */
  // prepareNested() {
  //   const dimensions = this.getItemsDimensions();
  //   if (!dimensions) return null;
  //   const meta = dimensions.ensureKeyMeta(this.id, this.id);
  //   meta.addStateEventListener('viewable', this.onViewableHandler);
  //   return meta;
  // }

  setLayout(layout: ViewableItemLayout | ScrollSize) {
    this._layout = this._layout
      ? { ...this._layout, ...layout }
      : {
          ...DEFAULT_SCROLL_HELPER_LAYOUT,
          ...layout,
        };
    this.resolveScrollMetrics();
  }

  getLayout() {
    return this._layout;
  }

  getRef() {
    return this._ref;
  }

  getSelectValue() {
    return this.selectValue;
  }

  triggerScrollEventHelpers(
    handlerName: ScrollEventHandlerSubscriptionKeys,
    ...rest: any[]
  ) {
    this._scrollEventHelpers.forEach((helper) => {
      if (helper.marshal.scrollUpdateEnabled) {
        // @ts-ignore
        helper[handlerName](...rest);
      }
    });
  }

  /**
   *
   * @param scrollEventMetrics ScrollEventMetrics
   * @return null
   *
   * To update `this._scrollMetrics`, should be triggered `onScroll` or `onContentSizeChange`
   */
  resolveScrollMetrics() {
    const timestamp = Date.now();
    const scrollEventMetrics = this.getScrollEventMetrics();
    const { contentOffset } = scrollEventMetrics;
    const contentLength = this.selectValue.selectLength(this.contentSize);
    const visibleLength = this.selectValue.selectLength(this.getLayout());
    const offset = this.selectValue.selectOffset(contentOffset);
    const dOffset = offset - this._scrollMetrics?.offset || 0;
    const dt = this._scrollMetrics?.timestamp
      ? Math.max(1, timestamp - this._scrollMetrics.timestamp)
      : 1;
    const velocity = dOffset / dt;

    this._scrollMetrics = {
      ...this._scrollMetrics,
      contentLength,
      offset,
      visibleLength,
      velocity,
      timestamp,
    };
  }

  getScrollMetrics() {
    return this._scrollMetrics;
  }

  setScrollEventMetrics(metrics: ScrollEventMetrics) {
    const { layoutMeasurement } = metrics;
    this.setLayout(layoutMeasurement);
    this._scrollEventMetrics = metrics;
  }

  getScrollEventMetrics() {
    return {
      ...this._scrollEventMetrics,
      layoutMeasurement: this._layoutMeasurement,
    };
  }

  recordInteraction() {
    this.hasInteraction = true;
  }

  onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.recordInteraction();

    this.setScrollEventMetrics(e.nativeEvent);
    this.resolveScrollMetrics();

    this.triggerScrollEventHelpers('onScroll', {
      nativeEvent: {
        ...e.nativeEvent,
      },
    });
  }

  onScrollBeginDrag(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.triggerScrollEventHelpers('onScrollBeginDrag', {
      nativeEvent: {
        ...e.nativeEvent,
      },
    });
  }

  onScrollEndDrag(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.triggerScrollEventHelpers('onScrollEndDrag', {
      nativeEvent: {
        ...e.nativeEvent,
      },
    });
  }

  onMomentumScrollBegin(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.triggerScrollEventHelpers('onMomentumScrollBegin', {
      nativeEvent: {
        ...e.nativeEvent,
      },
    });
  }

  onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.setScrollEventMetrics(e.nativeEvent);
    this.resolveScrollMetrics();
    this.triggerScrollEventHelpers('onMomentumScrollEnd', e);
  }

  onContentSizeChange(width: number, height: number) {
    this._contentSize = { width, height };
    this.resolveScrollMetrics();
    this.triggerScrollEventHelpers('onContentSizeChange', width, height);
  }

  onScrollToTop(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.triggerScrollEventHelpers('onScrollToTop', {
      nativeEvent: {
        ...e.nativeEvent,
      },
    });
  }

  getEventHandlers() {
    const platformProps = {} as any;

    if (isIos) {
      platformProps.onScrollToTop = this.onScrollToTop;
    }

    return {
      onScroll: this.onScroll,
      onScrollBeginDrag: this.onScrollBeginDrag,
      onScrollEndDrag: this.onScrollEndDrag,
      onMomentumScrollBegin: this.onMomentumScrollBegin,
      onMomentumScrollEnd: this.onMomentumScrollEnd,
      onContentSizeChange: this.onContentSizeChange,
      ...platformProps,
    };
  }

  scrollTo(options: { x?: number; y?: number; animated?: boolean }) {
    const ref = this.getRef();
    if (ref.current.scrollTo) {
      ref.current.scrollTo(options);
    } else if (
      // @ts-expect-error
      ref.current?.getNode
    ) {
      // @ts-expect-error
      ref.current.getNode().scrollTo(options);
    } else {
      (ref as MutableRefObject<ScrollView>).current.scrollTo(options);
    }
  }
}

export default ScrollHelper;
