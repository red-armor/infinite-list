import { MutableRefObject } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

import ScrollHelper from './ScrollHelper';
import {
  ContentSizeChangeHandler,
  DataModelDimensions,
  EventHandler,
  ScrollHandlerName,
  SetScrollUpdating,
  SpectrumScrollViewRef,
} from './types';

class Marshal {
  readonly _horizontal: boolean;

  readonly _animated: boolean;

  readonly _rootScrollHelper: ScrollHelper;

  readonly _id: string;

  readonly _removeClippedSubviews: boolean;

  private _parentMarshal: Marshal;

  private _children: Marshal[] = [];

  private _reverseOrientationChildren: Marshal[] = [];

  // note：这个ref目前看起来是没有太大的意义，更多的应该是
  //       rootScrollHelper对应的ref；
  private _ref: SpectrumScrollViewRef;

  private _disposers: Function[] = [];

  private _scrollUpdating: boolean;

  private _setScrollUpdating: SetScrollUpdating;

  // @ts-ignore
  private _onScroll: EventHandler;

  // @ts-ignore
  private _onScrollEndDrag: EventHandler;

  // @ts-ignore
  private _onScrollBeginDrag: EventHandler;

  // @ts-ignore
  private _onMomentumScrollEnd: EventHandler;

  // @ts-ignore
  private _onMomentumScrollBegin: EventHandler;

  // @ts-ignore
  private _onContentSizeChange: ContentSizeChangeHandler;

  private _outerMostVerticalMarshal: Marshal;

  private _outerMostHorizontalMarshal: Marshal;

  private _dimensions: DataModelDimensions;

  constructor(props: {
    id: string;
    dimensions: DataModelDimensions;
    animated?: boolean;
    horizontal?: boolean;
    parentMarshal: Marshal;
    scrollUpdating?: boolean;
    scrollHelper?: ScrollHelper;
    setScrollUpdating: SetScrollUpdating;
    outerMostVerticalMarshal: Marshal;
    outerMostHorizontalMarshal: Marshal;
    removeClippedSubviews: boolean;
    ref: MutableRefObject<ScrollView | View | undefined>;
  }) {
    const {
      id,
      ref,
      dimensions,
      scrollHelper,
      parentMarshal,
      animated = false,
      horizontal = false,
      scrollUpdating = true,
      removeClippedSubviews,
      outerMostVerticalMarshal,
      outerMostHorizontalMarshal,
      setScrollUpdating,
    } = props;
    this._ref = ref;
    this._id = id;
    this._animated = animated;
    this._horizontal = horizontal;
    this._dimensions = dimensions;

    this._parentMarshal = parentMarshal;
    this._setScrollUpdating = setScrollUpdating;
    this._outerMostVerticalMarshal = outerMostVerticalMarshal;
    this._outerMostHorizontalMarshal = outerMostHorizontalMarshal;

    this.register();
    this._scrollUpdating = scrollUpdating;
    this._rootScrollHelper = scrollHelper!;
    this._removeClippedSubviews = removeClippedSubviews;
  }

  get dimensions() {
    return this._dimensions;
  }

  enableScrollUpdating() {
    this._scrollUpdating = true;
    this._setScrollUpdating(true);
  }

  disableScrollUpdating() {
    this._scrollUpdating = false;
    this._setScrollUpdating(false);
  }

  get scrollUpdateEnabled() {
    return !!this._scrollUpdating;
  }

  getParentMarshal() {
    return this._parentMarshal;
  }

  getOuterMostHorizontalMarshal() {
    return this._outerMostHorizontalMarshal;
  }

  getOuterMostVerticalMarshal() {
    return this._outerMostVerticalMarshal;
  }

  // 因为marshal是和ScrollView绑定的，而每一个ScrollView都有一个`rootScrollHelper`
  // 它可能是self，也可能是parent scrollHelper；
  getRootScrollHelper() {
    return this._rootScrollHelper;
  }

  register() {
    if (this._parentMarshal) {
      const isSameOrientation =
        this._parentMarshal.isHorizontal() === this.isHorizontal();
      this._disposers.push(
        this._parentMarshal.registerAsNestedChild(this, !isSameOrientation)
      );
    }
  }

  dispose() {
    this._disposers.forEach(disposer => {
      if (typeof disposer === 'function') disposer();
    });
  }

  getOuterMostSameOrientationMarshal() {
    if (this.isHorizontal())
      return this.getOuterMostHorizontalMarshal() || this;
    return this.getOuterMostVerticalMarshal() || this;
  }

  getClosestSameOrientationMarshal() {
    const outerMost = this.getOuterMostSameOrientationMarshal();
    if (outerMost === this) return this;

    let marshal = this._parentMarshal;

    while (marshal && marshal.isHorizontal() !== this.isHorizontal()) {
      marshal = marshal._parentMarshal;
    }

    return marshal;
  }

  hasParent() {
    return this.getOuterMostSameOrientationMarshal() !== this;
  }

  getRef() {
    return this._ref;
  }

  getRootRef() {
    return this._rootScrollHelper.getRef();
  }

  getAnimated() {
    const marshal = this.getOuterMostSameOrientationMarshal();
    if (this === marshal) return this._animated;
    return marshal.getAnimated();
  }

  isHorizontal() {
    return !!this._horizontal;
  }

  registerAsNestedChild(child: Marshal, isReverse: boolean = false) {
    const children = isReverse
      ? this._reverseOrientationChildren
      : this._children;
    const index = children.findIndex(t => t === child);
    if (index === -1) children.push(child);
    return () => {
      this.unregisterAsNestedChild(child, isReverse);
    };
  }

  unregisterAsNestedChild(child: Marshal, isReverse: boolean = false) {
    const children = isReverse
      ? this._reverseOrientationChildren
      : this._children;

    const index = children.findIndex(t => t === child);
    if (index !== -1) children.splice(index, 1);
  }

  setContentSizeChangeHandler(handler: ContentSizeChangeHandler) {
    this._onContentSizeChange = handler;
  }

  setScrollHandler(handler: EventHandler) {
    this._onScroll = handler;
  }

  setMomentumScrollBeginHandler(handler: EventHandler) {
    this._onMomentumScrollBegin = handler;
  }

  setMomentumScrollEndHandler(handler: EventHandler) {
    this._onMomentumScrollEnd = handler;
  }

  setScrollBeginDragHandler(handler: EventHandler) {
    this._onScrollBeginDrag = handler;
  }

  setScrollEndDragHandler(handler: EventHandler) {
    this._onScrollEndDrag = handler;
  }

  handleSizeChange(w: number, h: number) {
    if (this._onContentSizeChange) this._onContentSizeChange(w, h);
    this._children.forEach(marshal => marshal.handleSizeChange(w, h));
  }

  handleEvent(
    eventName: ScrollHandlerName,
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const handler = this[`_${eventName}`];
    if (handler) handler(event);
    this._children.forEach(marshal => marshal.handleEvent(eventName, event));
  }
}

export default Marshal;
