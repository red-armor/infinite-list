import {
  ScrollMetrics,
  ViewabilityConfig,
  OnViewableItemsChanged,
  ViewabilityConfigCallbackPairs,
} from '../types';
import ItemMeta from '../ItemMeta';
import BaseDimensions from '../BaseDimensions';
import ViewablityHelper from './ViewablityHelper';
import { DEFAULT_VIEWABILITY_CONFIG } from './constants';

class ViewabilityConfigTuples {
  private _tuple: ViewabilityConfigCallbackPairs = [];
  public viewabilityHelpers: Array<ViewablityHelper> = [];

  constructor(props: {
    isListItem?: boolean;
    viewabilityConfig: ViewabilityConfig;
    viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs;
    onViewableItemsChanged?: OnViewableItemsChanged;
  }) {
    const {
      viewabilityConfig = DEFAULT_VIEWABILITY_CONFIG,
      onViewableItemsChanged,
      isListItem = false,
      viewabilityConfigCallbackPairs = [],
    } = props;

    if (viewabilityConfigCallbackPairs.length) {
      if (
        viewabilityConfigCallbackPairs.length === 1 &&
        viewabilityConfigCallbackPairs[0].viewabilityConfig
      ) {
        viewabilityConfigCallbackPairs[0].viewabilityConfig.name = 'viewable';
      }
      viewabilityConfigCallbackPairs.forEach((pair) => {
        const { viewabilityConfig, onViewableItemsChanged } = pair;

        if (!viewabilityConfig.name) {
          console.warn(
            '[ViewabilityConfigTuples warning] `viewabilityConfig.name` is required'
          );
        } else {
          this._tuple.push({
            onViewableItemsChanged,
            viewabilityConfig,
          });
        }
      });
    } else if (onViewableItemsChanged) {
      this._tuple.push({
        onViewableItemsChanged,
        viewabilityConfig: {
          name: 'viewable',
          ...viewabilityConfig,
        },
      });
    }

    this._tuple.forEach((pair) => {
      this.viewabilityHelpers.push(
        new ViewablityHelper({
          pair,
          isListItem,
        })
      );
    });
  }

  get tuple() {
    return this._tuple;
  }

  getDefaultState(defaultValue?: boolean) {
    return this.tuple.reduce<{
      [key: string]: boolean;
    }>((acc, pair) => {
      const { viewabilityConfig } = pair;
      const { name } = viewabilityConfig;
      if (name) acc[name] = !!defaultValue;
      return acc;
    }, {});
  }

  getViewabilityHelpers() {
    return this.viewabilityHelpers;
  }

  resolveItemMetaState(
    itemMeta: ItemMeta,
    options: {
      dimensions: BaseDimensions;
      scrollMetrics: ScrollMetrics;
    }
  ) {
    const { scrollMetrics } = options;
    return this.viewabilityHelpers.reduce((value, helper) => {
      const falsy = helper.checkItemViewability(itemMeta, scrollMetrics);
      const key = helper.configName;
      value[key] = falsy;
      return value;
    }, {});
  }
}

export default ViewabilityConfigTuples;
