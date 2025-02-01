import { View } from 'react-native';
import { ClientRect, ObserverProps, ItemLayout } from './types';
import { IClientRectReadOnly } from './types';
import { getEmptyRect, convertLayoutToClientRect } from './utils';
import { generateRandomKey } from './generateRandom';
import { measureLayout } from './measure';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import ContainerObserver from './ContainerObserver';
import { computeIntersection } from '../common/intersection';

class Observer {
  // private root: ObserverRoot;
  private target: View;
  private observerKey: string;
  private clientRect: IClientRectReadOnly;
  private dimensions: ItemsDimensions;
  private containerObserver: ContainerObserver;

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
        ...this.clientRect,
        x,
        y,
        width,
        height,
      };

      console.log('this ----', this.clientRect);

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
    const containerRect = this.containerObserver.getRect();
    const scrollOffsetX = this.containerObserver.scrollOffsetX;
    const scrollOffsetY = this.containerObserver.scrollOffsetY;

    const itemRect = this.clientRect;

    const { top, left, x, y, width, height } = itemRect;

    /**
     * get item rect relative to container
     */
    const nextTop = top - scrollOffsetY + containerRect.top;
    const nextLeft = left - scrollOffsetX + containerRect.left;
    const nextX = x - scrollOffsetX + containerRect.x;
    const nextY = y - scrollOffsetY + containerRect.y;

    const nextItemReact = {
      x: nextX,
      y: nextY,
      top: nextTop,
      right: nextLeft + width,
      bottom: nextTop + height,
      left: nextLeft,
      width,
      height,
    };
    const intersection = computeIntersection(nextItemReact, containerRect);

    console.log(
      'intersection in observer',
      nextItemReact,
      containerRect,
      intersection
    );
  }
}

export default Observer;
