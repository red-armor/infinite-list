import { ScrollView, View } from 'react-native';
import { ObserverProps } from './types';
import { IRectReadOnly } from './types';
import { getEmptyRect, generateRandomKey } from './utils';
import { measureLayout } from './measure';
import { ItemsDimensions } from '@infinite-list/items-dimensions';

class Observer {
  private root: ScrollView;
  private target: View;
  private observerKey: string;
  private clientRect: IRectReadOnly;
  private dimensions: ItemsDimensions;

  constructor(props: ObserverProps) {
    const {
      root,
      target,
      observerKey = generateRandomKey(),
      dimensions,
    } = props;
    this.root = root;
    this.target = target;
    this.observerKey = observerKey;
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
      this.dimensions.setKeyItemLayout(this.observerKey, {
        x,
        y,
        width,
        height,
      });
    });
  }
}

export default Observer;
