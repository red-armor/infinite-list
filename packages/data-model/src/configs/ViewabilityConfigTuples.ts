import SelectValue, {
  selectHorizontalValue,
  selectVerticalValue,
} from '../selectValue/SelectValue';
import {
  OnViewableItemsChanged,
  ViewabilityConfig,
  ViewabilityConfigCallbackPairs,
  ViewabilityConfigTuple,
} from '../types';
import ViewablityHelper from '../viewable/ViewablityHelper';
import {
  DEFAULT_CONFIG_MAP_KEY,
  DEFAULT_VIEWABILITY_CONFIG,
} from './constants';

class ViewabilityConfigTuples {
  readonly selectValue: SelectValue;
  private _tuples: Array<ViewabilityConfigTuple> = [];
  public viewabilityHelpers: Array<ViewablityHelper> = [];

  constructor(props: {
    horizontal: boolean;
    isListItem?: boolean;
    viewabilityConfig: ViewabilityConfig;
    viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs;
    onViewableItemsChanged?: OnViewableItemsChanged;
  }) {
    const {
      horizontal,
      viewabilityConfig,
      onViewableItemsChanged,
      isListItem = false,
      viewabilityConfigCallbackPairs = [],
    } = props;

    this.selectValue = horizontal ? selectHorizontalValue : selectVerticalValue;

    if (viewabilityConfigCallbackPairs.length) {
      viewabilityConfigCallbackPairs.forEach((pair) => {
        const {
          viewabilityConfig,
          viewabilityConfigMap = {},
          // 如果length为1的话，那么它就被认为是primary
          primary = viewabilityConfigCallbackPairs.length === 1,
          ...fns
        } = pair;

        const configMap = {
          ...viewabilityConfigMap,
        };
        if (viewabilityConfig) {
          configMap[DEFAULT_CONFIG_MAP_KEY] = viewabilityConfig;
        }
        const keys = Object.keys(configMap);
        const changed = keys.reduce((a, c) => (a[c] = []), {});

        const callbackMap = {};
        const fnKeys = Object.keys(fns);

        fnKeys
          .filter((fnKey) => /on\w*Changed/.test(fnKey))
          .forEach((key) => {
            callbackMap[key] = fns[key];
          });

        this._tuples.push({
          configMap,
          changed,
          callbackMap,
          primary,
        });
      });
    } else if (onViewableItemsChanged) {
      this._tuples.push({
        changed: {
          [DEFAULT_CONFIG_MAP_KEY]: [],
        },
        configMap: {
          [DEFAULT_CONFIG_MAP_KEY]:
            viewabilityConfig || DEFAULT_VIEWABILITY_CONFIG,
        },
        callbackMap: {
          onViewableItemsChanged,
        },
        primary: true,
      });
    }

    this._tuples.forEach((tuple) => {
      this.viewabilityHelpers.push(
        new ViewablityHelper({
          tuple,
          horizontal,
          isListItem,
        })
      );
    });
  }

  getTuples() {
    return this._tuples;
  }

  getViewabilityHelpers() {
    return this.viewabilityHelpers;
  }
}

export default ViewabilityConfigTuples;
