import { MutableRefObject } from 'react';
import { Animated } from 'react-native';
import ScrollHelper from './ScrollHelper';
import { DataModelDimensions, SpectrumScrollViewRef } from './types';
import ScrollEventHelper from './ScrollEventHelper';

/**
 * Marshal is bound to ScrollView which means every ScrollView will has its own
 * marshal, and you can get marshal value through `ScrollViewContext`
 */
class Marshal {
  readonly _horizontal: boolean;

  readonly _animatedValueX: MutableRefObject<Animated.Value>;

  readonly _animatedValueY: MutableRefObject<Animated.Value>;

  readonly _animated: boolean;

  readonly _rootScrollHelper: ScrollHelper;

  readonly _scrollEventHelper: ScrollEventHelper;

  readonly _id: string;

  readonly _removeClippedSubviews: boolean;

  private _parentMarshal: Marshal;

  private _children: Marshal[] = [];

  private _reverseOrientationChildren: Marshal[] = [];

  private _ref: SpectrumScrollViewRef;

  private _disposers: Function[] = [];

  private _scrollUpdating: boolean;

  private _dimensions: DataModelDimensions;

  constructor(props: {
    id: string;
    dimensions: DataModelDimensions;
    animated?: boolean;
    horizontal?: boolean;
    parentMarshal: Marshal | null;
    scrollUpdating?: boolean;
    scrollHelper: ScrollHelper;
    scrollEventHelper: ScrollEventHelper;
    // outerMostVerticalMarshal?: Marshal;
    // outerMostHorizontalMarshal?: Marshal;
    removeClippedSubviews: boolean;
    ref: SpectrumScrollViewRef;
    animatedValueX: MutableRefObject<Animated.Value>;
    animatedValueY: MutableRefObject<Animated.Value>;
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
      scrollEventHelper,
      removeClippedSubviews,
      animatedValueX,
      animatedValueY,
    } = props;
    this._ref = ref;
    this._id = id;
    this._scrollEventHelper = scrollEventHelper;
    this._animated = animated;
    this._animatedValueX = animatedValueX;
    this._animatedValueY = animatedValueY;
    this._horizontal = horizontal;
    this._dimensions = dimensions;

    this._parentMarshal = parentMarshal;

    this.register();
    this._scrollUpdating = scrollUpdating;
    this._rootScrollHelper = scrollHelper;
    this._removeClippedSubviews = removeClippedSubviews;
  }

  get dimensions() {
    return this._dimensions;
  }

  enableScrollUpdating() {
    this._scrollUpdating = true;
  }

  disableScrollUpdating() {
    this._scrollUpdating = false;
  }

  getScrollEventHelper() {
    return this._scrollEventHelper;
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

  // getOuterMostHorizontalMarshal() {
  //   return this._outerMostHorizontalMarshal;
  // }

  // getOuterMostVerticalMarshal() {
  //   return this._outerMostVerticalMarshal;
  // }

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

  getAnimated(): boolean {
    const marshal = this.getOuterMostSameOrientationMarshal();
    if (this === marshal) return this._animated;
    return marshal.getAnimated();
  }

  getAnimatedValue() {
    return this._horizontal ? this._animatedValueX : this._animatedValueY;
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
