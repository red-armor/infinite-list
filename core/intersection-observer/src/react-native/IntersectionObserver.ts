import { View } from 'react-native';
import { Scheduler } from '@infinite-list/scheduler';
import {
  ClientRect,
  ItemLayout,
  IntersectionObserverProps,
  MonitorDisposer,
  IIntersectionObserver,
  ObserveOptions,
  IIntersectionObserverEntry,
  ObservedComponent,
  IntersectionObserverCallback,
} from './types';
import { parseRootMargin } from './utils';
import Observer from './Observer';
import ReactNativeDocument, {
  ReactNativeDocumentNode,
} from './ReactNativeDocument';
import { generateRandomKey } from './generateRandom';
import ContainerObserver from './ContainerObserver';

class IntersectionObserver implements IIntersectionObserver {
  private monitoringDocuments: ReactNativeDocument[] = [];
  private callback: IntersectionObserverCallback;
  private root: ReactNativeDocument;
  private rootMargin: string;
  private threshold?: number | number[];
  private observerMap: WeakMap<View, Observer> = new WeakMap();
  private ownerDocument: ReactNativeDocument | undefined;
  private keyToObserverMap: Map<string, Observer> = new Map();
  private monitorDisposers: MonitorDisposer[] = [];
  private updateIntersectionsTask: Scheduler;
  private nodeToContainerObserverMap: Map<
    ReactNativeDocumentNode,
    ContainerObserver
  > = new Map();

  private containers: ContainerObserver[] = [];

  constructor(
    callback: IntersectionObserverCallback,
    props: IntersectionObserverProps
  ) {
    const { root, rootMargin, threshold, document } = props;
    this.callback = callback;
    this.root = root;
    this.threshold = threshold;

    this.ownerDocument = document;

    const marginValues = parseRootMargin(rootMargin);
    this.updateIntersectionsTask = new Scheduler(
      this._updateIntersectionsTask.bind(this),
      50
    );
    this.rootMargin = marginValues
      .map(function (margin) {
        return margin.value + (margin.unit || '');
      })
      .join(' ');
  }

  getNode(doc: ReactNativeDocument) {
    if (!doc) return null;
    const node = doc.node;
    return node;
  }

  addContainer(container: ContainerObserver) {
    const index = this.containers.findIndex((item) => item === container);
    if (index === -1) {
      this.containers.push(container);
    }

    return () => {
      const index = this.containers.findIndex((item) => item === container);
      if (index !== -1) {
        this.containers.splice(index, 1);
      }
    };
  }

  ensureContainerObserver(doc: ReactNativeDocument | undefined | null) {
    if (!doc) return null;
    const node = doc.node;
    if (!node) return null;
    const ownerDocument = doc.ownerDocument;

    if (this.nodeToContainerObserverMap.has(node))
      return this.nodeToContainerObserverMap.get(node);

    const ownerContainerObserver = ownerDocument
      ? this.ensureContainerObserver(ownerDocument)
      : null;

    const container = new ContainerObserver({
      doc,
      ownerContainerObserver,
    });

    this.nodeToContainerObserverMap.set(node, container);
    return this.nodeToContainerObserverMap.get(node);
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
  observe(
    el: ObservedComponent,
    options: ObserveOptions
  ): {
    observer: Observer;
    remover: () => void;
  } {
    const { observerKey = '', root = this.root, onRectChange } = options || {};
    const nextObserverKey = observerKey || generateRandomKey();
    let observer = null;
    let node = null;
    console.log('ober -----', nextObserverKey);

    if (root instanceof ReactNativeDocument) {
      node = root.node;
    } else {
      node = root;
    }

    let container = this.nodeToContainerObserverMap.get(node);

    if (!container) {
      if (root instanceof ReactNativeDocument) {
        /**
         * to get parent container
         */
        const ownerContainerObserver = this.ensureContainerObserver(
          root.ownerDocument
        );
        container = new ContainerObserver({
          doc: root,
          ownerContainerObserver,
        });
      } else {
        container = new ContainerObserver({
          doc: root,
          ownerContainerObserver: null,
        });
      }
      /**
       * set current container
       */
      this.nodeToContainerObserverMap.set(node, container);

      /**
       * after init container, should update container rect
       */
      this.updateIntersections();

      if (container.isAncestor()) {
        this.addContainer(container);
      }
    }

    observer = new Observer({
      root: root || this.root,
      target: el,
      onRectChange,
      observerKey: nextObserverKey,
      containerObserver: container,
    });

    this.observerMap.set(el, observer);
    this.keyToObserverMap.set(nextObserverKey, observer);
    container.addObserver(observer);

    this.monitorIntersections(root);

    this.checkIntersection(el);

    return {
      observer,
      remover: () => {
        this.unobserve(nextObserverKey);
      },
    };
  }

  checkIntersection(el: View) {
    const observer = this.observerMap.get(el);
    if (observer) {
      observer.updateClientRect(() => {
        observer.updateIntersection();
      });
    }
  }

  updateClientRect(el: View) {
    this.checkIntersection(el);
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
    let records: IIntersectionObserverEntry[] = [];
    this.containers.forEach((container) => {
      records = records.concat(container.getRecords());
    });
    return records;
  }

  monitorIntersections(_doc: ReactNativeDocument) {
    let doc: ReactNativeDocument | null | undefined = _doc;
    if (!doc || this.monitoringDocuments.indexOf(doc) !== -1) {
      return;
    }

    /**
     * to ensure event only be bound only one time...
     */
    while (doc && this.monitoringDocuments.indexOf(doc) === -1) {
      this.monitoringDocuments.push(doc);
      const current = doc;

      const disposer = doc.addEventListener('onScroll', () => {
        const container = this.nodeToContainerObserverMap.get(current.node);
        container?.updateIntersection().then(() => {
          const entries = container.updateObserversIntersectionsInSmartWay();
          console.log('entry ', entries);
          this.callback(entries, this);
        });
      });
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
    this.updateIntersectionsTask.schedule();
  }

  _updateIntersectionsTask() {
    this.containers.forEach((container) => {
      container.updateIntersection().then(() => {
        container.updateObserversIntersectionsInSmartWay();
      });
    });
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
