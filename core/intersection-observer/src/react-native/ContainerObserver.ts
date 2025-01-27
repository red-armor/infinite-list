import { Platform, ScrollView, View } from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import {
  defaultViewabilityConfigCallbackPairs,
  getEmptyRect,
  viewabilityConfig,
} from './utils';
import {
  ContainerObserverProps,
  OwnerScrollView,
  IClientRectReadOnly,
} from './types';
import { computeIntersection } from '../common/intersection';

class ContainerObserver {
  private dimensions: ItemsDimensions;
  private rootScrollView: ScrollView;
  private ownerScrollView: OwnerScrollView;
  private rect: IClientRectReadOnly = getEmptyRect();
  private intersection: IClientRectReadOnly = getEmptyRect();

  constructor(props: ContainerObserverProps) {
    this.ownerScrollView = props.ownerScrollView;
    this.rootScrollView = props.rootScrollView;

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
    let ownerScrollView = this.ownerScrollView;

    if (ownerScrollView) {
      while (ownerScrollView) {
        intersection = computeIntersection(
          intersection,
          ownerScrollView.getRect()
        );
        ownerScrollView = ownerScrollView.ownerScrollView;
      }

      this.intersection = intersection;
      return;
    }

    this.rootScrollView.measureInWindow((x, y, width, height) => {
      console.log('x ', x, y, width, height);
    });
  }
}

export default ContainerObserver;
