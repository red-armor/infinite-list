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
  getEmptyRect,
  viewabilityConfig,
} from './utils';
import {
  IRectIntersection,
  ContainerObserverProps,
  OwnerContainerObserver,
  IClientRectReadOnly,
  IIntersectionObserverEntry,
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
  /**
   * to resolve observer intersection
   */
  private clientIntersection: IClientRectReadOnly | null = null;
  private intersection: IRectIntersection | null = null;
  public scrollOffsetX = 0;
  public scrollOffsetY = 0;
  private children: ContainerObserver[] = [];
  private keyToObserverMap: Map<string, Observer> = new Map();
  private records: IIntersectionObserverEntry[] = [];

  constructor(props: ContainerObserverProps) {
    this.doc = props.doc;
    this.id = this.doc.id;
    this.ownerContainerObserver = props.ownerContainerObserver;

    this.dimensions = new ItemsDimensions({
      id: `${this.id}_items_dimensions`,
      horizontal: this.doc.horizontal,
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

  getBoundingClientRect() {
    return this.rect;
  }

  getBoundingClientIntersection() {
    return this.clientIntersection;
  }

  getIntersection() {
    return this.intersection;
  }

  updateIntersection(): Promise<IRectIntersection | null> {
    return measureInWindowAsync(this.root.current).then(
      ({ x, y, width, height }) => {
        this.rect = convertLayoutToClientRect({
          x,
          y,
          width,
          height,
        });

        let ownerContainerObserver = this.ownerContainerObserver;
        let intersection: IRectIntersection | null = convertRectToIntersection(
          this.rect
        );

        if (ownerContainerObserver) {
          while (ownerContainerObserver) {
            const ownerClientIntersection =
              ownerContainerObserver.getBoundingClientIntersection();
            if (!ownerClientIntersection) return null;
            if (!intersection) return null;
            intersection = computeIntersection(
              intersection,
              ownerClientIntersection
            );
            ownerContainerObserver =
              ownerContainerObserver.ownerContainerObserver;
          }
        }

        this.intersection = intersection;

        this.clientIntersection = intersection
          ? {
              ...intersection,
              x,
              y,
            }
          : null;

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
    let records: IIntersectionObserverEntry[] = [];
    for (const observer of this.keyToObserverMap.values()) {
      records.push(observer.updateIntersection());
    }
    this.children.forEach((child) => {
      const childRecords = child.updateObserversIntersections();
      records = records.concat(childRecords);
    });

    this.records = records as IIntersectionObserverEntry[];

    return this.records;
  }

  updateObserversIntersectionsInSmartWay() {
    if (!this.clientIntersection) {
      // do nothing
      return [];
    }

    const { width, height } = this.clientIntersection;

    let minOffset = 0;
    let maxOffset = 0;

    if (this.doc.horizontal) {
      minOffset = this.scrollOffsetX;
      maxOffset = this.scrollOffsetX + width;
    } else {
      minOffset = this.scrollOffsetY;
      maxOffset = this.scrollOffsetY + height;
    }

    const values = this.dimensions.computeIndexRangeMeta(minOffset, maxOffset);

    let records = values
      .map((record) => {
        const key = record.getKey();
        const observer = this.keyToObserverMap.get(key);
        if (observer) {
          return observer.updateIntersection();
        }
        return [];
      })
      .filter((v) => v);

    this.children.forEach((child) => {
      const childRecords = child.updateObserversIntersectionsInSmartWay();
      records = records.concat(childRecords);
    });

    this.records = records as IIntersectionObserverEntry[];

    return this.records;
  }

  getRecords() {
    return this.records;
  }

  /**
   * If container has no parent container, it is an ancestor. which means it
   * is the root container
   */
  isAncestor() {
    return !!this.ownerContainerObserver;
  }
}

export default ContainerObserver;
