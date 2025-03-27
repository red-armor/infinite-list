import type { MutableRefObject } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import { Animated } from 'react-native';
import type {
  ContainerObserver,
  IClientRectReadOnly,
} from '@infinite-list/intersection-observer/react-native';
import {
  IntersectionObserver,
  ReactNativeDocumentBase,
} from '@infinite-list/intersection-observer/react-native';
import type { ContentSize, ScrollMetrics } from '@infinite-list/types';
import type SelectValue from '@x-oasis/select-value';
import {
  selectHorizontalValue,
  selectVerticalValue,
} from '@x-oasis/select-value';
import type Marshal from './Marshal';
import type ScrollEventHelper from './ScrollEventHelper';
import Emitter from './commons/Emitter';
import {
  DEFAULT_LAYOUT_MEASUREMENT,
  DEFAULT_SCROLL_EVENT_METRICS,
  DEFAULT_SCROLL_HELPER_LAYOUT,
  DEFAULT_SCROLL_METRICS,
} from './commons/constants';
import { isIos } from './commons/platform';
import RefreshControlService from './controller/RefreshControlService';
import StickyMarshal from './sticky/StickyMarshal';
import type {
  InfiniteListScrollViewRef,
  ScrollEventHandlerSubscriptionKeys,
  ScrollEventMetrics,
  ScrollHelperProps,
  ScrollSize,
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
  id: string;

  readonly intersectionObserver: IntersectionObserver;

  readonly _horizontal: boolean;

  public selectValue: SelectValue;

  private _stickyMarshal: StickyMarshal;

  private _scrollMetrics: ScrollMetrics = DEFAULT_SCROLL_METRICS;

  private _contentSize: ContentSize;

  private _scrollEventMetrics: ScrollEventMetrics =
    DEFAULT_SCROLL_EVENT_METRICS;

  private _layoutMeasurement: ScrollSize;

  private _layout: ViewableItemLayout = DEFAULT_SCROLL_HELPER_LAYOUT;

  private _scrollEventHelpers: ScrollEventHelper[] = [];

  private _ref: InfiniteListScrollViewRef;

  private _marshal: Marshal;

  private _scrollEnabledHandler?: (falsy: boolean) => void;

  public hasInteraction: boolean;

  private onRefreshListeners: Function[] = [];

  private _intersection: IClientRectReadOnly | null = null;

  private _animatedValueX: Animated.Value;

  private _animatedValueY: Animated.Value;

  private _onScrollMetricsChangeEmitter = new Emitter();

  private _intersectionObserverContainer: ContainerObserver | null | undefined;

  private _refreshControlService: RefreshControlService;

  ownerDocument: ReactNativeDocumentBase;

  constructor(props: ScrollHelperProps) {
    const {
      id,
      ref,
      stickyMode,
      horizontal,
      marshal,
      animatedValueX,
      animatedValueY,
      intersectionObserver,
      intersectionObserverCallback,
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
    this._refreshControlService = new RefreshControlService();
    this.resolveScrollMetrics();

    this._animatedValueY = animatedValueY?.current || new Animated.Value(0);
    this._animatedValueX = animatedValueX?.current || new Animated.Value(0);

    this.hasInteraction = false;

    const parentMarshal = this._marshal.getParentMarshal();

    this.ownerDocument = new ReactNativeDocumentBase({
      id,
      node: this._ref,
      ownerDocument: parentMarshal ? parentMarshal.ownerDocument : null,
      onIntersectionChange: this.onIntersectionChangeHandler.bind(this),
    });
    this.getEventHandlers = this.getEventHandlers.bind(this);
    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onMomentumScrollEnd = this.onMomentumScrollEnd.bind(this);
    this.onScrollEndDrag = this.onScrollEndDrag.bind(this);
    this.onScrollBeginDrag = this.onScrollBeginDrag.bind(this);
    this.onMomentumScrollBegin = this.onMomentumScrollBegin.bind(this);
    this.onScrollToTop = this.onScrollToTop.bind(this);

    const nextIntersectionObserver =
      intersectionObserverCallback ||
      ((entries: any, observer: any) => {
        // do nothing
      });

    this.intersectionObserver =
      intersectionObserver ||
      new IntersectionObserver(nextIntersectionObserver, {
        root: this.ownerDocument,
      });

    const info = this.intersectionObserver.addDoc(this.ownerDocument);
    this._intersectionObserverContainer = info.container;
  }

  get ownerScrollHelper() {
    return this._marshal.scrollHelper;
  }

  get refreshControlService() {
    return this._refreshControlService;
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

  /**
   * The nested ScrollView state result is updated by intersection change..
   */
  onIntersectionChangeHandler(intersection: IClientRectReadOnly | null) {
    this._intersection = intersection;
    this.resolveScrollMetrics();
    this.onScrollMetricsChange();
  }

  addOnRefreshListener(fn: Function) {
    const index = this.onRefreshListeners.indexOf(fn);

    if (index === -1) this.onRefreshListeners.push(fn);
    return () => {
      const index = this.onRefreshListeners.indexOf(fn);
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

  addScrollEnabledHandler(handler: (falsy: boolean) => void) {
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
    const index = this._scrollEventHelpers.indexOf(scrollEventHelper);
    if (index === -1) {
      this._scrollEventHelpers.push(scrollEventHelper);
    }

    return () => {
      const index = this._scrollEventHelpers.indexOf(scrollEventHelper);
      if (index !== -1) this._scrollEventHelpers.splice(index, 1);
    };
  }

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
    this.onScrollMetricsChange();
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
   * To update `this._scrollMetrics`, should be triggered `onScroll` or
   * `onContentSizeChange`
   */
  resolveScrollMetrics() {
    const timestamp = Date.now();
    const scrollEventMetrics = this.getScrollEventMetrics();
    const { contentOffset } = scrollEventMetrics;
    const contentLength = this.selectValue.selectLength(this.contentSize);

    const visibleLength = !this._intersection
      ? 0
      : this.selectValue.selectLength(this._intersection);
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

  onScrollMetricsChange() {
    this._onScrollMetricsChangeEmitter.fire(
      'scroll-metrics-change',
      this._scrollMetrics
    );
  }

  addScrollMetricsChangeListener(cb: any) {
    return this._onScrollMetricsChangeEmitter.on('scroll-metrics-change', cb);
  }

  getScrollMetrics() {
    return this._scrollMetrics;
  }

  /**
   *
   * @param metrics
   */
  setScrollEventMetrics(metrics: ScrollEventMetrics) {
    const { layoutMeasurement } = metrics;
    this.setLayout(layoutMeasurement);
    this._scrollEventMetrics = metrics;
    this.resolveScrollMetrics();
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

  addScrollEventChangeListener(
    cb: (metrics: NativeSyntheticEvent<NativeScrollEvent>) => void
  ) {
    this._onScrollMetricsChangeEmitter.on('scroll-event-change', cb);
  }

  handleScrollEventChange(
    scrollEvent: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const metrics = scrollEvent.nativeEvent;
    this.setLayout(metrics.layoutMeasurement);
    this._scrollEventMetrics = metrics;
    this.resolveScrollMetrics();
    this._onScrollMetricsChangeEmitter.fire('scroll-event-change', scrollEvent);
    this.onScrollMetricsChange();
    this.ownerDocument.onScrollEventChange(scrollEvent);
  }

  onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.recordInteraction();
    this.handleScrollEventChange(e);
    this.triggerScrollEventHelpers('onScroll', {
      nativeEvent: {
        ...e.nativeEvent,
      },
    });
    this.refreshControlService.receiveOnScrollEvent(e);
  }

  onScrollBeginDrag(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.handleScrollEventChange(e);
    this.triggerScrollEventHelpers('onScrollBeginDrag', {
      nativeEvent: {
        ...e.nativeEvent,
      },
    });
    this.refreshControlService.receiveOnScrollBeginDragEvent(e);
  }

  onScrollEndDrag(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.triggerScrollEventHelpers('onScrollEndDrag', {
      nativeEvent: {
        ...e.nativeEvent,
      },
    });
    this.refreshControlService.receiveOnScrollEndDragEvent(e);
  }

  onMomentumScrollBegin(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.handleScrollEventChange(e);
    this.triggerScrollEventHelpers('onMomentumScrollBegin', {
      nativeEvent: {
        ...e.nativeEvent,
      },
    });
  }

  onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.handleScrollEventChange(e);
    this.triggerScrollEventHelpers('onMomentumScrollEnd', e);
  }

  onContentSizeChange(width: number, height: number) {
    this._contentSize = { width, height };
    this.resolveScrollMetrics();
    this.triggerScrollEventHelpers('onContentSizeChange', width, height);

    this._intersectionObserverContainer?.updateIntersection();
  }

  onScrollToTop(e: NativeSyntheticEvent<NativeScrollEvent>) {
    this.handleScrollEventChange(e);

    this.triggerScrollEventHelpers('onScrollToTop', {
      nativeEvent: {
        ...e.nativeEvent,
      },
    });
  }

  onLayout(e: LayoutChangeEvent) {
    const {
      nativeEvent: { layout },
    } = e;
    const scrollHelper = this._marshal?.getScrollHelper();
    if (!this._marshal?.isRootScroller) {
      const parentLayout = scrollHelper?.getLayout();
      if (parentLayout)
        scrollHelper.setLayout({
          ...layout,
          width: parentLayout.width,
          height: parentLayout.height,
        });
    } else {
      scrollHelper?.setLayout(layout);
    }

    this._intersectionObserverContainer?.updateIntersection();
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
