import { View, ScrollView, Platform } from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import { Scheduler } from '@infinite-list/scheduler';
import {
  ClientRect,
  ItemLayout,
  IntersectionObserverProps,
  MonitorDisposer,
  IIntersectionObserver,
  ObserveOptions,
} from './types';
import {
  defaultViewabilityConfigCallbackPairs,
  parseRootMargin,
  viewabilityConfig,
} from './utils';
import Observer from './Observer';
import ReactNativeDocument from './ReactNativeDocument';
import { generateRandomKey } from './generateRandom';
import ContainerObserver from './ContainerObserver';

class IntersectionObserver implements IIntersectionObserver {
  private monitoringDocuments: ReactNativeDocument[] = [];
  private callback: IntersectionObserverCallback;
  private root: ReactNativeDocument;
  private rootMargin: string;
  private threshold?: number | number[];
  private dimensions: ItemsDimensions;
  private observerMap: WeakMap<View, Observer> = new WeakMap();
  private ownerDocument: ReactNativeDocument;
  private keyToObserverMap: Map<string, Observer> = new Map();
  private monitorDisposers: MonitorDisposer[] = [];
  private updateDocumentIntersectionsTask: Scheduler;
  private scrollViewToContainerObserverMap: Map<ScrollView, ContainerObserver> =
    new Map();

  constructor(
    callback: IntersectionObserverCallback,
    props: IntersectionObserverProps
  ) {
    const { root, rootMargin, threshold, document } = props;
    this.callback = callback;
    this.root = root;
    this.threshold = threshold;

    this.ownerDocument = document;
    this.dimensions = new ItemsDimensions({
      id: 'intersection-observer',
      horizontal: false,
      viewabilityConfig,
      viewabilityConfigCallbackPairs: defaultViewabilityConfigCallbackPairs,
      canIUseRIC: Platform.OS !== 'ios',
    });

    const marginValues = parseRootMargin(rootMargin);
    this.updateDocumentIntersectionsTask = new Scheduler(
      this._updateDocumentIntersectionsTask.bind(this),
      50
    );
    this.rootMargin = marginValues
      .map(function (margin) {
        return margin.value + margin.unit;
      })
      .join(' ');
  }

  ensureContainerObserver(doc: ReactNativeDocument) {
    const scrollView = doc.node;
    const ownerDocument = doc.ownerDocument;

    if (this.scrollViewToContainerObserverMap.has(scrollView))
      return this.scrollViewToContainerObserverMap.get(scrollView);

    const ownerContainerObserver = this.ensureContainerObserver(ownerDocument);

    const container = new ContainerObserver({
      doc,
      ownerContainerObserver,
    });

    this.scrollViewToContainerObserverMap.set(scrollView, container);
    return this.scrollViewToContainerObserverMap.get(scrollView);
  }

  /**
   *
   * @param el
   * @param observerKey
   *
   * How to process recycle item
   *
   * When to dynamically update item layout
   *
   * el may be reused...
   */
  observe(el: View, options: ObserveOptions) {
    const { observerKey = '', root = this.root } = options || {};
    const nextObserverKey = observerKey || generateRandomKey();
    let observer = null;
    let scrollView = null;

    if (root instanceof ReactNativeDocument) {
      scrollView = root.node;
    } else {
      scrollView = root;
    }

    let container = this.scrollViewToContainerObserverMap.get(scrollView);

    if (!container) {
      if (root instanceof ReactNativeDocument) {
        const ownerContainerObserver = this.ensureContainerObserver(root);
        container = new ContainerObserver({
          doc: this.root,
          ownerContainerObserver,
        });
      } else {
        container = new ContainerObserver({
          doc: this.root,
          ownerContainerObserver: null,
        });
      }
    }

    observer = new Observer({
      root: root || this.root,
      target: el,
      observerKey: nextObserverKey,
      dimensions: this.dimensions,
      containerObserver: container,
    });

    this.observerMap.set(el, observer);
    this.keyToObserverMap.set(nextObserverKey, observer);
    this.checkIntersection(el);
    this.monitorIntersections(root);
    return () => {
      this.unobserve(nextObserverKey);
    };
  }

  checkIntersection(el: View) {
    const entry = this.observerMap.get(el);
    if (entry) {
      // entry.checkIntersection();
    }
  }

  updateClientRect(el: View) {
    const entry = this.observerMap.get(el);
    if (entry) {
      entry.updateClientRect(() => {
        this.checkIntersection(el);
      });
    }
  }

  unobserve(observerKey: string) {
    const observer = this.keyToObserverMap.get(observerKey);
    if (observer) {
      observer.dispose();
      this.keyToObserverMap.delete(observerKey);
    }
  }

  disconnect() {
    this.keyToObserverMap = new Map();
    this.unmonitorIntersections();
  }

  takeRecords() {
    // TODO: implement
  }

  monitorIntersections(doc: ReactNativeDocument) {
    if (!doc || this.monitoringDocuments.indexOf(doc) !== -1) {
      return;
    }

    while (doc) {
      this.monitoringDocuments.push(doc);

      const disposer = doc.addEventListener(
        'onScroll',
        this.updateIntersections
      );
      this.monitorDisposers.push(disposer);
      doc = doc.ownerDocument;
    }
  }

  unmonitorIntersections() {
    this.monitorDisposers.forEach((disposer) => {
      if (typeof disposer === 'function') disposer();
    });
  }

  updateIntersections() {
    // TODO: implement
  }

  updateDocumentIntersections() {
    this.updateDocumentIntersectionsTask.schedule();
  }

  _updateDocumentIntersectionsTask() {
    this.updateContainerIntersections().then(() => {
      this.updateIntersections();
    });
  }

  updateContainerIntersections() {
    const tasks = [];

    for (const container of this.scrollViewToContainerObserverMap.values()) {
      tasks.push(container.updateIntersection());
    }

    return Promise.all(tasks);
  }

  getClientRect(key: string) {
    const observer = this.keyToObserverMap.get(key);
    if (observer) {
      return observer.getClientRect();
    }
    return null;
  }

  setClientRect(key: string, rect: ClientRect | ItemLayout) {
    const observer = this.keyToObserverMap.get(key);
    if (observer) {
      return observer.setClientRect(rect);
    }
    return null;
  }
}

export default IntersectionObserver;
