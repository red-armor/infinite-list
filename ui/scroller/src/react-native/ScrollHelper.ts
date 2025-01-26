import { ItemsDimensions } from '@infinite-list/items-dimensions';
import { ItemMeta } from '@infinite-list/item-meta';
import SelectValue, {
  selectHorizontalValue,
  selectVerticalValue,
} from '@x-oasis/select-value';
import { MutableRefObject } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

import Marshal from './Marshal';
import ScrollEventHelper from './ScrollEventHelper';
import StickyMarshal from './StickyMarshal';
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
  SpectrumScrollViewRef,
  StickyMode,
  ViewableItemLayout,
} from './types';

/**
 * The same direction ScrollView only has one ScrollHelper, it only belong to the root
 * ScrollView. The usage of ScrollHelper is to trigger registered ScrollEventHelper
 *
 * - nested scroller 对于嵌套的scrollHelper，处理视窗逻辑主要是分两种情况
 *   - 初始化
 *     - onContentSizeChanged: 解没有parentScrollHelper的情况，也就是自己就是顶层
 *     - onLayout: 解不是root的时候，这个时候要先知道自己的布局，才能够计算它的children
 *   - 有元素滚动
 *     - 这个时候主要就是通过ItemDimensions来解决了
 *
 *   问题点：
 *     - 挂载的问题，现在ScrollView的整体设计是基于ScrollHelper来实现的。所以现在Item的话，
 *       同样是相对于parent scrollHelper来进行处理
 */
class ScrollHelper {
  public id: string;

  public selectValue: SelectValue;

  private _reverseOrientationRootChildren: ScrollHelper[] = [];

  // readonly _parentScrollHelper: ScrollHelper;

  /**
   * Inspired from https://github.com/GoogleChromeLabs/intersection-observer/blob/main/intersection-observer.js#L424
   * more info refer to https://developer.mozilla.org/en-US/docs/Web/API/Node/ownerDocument
   */
  public ownerScrollHelper: ScrollHelper | null | undefined;

  private _stickyMarshal: StickyMarshal;

  private _scrollMetrics: ScrollMetrics = DEFAULT_SCROLL_METRICS;

  private _contentSize: ContentSize;

  private _scrollEventMetrics: ScrollEventMetrics =
    DEFAULT_SCROLL_EVENT_METRICS;

  private _layoutMeasurement: ScrollSize;

  private _layout: ViewableItemLayout = DEFAULT_SCROLL_HELPER_LAYOUT;

  private _dimensionsMeta: ItemMeta;

  private _scrollEventHelpers: ScrollEventHelper[] = [];

  private _ref: SpectrumScrollViewRef;

  readonly _horizontal: boolean;

  private _marshal: Marshal;

  private _scrollEnabledHandler?: { (falsy: boolean): void };

  public hasInteraction: boolean;

  // public setMarshal: (marshal: Marshal) => void;

  private onRefreshListeners: Function[] = [];

  constructor(props: ScrollHelperProps) {
    const { id, ref, stickyMode, horizontal, marshal } = props;
    this._marshal = marshal;

    this.id = id;
    this._ref = ref;
    // this.ownerScrollHelper = ownerScrollHelper;
    this._stickyMarshal = new StickyMarshal({
      stickyMode,
    });
    this._horizontal = horizontal;
    this.selectValue = horizontal ? selectHorizontalValue : selectVerticalValue;
    this._layoutMeasurement = DEFAULT_LAYOUT_MEASUREMENT;
    this._contentSize = DEFAULT_SCROLL_EVENT_METRICS.contentSize;
    this.resolveScrollMetrics();

    this.hasInteraction = false;

    this.onViewableHandler = this.onViewableHandler.bind(this);

    // this.setMarshal = this._setMarshal.bind(this);

    this._dimensionsMeta = this.prepareNested();
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
    // const marshal = this.getMarshal();
    // if (!this._scrollEventHelper && marshal) {
    //   this._scrollEventHelper = new ScrollEventHelper({
    //     scrollHelper: this,
    //   });
    // }

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

  cleanup() {
    if (this._dimensionsMeta) {
      // do nothing, waiting for InfiniteList update..
    }
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

  registerReverseOrientationChild(child: ScrollHelper) {
    const index = this._reverseOrientationRootChildren.findIndex(
      (v) => v === child
    );
    if (index === -1) this._reverseOrientationRootChildren.push(child);

    return () => {
      const index = this._reverseOrientationRootChildren.findIndex(
        (v) => v === child
      );
      if (index !== -1) this._reverseOrientationRootChildren.splice(index, 1);
    };
  }

  onViewableHandler() {
    this._marshal?.dimensions.updateScrollMetrics(this._scrollMetrics);
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
  prepareNested() {
    const dimensions = this.getItemsDimensions();
    if (!dimensions) return null;
    const meta = dimensions.ensureKeyMeta(this.id, this.id);
    meta.addStateEventListener('viewable', this.onViewableHandler);
    return meta;
  }

  // TODO
  getItemsDimensions() {
    return null;
    // if (!this._parentScrollHelper) return null;

    // const rootMarshal = this._parentScrollHelper.getMarshal();

    // // 这个肯定是ItemsDimensions
    // return rootMarshal.dimensions;
  }

  setLayout(layout: ViewableItemLayout | ScrollSize) {
    this._layout = this._layout
      ? { ...this._layout, ...layout }
      : {
          ...DEFAULT_SCROLL_HELPER_LAYOUT,
          ...layout,
        };

    const dimensions = this.getItemsDimensions();
    if (dimensions)
      (dimensions as ItemsDimensions).setKeyItemLayout(this.id, this._layout);
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
    // this._marshal?.dimensions.updateScrollMetrics(this._scrollMetrics);
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
    // this._marshal?.dimensions.updateScrollMetrics(this._scrollMetrics);
  }

  onContentSizeChange(width: number, height: number) {
    this._contentSize = { width, height };
    this.resolveScrollMetrics();
    this.triggerScrollEventHelpers('onContentSizeChange', width, height);

    // if (!this._horizontal)
    //   this._marshal?.dimensions.updateScrollMetrics(this._scrollMetrics);
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
