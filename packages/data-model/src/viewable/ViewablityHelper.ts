import resolveChanged from '@x-oasis/resolve-changed';
import capitalize from '@x-oasis/capitalize';
import SelectValue, {
  selectHorizontalValue,
  selectVerticalValue,
} from '@x-oasis/select-value';

import BaseDimensions from '../BaseDimensions';
import ItemMeta from '../ItemMeta';
import { removeItemsKeyword } from '../common';
import {
  ScrollMetrics,
  ViewAreaModeConfig,
  ViewabilityConfig,
  ViewabilityConfigTuple,
  VisiblePercentModeConfig,
} from '../types';
import { isItemMetaViewable } from './viewabilityUtils';

const createIntervalTreeItemChangedToken = (opts: {
  helper: ItemMeta;
  falsy?: boolean;
  propsKey: string;
}) => {
  const { helper, falsy, propsKey } = opts;
  const helperMeta = helper?.getMetaOnViewableItemsChanged
    ? helper.getMetaOnViewableItemsChanged() || {}
    : {};
  return {
    helper,
    key: helper.getKey(),
    [propsKey]: !!falsy,
    ...helperMeta,
  };
};

const createBasicItemChangedToken = (opts: {
  helper: ItemMeta;
  falsy?: boolean;
  propsKey: string;
}): {
  helper: ItemMeta;
  key: string;
} => {
  const { helper, falsy, propsKey } = opts;
  return {
    helper,
    key: helper.getKey(),
    [propsKey]: !!falsy,
  };
};

const createChangedToken = (opts: {
  helper: ItemMeta;
  falsy?: boolean;
  propsKey: string;
  isListItem?: boolean;
}) => {
  const { isListItem = false, ...rest } = opts;
  if (isListItem) return createIntervalTreeItemChangedToken(rest);
  return createBasicItemChangedToken(rest);
};

class ViewablityHelper {
  readonly selectValue: SelectValue;
  readonly tuple: ViewabilityConfigTuple;
  readonly isListItem: boolean;
  readonly horizontal: boolean;

  constructor(props: {
    horizontal: boolean;
    isListItem: boolean;
    tuple: ViewabilityConfigTuple;
  }) {
    const { tuple, isListItem, horizontal } = props;

    this.tuple = tuple;
    this.horizontal = !!horizontal;
    this.selectValue = horizontal ? selectHorizontalValue : selectVerticalValue;
    this.isListItem = isListItem;
  }

  onItemsMetaChange(
    itemsMeta: Array<ItemMeta>,
    configKey: string,
    tupleConfig: ViewabilityConfig,
    options: {
      dimensions: BaseDimensions;
      scrollMetrics: ScrollMetrics;
    }
  ) {
    const { scrollMetrics } = options;

    const viewport = tupleConfig.viewport || 0;
    const exclusive = tupleConfig.exclusive;
    const viewAreaCoveragePercentThreshold =
      (tupleConfig as ViewAreaModeConfig).viewAreaCoveragePercentThreshold || 0;
    const itemVisiblePercentThreshold =
      (tupleConfig as VisiblePercentModeConfig).itemVisiblePercentThreshold ||
      0;

    let nextData = itemsMeta;

    nextData = nextData.filter((itemMeta) =>
      isItemMetaViewable({
        itemMeta,
        viewport,
        scrollMetrics,
        viewAreaMode: !!viewAreaCoveragePercentThreshold,
        viewablePercentThreshold:
          viewAreaCoveragePercentThreshold || itemVisiblePercentThreshold,
      })
    );

    if (exclusive) nextData = nextData.slice(0, 1);

    const { changed, callbackMap } = this.tuple;
    const callbackKey = `on${capitalize(configKey)}Changed`;
    const callback = callbackMap[callbackKey];
    const propsKey = `is${capitalize(
      removeItemsKeyword(configKey) || 'Viewable'
    )}`;

    const oldItems = changed[configKey] || [];
    const newItems = nextData || [];
    const { removed, added } = resolveChanged(oldItems, newItems);

    // 触发changed items callback；
    if (typeof callback === 'function') {
      const addedTokens = added.map((itemMeta) =>
        createChangedToken({
          helper: itemMeta,
          falsy: true,
          propsKey,
          isListItem: this.isListItem,
        })
      );
      const removedTokens = removed.map((itemMeta) =>
        createChangedToken({
          helper: itemMeta,
          falsy: false,
          propsKey,
          isListItem: this.isListItem,
        })
      );

      callback({
        [configKey]: newItems.map((helper) =>
          createChangedToken({
            helper,
            falsy: true,
            propsKey,
            isListItem: this.isListItem,
          })
        ),
        changed: [].concat(addedTokens, removedTokens),
      });
    }

    return nextData;
  }

