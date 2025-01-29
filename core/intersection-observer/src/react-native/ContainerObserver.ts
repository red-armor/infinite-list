import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
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
import ReactNativeDocument from './ReactNativeDocument';

class ContainerObserver {
  readonly doc: ReactNativeDocument;
  private dimensions: ItemsDimensions;
  // public root: ScrollView;
  private ownerContainerObserver: OwnerContainerObserver;
  private rect: IClientRectReadOnly = getEmptyRect();
  private intersection: IClientRectReadOnly = getEmptyRect();
  public scrollOffsetX = 0;
  public scrollOffsetY = 0;

  constructor(props: ContainerObserverProps) {
    this.doc = props.doc;
    this.ownerContainerObserver = props.ownerContainerObserver;
    // this.root = props.root;

    this.dimensions = new ItemsDimensions({
      id: 'intersection-observer',
      horizontal: false,
      viewabilityConfig,
      viewabilityConfigCallbackPairs: defaultViewabilityConfigCallbackPairs,
      canIUseRIC: Platform.OS !== 'ios',
    });

    this.doc.addEventListener(
      'onScroll',
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const {
          contentOffset: { x, y },
        } = event.nativeEvent;
        this.scrollOffsetX = x;
        this.scrollOffsetY = y;
      }
    );
  }

  get root() {
    return this.doc.node;
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
