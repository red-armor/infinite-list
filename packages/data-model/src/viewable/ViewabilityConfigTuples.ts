import uniqueArrayObject from '@x-oasis/unique-array-object';
import {
  GenericItemT,
  ViewabilityConfig,
  OnViewableItemsChanged,
  ViewabilityConfigCallbackPairs,
  ViewabilityScrollMetrics,
} from '../types';
import ViewablityHelper from './ViewablityHelper';
import { DEFAULT_VIEWABILITY_CONFIG } from './constants';
import ItemMeta from '../ItemMeta';
import ViewabilityItemMeta from './ViewabilityItemMeta';

class ViewabilityConfigTuples<ItemT extends GenericItemT = GenericItemT> {
  private _tuple: ViewabilityConfigCallbackPairs = [];
  public viewabilityHelpers: Array<ViewablityHelper> = [];

  constructor(props: {
    isListItem?: boolean;
    viewabilityConfig?: ViewabilityConfig;
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
        const {
          viewabilityConfig = DEFAULT_VIEWABILITY_CONFIG,
          onViewableItemsChanged,
        } = pair;

        if (!viewabilityConfig?.name) {
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
          // @ts-expect-error
          name: 'viewable',
          ...viewabilityConfig,
        },
      });
    } else if (viewabilityConfig) {
      this.tuple.push({
        viewabilityConfig: {
          // @ts-expect-error
          name: 'viewable',
          ...viewabilityConfig,
        },
      });
    }

    // @ts-expect-error
    this._tuple = uniqueArrayObject(
      this._tuple,
      (config) => config.viewabilityConfig.name
    );

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
      const { name } = viewabilityConfig || {};
      if (name) acc[name] = !!defaultValue;
      return acc;
    }, {});
  }

  getViewabilityHelpers() {
    return this.viewabilityHelpers;
  }

  resolveItemMetaState(
    itemMeta: ItemMeta<ItemT>,
    viewabilityScrollMetrics?: ViewabilityScrollMetrics,
    getItemOffset?: (itemMeta: ItemMeta<ItemT> | ViewabilityItemMeta) => number
  ) {
    if (!viewabilityScrollMetrics || !itemMeta)
      return itemMeta.getState() || {};
    if (!itemMeta.getLayout()) return itemMeta?.getState() || {};
    return this.viewabilityHelpers.reduce<{
      [key: string]: boolean;
    }>((value, helper) => {
      const falsy = helper.checkItemViewability(
        itemMeta,
        viewabilityScrollMetrics,
        getItemOffset
      );
      const key = helper.configName;
      value[key] = falsy;
      return value;
    }, {});
  }
}

export default ViewabilityConfigTuples;
