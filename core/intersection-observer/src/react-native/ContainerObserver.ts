import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import { TaskRunner } from '@infinite-list/scheduler';
import {
  compareIntersection,
  computeIntersection,
} from '../common/intersection';
import Observer from './Observer';
import ReactNativeDocument, { getNode } from './ReactNativeDocument';
import { measureInWindowAsync } from './measure';
import {
  ContainerObserverProps,
  IClientRectReadOnly,
  IIntersectionObserverEntry,
  IRectIntersection,
  OwnerContainerObserver,
} from './types';
import {
  convertLayoutToClientRect,
  convertRectToIntersection,
  defaultViewabilityConfigCallbackPairs,
  getEmptyRect,
  viewabilityConfig,
} from './utils';

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
  updateIntersectionTaskRunner: TaskRunner;
  private listenersDisposers: Function[] = [];

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

    /**
     * on scroll, `measureInWindow`'s value may not change, so listen to
     * `onMomentumScrollEnd` is required.
     */
    this.listenersDisposers.push(
      this.doc.addScrollEventChangeListener(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          this.updateScrollInfo(event);

          this.updateIntersectionTaskRunner.schedule();
        }
      )
    );

    this.updateIntersectionTaskRunner = new TaskRunner(
      this.updateIntersection.bind(this),
      50
    );

    this.ownerContainerObserver?.addChild(this);
  }

  updateScrollInfo(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const {
      contentOffset: { x, y },
    } = event.nativeEvent;
    this.scrollOffsetX = x;
    this.scrollOffsetY = y;
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
    this.listenersDisposers.forEach((disposer) => {
      disposer();
    });
  }

  get root() {
    return this.doc.node;
  }

  getBoundingClientRect() {
    return this.rect;
  }

  /**
   * xxBoundingClientxxx indicating relative to viewport
   * @returns
   *  - x: relative to viewport
   *  - left: relative to viewport
   */
  getBoundingClientIntersection() {
    return this.clientIntersection;
  }

  /**
   *
   * @param intersection
   * @returns true if intersection changed, otherwise false
   */
  setBoundingClientIntersection(intersection: IClientRectReadOnly | null) {
    const oldClientIntersection = this.clientIntersection;
    if (!compareIntersection(this.clientIntersection, intersection)) {
      this.clientIntersection = intersection;
      this.doc?.onIntersectionChange?.(
        this.clientIntersection,
        oldClientIntersection
      );
      return true;
    }
    return false;
  }

  get offsetLeft() {
    if (!this.ownerContainerObserver) return 0;
    return this.rect.x - this.ownerContainerObserver.rect.x;
  }
  get offsetTop() {
    if (!this.ownerContainerObserver) return 0;
    return this.rect.y - this.ownerContainerObserver.rect.y;
  }

  get offsetParent() {
    return this.ownerContainerObserver;
  }

  getIntersection() {
    return this.intersection;
  }

  /**
   * comparing add listener to parent, the strategy could be found in
   * https://github.com/GoogleChromeLabs/intersection-observer/blob/main/intersection-observer.js#L407C12-L407C33.
   * In my opinion, it's better to trigger from top to bottom; only if parent is ready,
   * then child's trigger is meaningful.
   *
   */
  updateIntersection(): Promise<IRectIntersection | null> {
    return measureInWindowAsync(getNode(this.root) as any).then(
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
        this.setBoundingClientIntersection(
          intersection
            ? {
                ...intersection,
                x,
                y,
              }
            : null
        );

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
    return !this.ownerContainerObserver;
  }
}

export default ContainerObserver;
