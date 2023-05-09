import resolveChanged from '@x-oasis/resolve-changed';
import ViewabilityItemMeta from './ViewabilityItemMeta';
import {
  ScrollMetrics,
  ViewabilityScrollMetrics,
  ViewAreaModeConfig,
  ViewabilityConfig,
  OnViewableItemsChanged,
  NormalizedViewablityConfig,
  ViewabilityConfigCallbackPair,
  VisiblePercentModeConfig,
} from '../types';
import { isItemViewable } from './viewabilityUtils';

// const createIntervalTreeItemChangedToken = (opts: {
//   helper: ViewabilityItemMeta;
//   falsy?: boolean;
//   propsKey: string;
// }) => {
//   const { helper, falsy, propsKey } = opts;
//   const helperMeta = {};
//   // const helperMeta = helper?.getMetaOnViewableItemsChanged
//   //   ? helper.getMetaOnViewableItemsChanged() || {}
//   //   : {};
//   return {
//     helper,
//     key: helper.getKey(),
//     [propsKey]: !!falsy,
//     ...helperMeta,
//   };
// };

// const createBasicItemChangedToken = (opts: {
//   helper: ViewabilityItemMeta;
//   falsy?: boolean;
//   propsKey: string;
// }): {
//   helper: ViewabilityItemMeta;
//   key: string;
// } => {
//   const { helper, falsy, propsKey } = opts;
//   return {
//     helper,
//     key: helper.getKey(),
//     [propsKey]: !!falsy,
//   };
// };

const createChangedToken = (opts: {
  helper: ViewabilityItemMeta;
  isViewable: boolean;
  // falsy?: boolean;
  // propsKey: string;
  isListItem?: boolean;
}) => {
  const { helper, isViewable } = opts;
  return {
    item: null,
    key: helper.getKey(),
    isViewable,
    // TODO
    index: null,
  };
  // const { isListItem = false, ...rest } = opts;
  // if (isListItem) return createIntervalTreeItemChangedToken(rest);
  // return createBasicItemChangedToken(rest);
};

class ViewablityHelper {
  readonly isListItem: boolean;
  private _configName: string;
  private _changed: Array<ViewabilityItemMeta> = [];
  private _config: NormalizedViewablityConfig;
  private _callback: OnViewableItemsChanged;
  readonly _pair: ViewabilityConfigCallbackPair;

  constructor(props: {
    isListItem: boolean;
    pair: ViewabilityConfigCallbackPair;
  }) {
    const { pair, isListItem } = props;

    this._pair = pair;
    this._configName = pair.viewabilityConfig.name;
    this.isListItem = isListItem;

    this._config = this.normalizeTupleConfig(this._pair.viewabilityConfig);
    this._callback = this._pair.onViewableItemsChanged;
  }

  /**
   * Return state for rendering. It could be { isViewable: true, isImageViewable: false, ...}
   */
  get defaultStateViewToken() {
    return {
      [this._configName]: false,
    };
  }

  get configName() {
    return this._configName;
  }

  get config() {
    return this._config;
  }

  get callback() {
    return this._callback;
  }

  /**
   * View Token for `onItemsChanged` callback
   */
  createChangedViewToken() {}

  resolveChangedViewTokenCallbackInfo() {}

  /**
   *
   * @param tupleConfig
   * @returns
   *   - viewAreaMode: if true then it will compare with viewport
   *   - viewablePercentThreshold: It's a merged value
   */
  normalizeTupleConfig(tupleConfig: ViewabilityConfig): {
    viewport: number;
    exclusive: boolean;
    viewAreaMode: boolean;
    viewablePercentThreshold: number;
  } {
    const viewport = tupleConfig.viewport || 0;
    const exclusive = !!tupleConfig.exclusive;
    const viewAreaCoveragePercentThreshold =
      (tupleConfig as ViewAreaModeConfig).viewAreaCoveragePercentThreshold || 0;
    const itemVisiblePercentThreshold =
      (tupleConfig as VisiblePercentModeConfig).itemVisiblePercentThreshold ||
      0;
    return {
      ...tupleConfig,
      viewport,
      exclusive,
      viewAreaMode: !!viewAreaCoveragePercentThreshold,
      viewablePercentThreshold:
        viewAreaCoveragePercentThreshold || itemVisiblePercentThreshold,
    };
  }

  checkItemViewability(
    viewabilityItemMeta: ViewabilityItemMeta,
    scrollMetrics: ViewabilityScrollMetrics,
    getItemOffset?: (itemMeta: ViewabilityItemMeta) => number
  ) {
    const { viewport, viewAreaMode, viewablePercentThreshold } = this._config;
    return isItemViewable({
      viewport,
      getItemOffset,
      viewAreaMode,
      viewabilityItemMeta,
      viewablePercentThreshold,
      viewabilityScrollMetrics: scrollMetrics,
    });
  }