  onUpdateTupleConfig(
    configKey: string,
    tupleConfig: ViewabilityConfig,
    options: {
      dimensions: BaseDimensions;
      scrollMetrics: ScrollMetrics;
    }
  ) {
    const { scrollMetrics, dimensions } = options;
    const {
      offset: scrollOffset,
      contentLength,
      visibleLength: viewportLength,
    } = scrollMetrics;
    const length = dimensions.getContainerOffset();

    let nextData = [] as Array<ItemMeta>;

    // 如果是一个List的话，那么它是基于container offset来算的
    const startOffset = this.isListItem ? length : 0;
    // const config = this.tuple.configMap[configKey];
    const viewport = tupleConfig.viewport || 0;
    const minOffset = Math.max(
      0,
      scrollOffset - startOffset - viewportLength * viewport
    );
    const maxOffset = Math.min(
      scrollOffset - startOffset + viewportLength * (viewport + 1),
      contentLength - startOffset
    );

    nextData = dimensions.computeIndexRangeMeta(minOffset, maxOffset);

    nextData = this.onItemsMetaChange(
      nextData,
      configKey,
      tupleConfig,
      options
    );
    return nextData;
  }

  onUpdateItemsMeta(
    itemsMeta: Array<ItemMeta>,
    options: {
      dimensions: BaseDimensions;
      scrollMetrics: ScrollMetrics;
    }
  ) {
    const nextChanged = Object.entries(this.tuple.configMap).reduce<{
      [key: string]: Array<ItemMeta>;
    }>((result, current) => {
      const [configKey, tupleConfig] = current;
      const nextData = this.onItemsMetaChange(
        itemsMeta,
        configKey,
        tupleConfig,
        options
      );
      result[configKey] = nextData.slice();
      return result;
    }, {});

    this.mergeState(nextChanged);

    // tuple在处理都结束以后才进行更新
    Object.keys(this.tuple.configMap).forEach((configKey) => {
      const newItems = nextChanged[configKey];
      this.tuple.changed[configKey] = newItems;
    });
  }

  onUpdateMetrics(options: {
    dimensions: BaseDimensions;
    scrollMetrics: ScrollMetrics;
  }) {
    const nextChanged = Object.entries(this.tuple.configMap).reduce<{
      [key: string]: Array<ItemMeta>;
    }>((result, current) => {
      const [configKey, tupleConfig] = current;
      const nextData = this.onUpdateTupleConfig(
        configKey,
        tupleConfig,
        options
      );
      result[configKey] = nextData.slice();
      return result;
    }, {});

    this.mergeState(nextChanged);

    // tuple在处理都结束以后才进行更新
    Object.keys(this.tuple.configMap).forEach((configKey) => {
      const newItems = nextChanged[configKey];
      this.tuple.changed[configKey] = newItems;
    });
  }

  mergeState(nextChanged: { [key: string]: Array<ItemMeta> }) {
    const itemMetaStateMap = new Map<
      ItemMeta,
      {
        [key: string]: boolean;
      }
    >();

    const configKeys = Object.keys(this.tuple.configMap);

    const defaultToken = configKeys.reduce((acc, cur) => {
      const nextCur = removeItemsKeyword(cur);
      acc[nextCur] = false;
      return acc;
    }, {});

    configKeys.forEach((configKey) => {
      const { changed } = this.tuple;
      const items = changed[configKey] || [];
      items.forEach((itemMeta) => {
        if (!itemMetaStateMap.has(itemMeta)) {
          itemMetaStateMap.set(itemMeta, { ...defaultToken });
        }
      });
    });

    configKeys.forEach((configKey) => {
      const items = nextChanged[configKey];
      items.forEach((itemMeta) => {
        if (!itemMetaStateMap.has(itemMeta)) {
          itemMetaStateMap.set(itemMeta, { ...defaultToken });
        }
        const nextConfigKey = removeItemsKeyword(configKey);
        itemMetaStateMap.set(itemMeta, {
          ...itemMetaStateMap.get(itemMeta),
          [nextConfigKey]: true,
        });
      });
    });

    for (const [itemMeta, state] of itemMetaStateMap) {
      itemMeta.setItemMetaState(state);
    }
  }
}

export default ViewablityHelper;
