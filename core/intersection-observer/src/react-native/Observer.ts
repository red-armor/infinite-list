import type { View } from 'react-native';
import { computeIntersection } from '../common/intersection';
import type ContainerObserver from './ContainerObserver';
import IntersectionObserverEntry from './IntersectionObserverEntry';
import { getNode } from './ReactNativeDocument';
import { generateRandomKey } from './generateRandom';
import { measureLayoutAsync } from './measure';
import type {
  ClientRect,
  IClientRectReadOnly,
  IIntersectionObserverEntry,
  ItemLayout,
  ObserverProps,
  OnRectChange,
} from './types';
import { convertLayoutToClientRect, getEmptyRect } from './utils';

class Observer {
  private target: View;
  private _observerKey: string;
  private clientRect: IClientRectReadOnly;
  private containerObserver: ContainerObserver;
  private entry: IIntersectionObserverEntry | null = null;
  readonly onRectChange?: OnRectChange;

  // /**
  //  * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop
  //  *
  //  * the difference is offsetTop is relative to closest positioned ScrollView
  //  */
  // private offsetTop: number;
  // /**
  //  * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
  //  */
  // private offsetParent: ScrollView;

  constructor(props: ObserverProps) {
    const {
      target,
      onRectChange,
      containerObserver,
      observerKey = generateRandomKey(),
    } = props;
    this.target = target;
    this.onRectChange = onRectChange;
    this._observerKey = observerKey;
    this.clientRect = getEmptyRect();
    this.containerObserver = containerObserver;
  }

  get root() {
    return this.containerObserver.root;
  }

  get intersectionEntry() {
    return this.entry;
  }

  get observerKey() {
    return this._observerKey;
  }

  get dimensions() {
    return this.containerObserver.dimensions;
  }

  dispose() {
    this.dimensions.dispose(this.observerKey);
  }

  /**
   * callback will be invoked after layout measured
   */
  updateClientRect(cb?: (rect: IClientRectReadOnly) => void) {
    return measureLayoutAsync(this.target, getNode(this.root) as any).then(
      ({ x, y, width, height }) => {
        this.clientRect = {
          x,
          y,
          top: y,
          left: x,
          right: x + width,
          bottom: y + height,
          width,
          height,
        };

        this.onRectChange?.(this.clientRect);

        this.dimensions.setKeyItemLayout(this.observerKey, {
          x,
          y,
          width,
          height,
        });

        cb?.(this.clientRect);
      }
    );
  }

  setClientRect(layout: IClientRectReadOnly | ItemLayout) {
    if ((layout as IClientRectReadOnly).bottom != null) {
      this.clientRect = layout as IClientRectReadOnly;
    } else {
      this.clientRect = convertLayoutToClientRect(layout as ClientRect);
    }
  }

  updateIntersection() {
    /**
     * should use `getBoundingClientIntersection` instead of `getBoundingClientRect`
     */
    const containerIntersection =
      this.containerObserver.getBoundingClientIntersection();
    // const containerIntersection =
    //   this.containerObserver.getBoundingClientRect();
    const itemClientRect = this.getBoundingClientRect();

    const intersection = containerIntersection
      ? computeIntersection(itemClientRect, containerIntersection)
      : null;

    const entry = new IntersectionObserverEntry({
      observer: this,
      target: this.target,
      dimensions: this.dimensions,
      boundingClientRect: this.clientRect,
      rootBounds: containerIntersection,
      intersectionRect: intersection,
    });

    this.entry = entry.getEntry();
    return this.entry;
  }

  getBoundingClientIntersection() {
    return this.entry?.intersectionRect;
  }

  get offsetTop() {
    return this.clientRect.top;
  }

  get offsetLeft() {
    return this.clientRect.left;
  }

  get offsetParent() {
    return this.containerObserver;
  }

  getKey() {
    return this.observerKey;
  }

  /**
   * relative to viewport; recently the container layout change will not
   * trigger item `getBoundingClientReact` update, so If getBoundingClientRect
   * should be invoked on use..
   */
  getBoundingClientRect() {
    const containerRect = this.containerObserver.getBoundingClientRect();
    const { scrollOffsetX } = this.containerObserver;
    const { scrollOffsetY } = this.containerObserver;

    const topRelativeToContainer = this.clientRect.top - scrollOffsetY;
    const topRelativeToViewport = containerRect.top + topRelativeToContainer;
    const leftRelativeToContainer = this.clientRect.left - scrollOffsetX;
    const leftRelativeToViewport = containerRect.left + leftRelativeToContainer;

    const clientRect = {
      x: containerRect.x + leftRelativeToContainer,
      y: containerRect.y + topRelativeToContainer,
      top: topRelativeToViewport,
      right: leftRelativeToViewport + this.clientRect.width,
      bottom: topRelativeToViewport + this.clientRect.height,
      left: leftRelativeToViewport,
      width: this.clientRect.width,
      height: this.clientRect.height,
    };

    return clientRect;
  }

  /**
   * relative to closest ScrollView
   *
   */
  getClientRect() {
    return this.clientRect;
  }
}

export default Observer;
