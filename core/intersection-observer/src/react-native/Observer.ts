import { ScrollView, View } from 'react-native';
import { ObserverProps } from './types';
import { IVerboseRectReadOnly } from './types';
import { getEmptyRect } from './utils';
import { generateRandomKey } from './generateRandom';
import { measureLayout } from './measure';
import { ItemsDimensions } from '@infinite-list/items-dimensions';

class Observer {
  private root: ScrollView;
  private target: View;
  private observerKey: string;
  private clientRect: IVerboseRectReadOnly;
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

  dispose() {
    this.dimensions.dispose(this.observerKey);
  }

  /**
   * callback will be invoked after layout measured
   */
  updateClientRect(cb?: (rect: IVerboseRectReadOnly) => void) {
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
