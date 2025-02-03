import { ScrollView, View } from 'react-native';
import { ClientRect, ObserverProps, ItemLayout } from './types';
import { IClientRectReadOnly } from './types';
import { getEmptyRect, convertLayoutToClientRect } from './utils';
import { generateRandomKey } from './generateRandom';
import { measureLayout } from './measure';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import ContainerObserver from './ContainerObserver';
import { computeIntersection } from '../common/intersection';
import IntersectionObserverEntry from './IntersectionObserverEntry';

class Observer {
  // private root: ObserverRoot;
  private target: View;
  private observerKey: string;
  private clientRect: IClientRectReadOnly;
  private dimensions: ItemsDimensions;
  private containerObserver: ContainerObserver;

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
      // root,
      target,
      dimensions,
      containerObserver,
      observerKey = generateRandomKey(),
    } = props;
    // this.root = root;
    this.target = target;
    this.observerKey = observerKey;
    this.clientRect = getEmptyRect();
    this.dimensions = dimensions;
    this.containerObserver = containerObserver;
  }

  get root() {
    return this.containerObserver.root;
  }

  dispose() {
    this.dimensions.dispose(this.observerKey);
  }

  /**
   * callback will be invoked after layout measured
   */
  updateClientRect(cb?: (rect: IClientRectReadOnly) => void) {
    measureLayout(this.target, this.root, (x, y, width, height) => {
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
    });
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
    console.log('containerObserver ', this.containerObserver);
    const containerRect = this.containerObserver.getBoundingClientRect();
    const itemClientRect = this.getBoundingClientRect();

    const intersection = computeIntersection(itemClientRect, containerRect);

    console.log(
      'intersection in observer',
      itemClientRect,
      containerRect,
      intersection
    );

    const entry = new IntersectionObserverEntry({
      root: this.root,
      target: this.target,
      dimensions: this.dimensions,
      boundingClientRect: this.clientRect,
      rootBounds: containerRect,
      intersectionRect: intersection,
    });
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
