import { Platform } from 'react-native';
import { ItemsDimensions } from '@infinite-list/items-dimensions';
import {
  defaultViewabilityConfigCallbackPairs,
  getEmptyRect,
  viewabilityConfig,
} from './utils';
import { IClientRectReadOnly } from '../types';

class ContainerObserver {
  private dimensions: ItemsDimensions;
  private intersection: IClientRectReadOnly = getEmptyRect();

  constructor() {
    this.dimensions = new ItemsDimensions({
      id: 'intersection-observer',
      horizontal: false,
      viewabilityConfig,
      viewabilityConfigCallbackPairs: defaultViewabilityConfigCallbackPairs,
      canIUseRIC: Platform.OS !== 'ios',
    });
  }
}

export default ContainerObserver;
