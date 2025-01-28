import { ScrollView, View } from 'react-native';
import { ClientRect, ObserverProps, ItemLayout, ObserverRoot } from './types';
import { IClientRectReadOnly } from './types';
import { getEmptyRect, convertLayoutToClientRect } from './utils';
import { generateRandomKey } from './generateRandom';
import { measureLayout } from './measure';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import ContainerObserver from './ContainerObserver';

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
    const containerRect = this.containerObserver.getRect();
    const containerScrollOffset = this.containerObserver.scrollOffset;

    const itemRect = this.clientRect;
  }
}

export default Observer;
