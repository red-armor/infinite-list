import { ScrollView, View } from 'react-native';
import {
  IRectReadOnly,
  IntersectionObserverEntryProps,
  IIntersectionObserverEntry,
} from './types';
import { getEmptyRect, generateRandomKey } from './utils';
import { measureLayout } from './measure';
import { ItemsDimensions } from '@infinite-list/items-dimensions';

class IntersectionObserverEntry {
  private target: View;
  readonly entryKey: string;
  private root: ScrollView;
  private clientRect: IRectReadOnly;
  private dimensions: ItemsDimensions;

  constructor(props: IntersectionObserverEntryProps) {
    const { target, root, dimensions, entryKey = generateRandomKey() } = props;
    this.root = root;
    this.target = target;
    this.entryKey = entryKey;
    this.clientRect = getEmptyRect();
    this.dimensions = dimensions;
  }

  updateClientRect() {
    measureLayout(this.target, this.root, (x, y, width, height) => {
      this.clientRect = {
        ...this.clientRect,
        x,
        y,
        width,
        height,
      };
      this.dimensions.setKeyItemLayout(this.entryKey, {
        x,
        y,
        width,
        height,
      });
    });
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
