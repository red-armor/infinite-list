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
import Observer from './Observer';
import { measureInWindowAsync } from './measure';

class ContainerObserver {
  readonly doc: ReactNativeDocument;
  readonly id: string;
  public dimensions: ItemsDimensions;
  private ownerContainerObserver: OwnerContainerObserver;
  private rect: IClientRectReadOnly = getEmptyRect();
  private intersection: IRectIntersection = getEmptyIntersection();
  public scrollOffsetX = 0;
  public scrollOffsetY = 0;
  private children: ContainerObserver[] = [];
  private keyToObserverMap: Map<string, Observer> = new Map();

  constructor(props: ContainerObserverProps) {
    this.doc = props.doc;
    this.id = this.doc.id;
    this.ownerContainerObserver = props.ownerContainerObserver;

    this.dimensions = new ItemsDimensions({
      id: `${this.id}_items_dimensions`,
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

    this.ownerContainerObserver?.addChild(this);
  }

  addChild(child: ContainerObserver) {
    const index = this.children.findIndex((item) => item === child);
    if (index === -1) {
      this.children.push(child);
    }

    return () => {
      const index = this.children.findIndex((item) => item === child);
      if (index !== -1) {
        this.children.splice(index, 1);
      }
    };
  }

  dispose() {
    this.children.forEach((child) => {
      child.dispose();
    });
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

  updateIntersection(): Promise<IRectIntersection> {
    return measureInWindowAsync(this.root.current).then(
      ({ x, y, width, height }) => {
        this.intersection = convertLayoutToClientRect({
          x,
          y,
          width,
          height,
        });

        this.rect = this.intersection;

        let ownerContainerObserver = this.ownerContainerObserver;

        if (ownerContainerObserver) {
          let intersection = convertRectToIntersection(this.rect);

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
        }
        return Promise.all(
          this.children.map((child) => child.updateIntersection())
        ).then(() => this.intersection);
      }
    );
  }

  addObserver(observer: Observer) {
    const observerKey = observer.getKey();
    this.keyToObserverMap.set(observerKey, observer);
    return () => {
      this.keyToObserverMap.delete(observerKey);
    };
  }

  updateObserversIntersections() {
    for (const observer of this.keyToObserverMap.values()) {
      observer.updateIntersection();
    }
    this.children.forEach((child) => {
      child.updateObserversIntersections();
    });
  }

  isAncestor() {
    return !!this.ownerContainerObserver;
  }
}

export default ContainerObserver;
