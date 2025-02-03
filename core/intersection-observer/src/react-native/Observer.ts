import { ScrollView, View } from 'react-native';
import { ClientRect, ObserverProps, ItemLayout } from './types';
import { IClientRectReadOnly, IIntersectionObserverEntry } from './types';
import { getEmptyRect, convertLayoutToClientRect } from './utils';
import { generateRandomKey } from './generateRandom';
import { measureLayoutAsync } from './measure';
import ContainerObserver from './ContainerObserver';
import { computeIntersection } from '../common/intersection';
import IntersectionObserverEntry from './IntersectionObserverEntry';

class Observer {
  private target: View;
  private observerKey: string;
  private clientRect: IClientRectReadOnly;
  private containerObserver: ContainerObserver;
  private entry: IIntersectionObserverEntry | null = null;

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop
   *
   * the difference is offsetTop is relative to closest positioned ScrollView
   */
  private offsetTop: number;
  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
   */
  private offsetParent: ScrollView;

  constructor(props: ObserverProps) {
    const {
      target,
      containerObserver,
      observerKey = generateRandomKey(),
    } = props;
    this.target = target;
    this.observerKey = observerKey;
    this.clientRect = getEmptyRect();
    this.containerObserver = containerObserver;
  }

  get root() {
    return this.containerObserver.root;
  }

  get intersectionEntry() {
    return this.entry;
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
    return measureLayoutAsync(this.target, this.root).then(
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

  getClientRect() {
    return this.clientRect;
  }

  setClientRect(layout: IClientRectReadOnly | ItemLayout) {
    if ((layout as IClientRectReadOnly).bottom != null) {
      this.clientRect = layout as IClientRectReadOnly;
    } else {
      this.clientRect = convertLayoutToClientRect(layout as ClientRect);
    }
  }

  updateIntersection() {
    const containerRect = this.containerObserver.getBoundingClientRect();
    const itemClientRect = this.getBoundingClientRect();

    const intersection = computeIntersection(itemClientRect, containerRect);

    const entry = new IntersectionObserverEntry({
      root: this.root,
      target: this.target,
      dimensions: this.dimensions,
      boundingClientRect: this.clientRect,
      rootBounds: containerRect,
      intersectionRect: intersection,
    });

    this.entry = entry.getEntry();

    console.log('entry ', this.containerObserver, this.observerKey, this.entry);
  }

  getKey() {
    return this.observerKey;
  }

  /**
   * derive from container rect
   */
  getBoundingClientRect() {
    const containerRect = this.containerObserver.getBoundingClientRect();
    const scrollOffsetX = this.containerObserver.scrollOffsetX;
    const scrollOffsetY = this.containerObserver.scrollOffsetY;

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
}

export default Observer;
