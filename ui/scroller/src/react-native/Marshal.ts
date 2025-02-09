import { ScrollView } from 'react-native';
import ScrollHelper from './ScrollHelper';
import {
  InfiniteListScrollViewRef,
  MarshalProps,
  ScrollEventHandler,
  ScrollEventHandlerSubscriptionKeys,
} from './types';
import ScrollEventHelper from './ScrollEventHelper';

/**
 * Marshal is bound to ScrollView which means every ScrollView will has its own
 * marshal, and you can get marshal value through `ScrollViewContext`
 */
class Marshal {
  readonly _horizontal: boolean;
  readonly _animated: boolean;

  readonly _rootScrollHelper: ScrollHelper;

  readonly scrollEventHelper: ScrollEventHelper;

  readonly _id: string;

  private _parentMarshal: Marshal | null;

  private _children: Marshal[] = [];

  private _reverseOrientationChildren: Marshal[] = [];

  private _ref: InfiniteListScrollViewRef;

  private _disposers: Function[] = [];

  private _scrollUpdating: boolean;

  /**
   * Indicate the marshal binding ScrollView is the root ScrollView; it will
   * be useful when has nested ScrollView
   */
  private _isRootScroller: boolean;

  /**
   * Inspired from https://github.com/GoogleChromeLabs/intersection-observer/blob/main/intersection-observer.js#L424
   * more info refer to https://developer.mozilla.org/en-US/docs/Web/API/Node/ownerDocument
   */
  // public ownerScrollHelper: ScrollHelper | null | undefined;

  /**
   * implement ReactNativeDocument
   */
  // ownerDocument: ReactNativeDocumentBase | null;
  // public ownerDocument: ScrollHelper | null | undefined;
  public node: ScrollView;

  constructor(props: MarshalProps) {
    const {
      id,
      ref,
      parentMarshal,
      animated = false,
      horizontal = false,
      scrollUpdating = true,
      animatedValueX,
      animatedValueY,

      onScroll,
      onScrollToTop,
      onScrollEndDrag,
      onScrollBeginDrag,
      onContentSizeChange,
      onMomentumScrollEnd,
      onMomentumScrollBegin,

      intersectionObserver,
      intersectionObserverCallback,

      stickyMode,
    } = props;
    this._ref = ref;
    this.node = ref.current;

    this._id = id;

    this._animated = animated;
    this._horizontal = horizontal;
    this._scrollUpdating = scrollUpdating;
    this._parentMarshal = parentMarshal;

    const rootScrollHelper = parentMarshal?.scrollHelper;

    if (!rootScrollHelper || rootScrollHelper.getHorizontal() !== horizontal) {
      this._rootScrollHelper = new ScrollHelper({
        marshal: this,
        id,
        stickyMode,
        horizontal,
        ref,
        animatedValueX,
        animatedValueY,
        intersectionObserver,
        intersectionObserverCallback,
      });
      this._isRootScroller = true;
    } else {
      this._rootScrollHelper = rootScrollHelper;
      this._isRootScroller = false;
    }

    this.scrollEventHelper = new ScrollEventHelper({
      marshal: this,
      onScroll,
      onScrollToTop,
      onScrollEndDrag,
      onScrollBeginDrag,
      onContentSizeChange,
      onMomentumScrollEnd,
      onMomentumScrollBegin,
    });
  }

  get ownerDocument() {
    return this._rootScrollHelper.ownerDocument;
  }

  get intersectionObserver() {
    return this._rootScrollHelper.intersectionObserver;
  }

  get scrollHelper() {
    return this._rootScrollHelper;
  }

  get isRootScroller() {
    return this._isRootScroller;
  }

  enableScrollUpdating() {
    this._scrollUpdating = true;
  }

  disableScrollUpdating() {
    this._scrollUpdating = false;
  }

  getScrollEventHelper() {
    return this.scrollEventHelper;
  }

  getScrollHelper() {
    return this._rootScrollHelper;
  }

  get scrollUpdateEnabled() {
    return !!this._scrollUpdating;
  }

  getParentMarshal() {
    return this._parentMarshal;
  }

  // Since marshal is bound to ScrollView, and each ScrollView has a `rootScrollHelper`
  // it can be either self or parent scrollHelper
  getRootScrollHelper() {
    return this._rootScrollHelper;
  }

  // register() {
  //   if (this._parentMarshal) {
  //     const isSameOrientation =
  //       this._parentMarshal.isHorizontal() === this.isHorizontal();
  //     this._disposers.push(
  //       this._parentMarshal.registerAsNestedChild(this, !isSameOrientation)
  //     );
  //   }
  // }

  dispose() {
    this._disposers.forEach((disposer) => {
      if (typeof disposer === 'function') disposer();
    });
  }

  // getOuterMostSameOrientationMarshal() {
  //   if (this.isHorizontal())
  //     return this.getOuterMostHorizontalMarshal() || this;
  //   return this.getOuterMostVerticalMarshal() || this;
  // }

  // getClosestSameOrientationMarshal() {
  //   const outerMost = this.getOuterMostSameOrientationMarshal();
  //   if (outerMost === this) return this;

  //   let marshal = this._parentMarshal;

  //   while (marshal && marshal.isHorizontal() !== this.isHorizontal()) {
  //     marshal = marshal._parentMarshal;
  //   }

  //   return marshal;
  // }

  // hasParent() {
  //   return this.getOuterMostSameOrientationMarshal() !== this;
  // }

  getRef() {
    return this._ref;
  }

  getRootRef() {
    return this._rootScrollHelper.getRef();
  }

  // getAnimated(): boolean {
  //   const marshal = this.getOuterMostSameOrientationMarshal();
  //   if (this === marshal) return this._animated;
  //   return marshal.getAnimated();
  // }

  addEventListener(
    type: ScrollEventHandlerSubscriptionKeys,
    listener: ScrollEventHandler,
    options?: boolean | AddEventListenerOptions
  ) {
    return this.scrollEventHelper.subscribeEventHandler(type, listener);
  }

  getAnimatedValue() {
    return this.scrollHelper.getAnimatedValue();
  }

  isHorizontal() {
    return !!this._horizontal;
  }

  registerAsNestedChild(child: Marshal, isReverse = false) {
    const children = isReverse
      ? this._reverseOrientationChildren
      : this._children;
    const index = children.findIndex((t) => t === child);
    if (index === -1) children.push(child);
    return () => {
      this.unregisterAsNestedChild(child, isReverse);
    };
  }

  unregisterAsNestedChild(child: Marshal, isReverse = false) {
    const children = isReverse
      ? this._reverseOrientationChildren
      : this._children;

    const index = children.findIndex((t) => t === child);
    if (index !== -1) children.splice(index, 1);
  }
}

export default Marshal;
