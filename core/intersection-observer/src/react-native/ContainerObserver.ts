import { Platform, ScrollView, View } from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import {
  defaultViewabilityConfigCallbackPairs,
  getEmptyRect,
  viewabilityConfig,
} from './utils';
import {
  ContainerObserverProps,
  OwnerContainerObserver,
  IClientRectReadOnly,
} from './types';
import { computeIntersection } from '../common/intersection';

class ContainerObserver {
  private dimensions: ItemsDimensions;
  public root: ScrollView;
  private ownerContainerObserver: OwnerContainerObserver;
  private rect: IClientRectReadOnly = getEmptyRect();
  private intersection: IClientRectReadOnly = getEmptyRect();

  constructor(props: ContainerObserverProps) {
    this.ownerContainerObserver = props.ownerContainerObserver;
    this.root = props.root;

    this.dimensions = new ItemsDimensions({
      id: 'intersection-observer',
      horizontal: false,
      viewabilityConfig,
      viewabilityConfigCallbackPairs: defaultViewabilityConfigCallbackPairs,
      canIUseRIC: Platform.OS !== 'ios',
    });
  }

  getRect() {
    return this.rect;
  }

  updateIntersection() {
    let intersection = this.rect;
    let ownerContainerObserver = this.ownerContainerObserver;

    if (ownerContainerObserver) {
      while (ownerContainerObserver) {
        intersection =
          computeIntersection(intersection, ownerContainerObserver.getRect()) ||
          getEmptyRect();
        ownerContainerObserver = ownerContainerObserver.ownerContainerObserver;
      }

      this.intersection = intersection;
      return;
    }

    this.root.measureInWindow((x, y, width, height) => {
      console.log('x ', x, y, width, height);
    });
  }
}

export default ContainerObserver;
