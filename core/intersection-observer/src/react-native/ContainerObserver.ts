import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import {
  convertLayoutToClientRect,
  convertRectToIntersection,
  defaultViewabilityConfigCallbackPairs,
  getEmptyIntersection,
  getEmptyRect,
  viewabilityConfig,
} from './utils';
import {
  IRectIntersection,
  ContainerObserverProps,
  OwnerContainerObserver,
  IClientRectReadOnly,
} from './types';
import { computeIntersection } from '../common/intersection';
import ReactNativeDocument from './ReactNativeDocument';

class ContainerObserver {
  readonly doc: ReactNativeDocument;
  private dimensions: ItemsDimensions;
  private ownerContainerObserver: OwnerContainerObserver;
  private rect: IClientRectReadOnly = getEmptyRect();
  private intersection: IRectIntersection = getEmptyIntersection();
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

  getBoundingClientRect() {
    return this.rect;
  }

  getIntersection() {
    return this.intersection;
  }

  updateIntersection() {
    return new Promise((resolve) => {
      let intersection = convertRectToIntersection(this.rect);
      let ownerContainerObserver = this.ownerContainerObserver;

      if (ownerContainerObserver) {
        while (ownerContainerObserver) {
          intersection =
            computeIntersection(
              intersection,
              ownerContainerObserver.getRect()
            ) || getEmptyIntersection();
          ownerContainerObserver =
            ownerContainerObserver.ownerContainerObserver;
        }

        this.intersection = intersection;
        resolve(this.intersection);
        return;
      }

      this.root.current.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          this.intersection = convertLayoutToClientRect({
            x,
            y,
            width,
            height,
          });

          this.rect = this.intersection;
          console.log(
            'hell00000',
            this,
            this.intersection,
            x,
            y,
            width,
            height
          );
          resolve(this.intersection);
        }
      );
    });
  }
}

export default ContainerObserver;
