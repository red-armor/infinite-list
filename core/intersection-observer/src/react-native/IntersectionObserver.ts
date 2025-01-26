import { View, ScrollView, Platform } from 'react-native';
import { ClientRect, IntersectionObserverProps } from './types';
import {
  defaultViewabilityConfigCallbackPairs,
  parseRootMargin,
  viewabilityConfig,
} from './utils';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import Observer from './Observer';
import ReactNativeDocument from './Document';
import { generateRandomKey } from './generateRandom';
import { IScrollViewMarshal } from '@infinite-list/types';

class IntersectionObserver {
  private monitoringScrollViews: ScrollView[] = [];
  private callback: IntersectionObserverCallback;
  private root: ScrollView;
  private rootMargin: string;
  private threshold?: number | number[];
  private dimensions: ItemsDimensions;
  private observerMap: WeakMap<View, Observer> = new WeakMap();
  private ownerDocument: ReactNativeDocument;
  private keyToObserverMap: Map<string, Observer> = new Map();

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
    this.rootMargin = marginValues
      .map(function (margin) {
        return margin.value + margin.unit;
      })
      .join(' ');
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
  observe(el: View, observerKey?: string) {
    const nextObserverKey = observerKey || generateRandomKey();
    const observer = new Observer({
      root: this.root,
      target: el,
      observerKey: nextObserverKey,
      dimensions: this.dimensions,
    });
    this.observerMap.set(el, observer);
    this.keyToObserverMap.set(nextObserverKey, observer);
    this.checkIntersection(el);
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

  monitorIntersections(marshal: IScrollViewMarshal) {
    // TODO: implement
  }

  unmonitorIntersections() {
    // TODO: implement
  }

  updateIntersections() {
    // TODO: implement
  }

  getClientRect(key: string) {
    // TODO: implement
  }

  setClientRect(key: string, rect: ClientRect) {
    // TODO: implement
  }
}

export default IntersectionObserver;
