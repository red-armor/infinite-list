import { View, ScrollView } from 'react-native';
import { IntersectionObserverProps } from './types';

class IntersectionObserver {
  private monitoringScrollViews: ScrollView[] = [];
  private callback: IntersectionObserverCallback;
  private root: ScrollView;
  private rootMargin?: string;
  private threshold?: number | number[];

  constructor(
    callback: IntersectionObserverCallback,
    props: IntersectionObserverProps
  ) {
    const { root, rootMargin, threshold } = props;
    this.callback = callback;
    this.root = root;
    this.rootMargin = rootMargin;
    this.threshold = threshold;
  }

  observe(el: View) {
    // TODO: implement
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
}

export default IntersectionObserver;