  resolveViewableItems(
    itemsMeta: Array<ViewabilityItemMeta>,
    scrollMetrics: ViewabilityScrollMetrics
  ) {
    const { exclusive } = this._config;

    let nextData = itemsMeta.filter((itemMeta) =>
      this.checkItemViewability(itemMeta, scrollMetrics)
    );

    if (exclusive) nextData = nextData.slice(0, 1);

    return nextData;
  }

  // onUpdateTupleConfig(
  //   configKey: string,
  //   tupleConfig: ViewabilityConfig,
  //   options: {
  //     dimensions: BaseDimensions;
  //     scrollMetrics: ScrollMetrics;
  //   }
  // ) {
  //   const { scrollMetrics, dimensions } = options;
  //   const {
  //     offset: scrollOffset,
  //     contentLength,
  //     visibleLength: viewportLength,
  //   } = scrollMetrics;
  //   const length = dimensions.getContainerOffset();

  //   let nextData = [] as Array<ViewabilityItemMeta>;

  //   // 如果是一个List的话，那么它是基于container offset来算的
  //   const startOffset = this.isListItem ? length : 0;
  //   // const config = this.tuple.configMap[configKey];
  //   const viewport = tupleConfig.viewport || 0;
  //   const minOffset = Math.max(
  //     0,
  //     scrollOffset - startOffset - viewportLength * viewport
  //   );
  //   const maxOffset = Math.min(
  //     scrollOffset - startOffset + viewportLength * (viewport + 1),
  //     contentLength - startOffset
  //   );

  //   nextData = dimensions.computeIndexRangeMeta(minOffset, maxOffset);

  //   nextData = this.resolveViewableItems(
  //     nextData,
  //     configKey,
  //     tupleConfig,
  //     options
  //   );
  //   return nextData;
  // }

  onUpdateItemsMeta(
    itemsMeta: Array<ViewabilityItemMeta>,
    scrollMetrics: ScrollMetrics
  ) {
    const nextViewableItems = this.resolveViewableItems(
      itemsMeta,
      scrollMetrics
    );
    this.mergeState(nextViewableItems);
    this.performViewableItemsChangedCallback(nextViewableItems);
  }

  performViewableItemsChangedCallback(
    nextViewableItems: Array<ViewabilityItemMeta> = []
  ) {
    // 触发changed items callback；
    if (typeof this._callback === 'function') {
      const { removed, added } = resolveChanged(
        this._changed,
        nextViewableItems
      );

      const [addedTokens, removedTokens] = [added, removed].map(
        (entry, entryIndex) =>
          entry.map((itemMeta) =>
            createChangedToken({
              helper: itemMeta,
              isViewable: !entryIndex,
              // falsy: !entryIndex,
              // propsKey: 'isViewable',
              isListItem: this.isListItem,
            })
          )
      );

      this._callback({
        viewableItems: nextViewableItems.map((helper) =>
          createChangedToken({
            helper,
            isViewable: true,
            // falsy: true,
            // propsKey: 'isViewable',
            isListItem: this.isListItem,
          })
        ),
        changed: [].concat(addedTokens, removedTokens),
      });
    }
    this._changed = nextViewableItems;
  }

  // onUpdateMetrics(options: {
  //   dimensions: BaseDimensions;
  //   scrollMetrics: ScrollMetrics;
  // }) {
  //   const nextChanged = Object.entries(this.tuple.configMap).reduce<{
  //     [key: string]: Array<ViewabilityItemMeta>;
  //   }>((result, current) => {
  //     const [configKey, tupleConfig] = current;
  //     const nextData = this.onUpdateTupleConfig(
  //       configKey,
  //       tupleConfig,
  //       options
  //     );
  //     result[configKey] = nextData.slice();
  //     return result;
  //   }, {});

  //   this.mergeState(nextChanged);

  //   // tuple在处理都结束以后才进行更新
  //   Object.keys(this.tuple.configMap).forEach((configKey) => {
  //     const newItems = nextChanged[configKey];
  //     this.tuple.changed[configKey] = newItems;
  //   });
  // }

  mergeState(nextViewableItems: Array<ViewabilityItemMeta>) {
    const itemMetaStateMap = new Map<
      ViewabilityItemMeta,
      {
        [key: string]: boolean;
      }
    >();

    this._changed.forEach((itemMeta) => {
      if (!itemMetaStateMap.has(itemMeta)) {
        itemMetaStateMap.set(itemMeta, { ...this.defaultStateViewToken });
      }
    });

    nextViewableItems.forEach((itemMeta) => {
      itemMetaStateMap.set(itemMeta, {
        ...(itemMetaStateMap.get(itemMeta) || {}),
        [this._configName]: true,
      });
    });

    for (const [itemMeta, state] of itemMetaStateMap) {
      // @ts-ignore TODO, should reconsider.
      // it only used for itemDimensions.....
      itemMeta.setItemMetaState(state);
    }
  }
}

export default ViewablityHelper;
