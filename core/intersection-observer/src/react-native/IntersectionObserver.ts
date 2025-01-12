import { View, ScrollView, Platform } from 'react-native';
import { ClientRect, IntersectionObserverProps } from './types';
import {
  defaultViewabilityConfigCallbackPairs,
  getEmptyRect,
  parseRootMargin,
  viewabilityConfig,
} from './utils';
import IntersectionObserverEntry from './IntersectionObserverEntry';
import { ItemsDimensions } from '@infinite-list/items-dimensions';

class IntersectionObserver {
  private monitoringScrollViews: ScrollView[] = [];
  private callback: IntersectionObserverCallback;
  private root: ScrollView;
  private rootMargin: string;
  private threshold?: number | number[];
  private dimensions: ItemsDimensions;

  constructor(
    callback: IntersectionObserverCallback,
    props: IntersectionObserverProps
  ) {
    const { root, rootMargin, threshold } = props;
    this.callback = callback;
    this.root = root;
    this.threshold = threshold;
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

  observe(el: View, key?: string) {
    const entry = new IntersectionObserverEntry({
      target: el,
      time: Date.now(),
      boundingClientRect: getEmptyRect(),
      intersectionRect: getEmptyRect(),
      rootBounds: null,
    });
  }

  unobserve() {
    // TODO: implement
  }

  disconnect() {
    // TODO: implement
  }

  takeRecords() {
    // TODO: implement
  }

  monitorIntersections() {
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
