import { View } from 'react-native';
import {
  IntersectionObserverEntryProps,
  IIntersectionObserverEntry,
} from './types';
import { getEmptyRect } from './utils';

class IntersectionObserverEntry {
  private target: View;

  constructor(props: IntersectionObserverEntryProps) {
    const { target } = props;
    this.target = target;
  }

  getEntry(): IIntersectionObserverEntry {
    return {
      time: 0,
      target: this.target,
      rootBounds: null,
      boundingClientRect: getEmptyRect(),
      intersectionRect: getEmptyRect(),
      isIntersecting: false,
      intersectionRatio: 0,
    };
  }
}

export default IntersectionObserverEntry;
