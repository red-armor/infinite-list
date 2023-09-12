import Batchinator from '@x-oasis/batchinator';
import isClamped from '@x-oasis/is-clamped';
import noop from '@x-oasis/noop';
import shallowArrayEqual from '@x-oasis/shallow-array-equal';
import resolveChanged from '@x-oasis/resolve-changed';
import defaultBooleanValue from '@x-oasis/default-boolean-value';
import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';
import BaseLayout from './BaseLayout';
import Dimension from './Dimension';
import ItemMeta from './ItemMeta';
import ItemsDimensions from './ItemsDimensions';
import ListDimensions from './ListDimensions';
import { isEmpty } from './common';
import ViewabilityConfigTuples from './viewable/ViewabilityConfigTuples';
import manager from './manager';
import createStore from './state/createStore';
import { ReducerResult, Store } from './state/types';
import {
  FillingMode,
  InspectingAPI,
  InspectingListener,
  ItemLayout,
  ListDimensionsProps,
  ListGroupDimensionsProps,
  ListRangeResult,
  ListRenderState,
  OnEndReached,
  ScrollMetrics,
  StateListener,
  ListGroupData,
} from './types';
import ListSpyUtils from './utils/ListSpyUtils';
import EnabledSelector from './utils/EnabledSelector';
import OnEndReachedHelper from './viewable/OnEndReachedHelper';
import ListBaseDimensions from './ListBaseDimensions';
import ListProvider from './ListProvider';

// TODO: indexRange should be another intervalTree
/**
 * ListGroupDimensions has two kinds of data model
 * - normal list: group of same item.
 * - singleton item: abstraction of specified item.
 *
 * ListGroup is just like a router.
 */
class ListGroupDimensions<ItemT extends {} = {}>
  extends BaseLayout
  implements ListProvider
{
  public indexKeys: Array<string> = [];
  private _selector = new EnabledSelector();
  itemToDimensionMap: WeakMap<any, any> = new WeakMap();
  private keyToListDimensionsMap: Map<string, ListDimensions | Dimension> =
    new Map();
  private _itemsDimensions: ItemsDimensions;
  _onUpdateItemLayout?: Function;
  _onUpdateIntervalTree?: Function;
  _configTuples: ViewabilityConfigTuples;
  readonly onEndReachedHelper: OnEndReachedHelper;
  private _dispatchMetricsBatchinator: Batchinator;
  private _store: Store<ReducerResult>;
  private _scrollMetrics: ScrollMetrics;
  private _renderState: ListRenderState;
  private _renderStateListeners: Array<Function> = [];
  private _renderStateListenersCleaner: Array<Function> = [];
  private _onBatchLayoutFinished: () => boolean;
  private _onUpdateDimensionItemsMetaChangeBatchinator: Batchinator;
  private _updateScrollMetricsWithCacheBatchinator: Batchinator;
  private _updateChildPersistanceIndicesBatchinator: Batchinator;
  public recalculateDimensionsIntervalTreeBatchinator: Batchinator;
  private _heartBeatingIndexKeys: Array<string> = [];
  private _heartBeatResolveChangedBatchinator: Batchinator;
  private _inspectingListener: InspectingListener;
  /**
   * _flattenData could be considered as the final data model after transform
   * 1. dimension
   * 2. normal list
   */
  private _flattenData: Array<ListGroupData> = [];

  private _rangeResult: {
    bufferedMetaRanges: ListRangeResult;
    visibleMetaRanges: ListRangeResult;
  };
  private _dispatchedMetricsResult: ReducerResult;
  private _dimensionsIntervalTree: PrefixIntervalTree = new PrefixIntervalTree(
    100
  );

  private registeredKeys: Array<string> = [];
  private _inspectingTimes = 0;
  private _inspectingTime: number = +Date.now();
  private _heartBeatingIndexKeysSentCommit: Array<string> = [];
  private _startInspectBatchinator: Batchinator;
  private _listBaseDimension: ListBaseDimensions<any>;

  private _reflowItemsLength = 0;
  private _dimensionsIndexRange: Array<{
    dimensions: Dimension | ListDimensions;
    startIndex: number;
    endIndex: number;
  }> = [];

  private _removeList: Function;

  constructor(props: ListGroupDimensionsProps) {
    super({
      recycleEnabled: true,
      ...props,
    });
    const {
      id,
      onUpdateItemLayout,
      onUpdateIntervalTree,
      viewabilityConfig,
      onViewableItemsChanged,
      onEndReached,
      viewabilityConfigCallbackPairs,
      onEndReachedThreshold,
      onEndReachedTimeoutThreshold,
      onBatchLayoutFinished,
      onEndReachedHandlerTimeoutThreshold,
      recycleEnabled = true,
    } = props;

    this._itemsDimensions = new ItemsDimensions({
      id,
    });
    this._onUpdateIntervalTree = onUpdateIntervalTree;
    this._onUpdateItemLayout = onUpdateItemLayout;
    this._configTuples = new ViewabilityConfigTuples({
      // horizontal: this.getHorizontal(),
      viewabilityConfig,
      onViewableItemsChanged,
      isListItem: true,
      viewabilityConfigCallbackPairs,
    });
    this._dispatchMetricsBatchinator = new Batchinator(
      this.dispatchMetrics.bind(this),
      50
    );

    this.onEndReachedHelper = new OnEndReachedHelper({
      id,
      onEndReached,
      onEndReachedThreshold,
      onEndReachedTimeoutThreshold,
      onEndReachedHandlerTimeoutThreshold,
    });

    this._store = createStore<ReducerResult>();
    this._onBatchLayoutFinished = onBatchLayoutFinished;
    this._onUpdateDimensionItemsMetaChangeBatchinator = new Batchinator(
      this.onUpdateDimensionItemsMetaChange.bind(this),
      100
    );
    this._updateScrollMetricsWithCacheBatchinator = new Batchinator(
      this.updateScrollMetricsWithCache.bind(this),
      50
    );

    this._heartBeatResolveChangedBatchinator = new Batchinator(
      this.heartBeatResolveChanged.bind(this),
      50
    );

    this._updateChildPersistanceIndicesBatchinator = new Batchinator(
      this.updateChildPersistanceIndices.bind(this),
      50
    );

    this.recalculateDimensionsIntervalTreeBatchinator = new Batchinator(
      this.recalculateDimensionsIntervalTree.bind(this),
      50
    );
    // 主要用来巡检
    this._startInspectBatchinator = new Batchinator(
      this.startInspection.bind(this),
      50
    );

    this._removeList = manager.addList(this);
    this.heartBeat = this.heartBeat.bind(this);
    this.startInspection = this.startInspection.bind(this);

    this._listBaseDimension = new ListBaseDimensions({
      id: 'listGroupDimensions',
      data: this._flattenData,
      getData: this.getData.bind(this),
      recycleEnabled,
      /**
       *
       * @param item
       * @param index
       * @returns
       *
       * TODO: should passing item keyExtractor....
       */
      keyExtractor: (item, index) => `${index}`,

      provider: this,
    });
  }

  get selector() {
    return this._selector;
  }

  ensureDimension() {}

  cleanup() {
    this._removeList?.();
    this._renderStateListeners = [];
  }

  getOnEndReachedHelper() {
    return this.onEndReachedHelper;
  }

  getIndexKeys() {
    return this.indexKeys;
  }

  getDimension(key: string) {
    return this.keyToListDimensionsMap.get(key);
  }

  getRenderState() {
    return this._renderState;
  }

  setDimension(key: string, dimension: ListDimensions | Dimension) {
    return this.keyToListDimensionsMap.set(key, dimension);
  }

  deleteDimension(key: string) {
    return this.keyToListDimensionsMap.delete(key);
  }

  get dimensionsIndexRange() {
    return this._dimensionsIndexRange;
  }

  createIntervalTree() {
    const options = {} as {
      onUpdateItemLayout?: Function;
      onUpdateIntervalTree?: Function;
    };
    if (typeof this._onUpdateItemLayout === 'function')
      options.onUpdateItemLayout = this._onUpdateItemLayout;
    if (typeof this._onUpdateIntervalTree === 'function')
      options.onUpdateIntervalTree = this._onUpdateIntervalTree;
    return new PrefixIntervalTree(100, options);
  }

  getIntervalTree() {
    return this._dimensionsIntervalTree;
  }

  resetIntervalTree() {
    this._dimensionsIntervalTree = this.createIntervalTree();
    return this._dimensionsIntervalTree;
  }

  getTotalLength() {
    return this._dimensionsIntervalTree.getHeap()[1];
  }

  getDataLength() {
    let len = 0;
    for (let index = 0; index < this.indexKeys.length; index++) {
      const key = this.indexKeys[index];
      const dimensions = this.getDimension(key);
      len += dimensions.length;
    }
    return len;
  }

  getFinalIndexItemMeta(index: number) {
    const info = this.getFinalIndexInfo(index);
    if (info) {
      const dimension = info.dimensions;
      return dimension.getIndexItemMeta(info.index);
    }
    return null;
  }

  getFinalItemKey(item: any) {
    const len = this.indexKeys.length;
    for (let index = 0; index < len; index++) {
      const key = this.indexKeys[index];
      const dimension = this.getDimension(key);
      const itemKey = dimension.getFinalItemKey(item);
      if (itemKey) return itemKey;
    }
    return null;
  }

  getFinalItemMeta(item: any) {
    const len = this.indexKeys.length;
    for (let index = 0; index < len; index++) {
      const key = this.indexKeys[index];
      const dimension = this.getDimension(key);
      const itemMeta = dimension.getFinalItemMeta(item);
      if (itemMeta) return itemMeta;
    }
    return null;
  }

  getFinalIndexKeyOffset(index: number, exclusive?: boolean) {
    const listOffset = exclusive ? 0 : this.getContainerOffset();

    if (typeof index === 'number') {
      const indexInfo = this.getFinalIndexInfo(index);
      if (indexInfo) {
        const { dimensions, index: _index } = indexInfo;
        // _offsetInListGroup should be included. so exclusive should be false on default.
        return listOffset + dimensions.getIndexKeyOffset(_index);
      }
    }
    return 0;
  }

  getFinalIndexRangeOffsetMap(
    startIndex: number,
    endIndex: number,
    exclusive?: boolean
  ) {
    const indexToOffsetMap = {};
    let startOffset = this.getFinalIndexKeyOffset(startIndex, exclusive);
    for (let index = startIndex; index <= endIndex; index++) {
      indexToOffsetMap[index] = startOffset;
      const itemMeta = this.getFinalIndexItemMeta(index);
      if (itemMeta) {
        // @ts-ignore
        startOffset +=
          (itemMeta?.getLayout()?.height || 0) +
          (itemMeta?.getSeparatorLength() || 0);
      }
    }
    return indexToOffsetMap;
  }

  getFinalIndexItemLength(index: number) {
    const itemMeta = this.getFinalIndexItemMeta(index);
    if (itemMeta) return itemMeta.getItemLength();
    return 0;
  }

  getReflowItemsLength() {
    return this._reflowItemsLength;
  }

  hasUnLayoutItems() {
    const len = this.indexKeys.length;
    for (let index = 0; index < len; index++) {
      const key = this.indexKeys[index];
      const dimensions = this.getDimension(key);
      if (dimensions && dimensions?.hasUnLayoutItems()) {
        return true;
      }
    }

    return false;
  }

  calculateReflowItemsLength() {
    this._reflowItemsLength = this.indexKeys.reduce((acc, cur) => {
      const dimensions = this.getDimension(cur);
      if (dimensions) {
        return acc + dimensions.getReflowItemsLength();
      }
      return acc;
    }, 0);
    const dataLength = this.getDataLength();
    if (this._reflowItemsLength === dataLength) {
      this.notifyRenderFinished();
    }
  }

  getConfigTuple() {
    return this._configTuples;
  }

  resolveConfigTuplesDefaultState(defaultValue?: boolean) {
    return this._configTuples.getDefaultState(defaultValue);
  }

  notifyRenderFinished() {
    this._renderStateListeners.forEach((listener) => listener());
    this._renderStateListeners = [];
  }

  getState() {
    return this._listBaseDimension.state;
  }

  getStateResult() {
    return this._listBaseDimension.stateResult;
  }

  getKeyIndex(key: string, listKey: string) {
    const listIndex = this.indexKeys.findIndex(
      (indexKey) => indexKey === listKey
    );

    if (listIndex !== -1) {
      const listDimensions = this.getDimension(listKey);
      if (listDimensions) {
        return listDimensions instanceof ListDimensions
          ? listDimensions.getKeyIndex(key)
          : 0;
      }
    }

    return -1;
  }

  getIndexKey(index: number, listKey: string) {
    const listIndex = this.indexKeys.findIndex(
      (indexKey) => indexKey === listKey
    );

    if (listIndex !== -1) {
      const dimensions = this.getDimension(listKey);
      if (dimensions instanceof ListDimensions)
        return dimensions.getIndexKey(index);
      else if (dimensions instanceof Dimension) return dimensions.getKey();
    }

    return null;
  }

  getFinalIndexInfo(idx: number) {
    const len = this._dimensionsIndexRange.length;
    for (let index = 0; index < len; index++) {
      const info = this._dimensionsIndexRange[index];
      const { startIndex, endIndex, dimensions } = info;

      if (startIndex <= idx && idx < endIndex)
        return {
          dimensions,
          index: idx - startIndex,
        };
    }

    return null;
  }

  /**
   *
   * @param key: string, itemKey
   * @param listKey: string, the container key
   * @returns number,
   *
   * TODO: basic item may have error???
   */
  getFinalIndex(key: string, listKey: string) {
    let indexInList = 0;
    const dimensions = this.getDimension(listKey);
    if (!dimensions) return -1;
    if (dimensions instanceof ListDimensions) {
      indexInList = dimensions.getKeyIndex(key);
      if (indexInList === -1) return -1;
    } else if (dimensions instanceof Dimension) {
      indexInList = 0;
    }

    const dimensionsStartIndex = this.getDimensionStartIndex(listKey);

    if (dimensionsStartIndex !== -1) return dimensionsStartIndex + indexInList;
    return -1;
  }

  /**
   *
   * @param listKey dimension key; It could be list key or singleton item key
   * @param ignoreDimension ignore singleton item key
   * @returns
   */
  getDimensionStartIndex(listKey: string, ignoreDimension = false) {
    const listKeyIndex = this.indexKeys.findIndex((key) => key === listKey);
    if (!listKeyIndex) return 0;

    if (listKeyIndex !== -1) {
      const prevIndex = listKeyIndex - 1;
      const nextListKey = this.indexKeys[prevIndex];
      const _dimensions = this.getDimension(nextListKey);
      const info = this._dimensionsIndexRange.find(
        ({ dimensions }) => dimensions === _dimensions
      );
      if (info) {
        let startIndex = info.endIndex;

        if (ignoreDimension) {
          for (let i = 0; i < info.endIndex + 1; i++) {
            const listKey = this.indexKeys[i];
            const dimension = this.getDimension(listKey);
            if (
              dimension instanceof Dimension &&
              dimension.getIgnoredToPerBatch()
            )
              startIndex -= 1;
          }
        }

        return startIndex;
      }
    }

    return -1;
  }

  pushIndexKey(listKey: string) {
    this.indexKeys.push(listKey);
  }

  getListIndex(listKey: string) {
    return this.indexKeys.findIndex((indexKey) => indexKey === listKey);
  }

  removeListDimensions(listKey: string) {
    const index = this.indexKeys.findIndex((indexKey) => indexKey === listKey);
    if (index !== -1) {
      const dimension = this.getDimension(listKey);

      dimension.getData().forEach(item => {
        const index = this._flattenData.findIndex(v => v === item)
        if (index !== -1) this._flattenData.splice(index, 1)
      })

      this.indexKeys.splice(index, 1);
      this._dimensionsIntervalTree.remove(index);
      this.deleteDimension(listKey);
      this.onItemsCountChanged();
    }
  }

  /**
   *
   * @param listKey add a list listener
   * @param listDimensionsProps to initialize ListDimensions instance
   * @returns listener remover
   */
  registerList(
    listKey: string,
    listDimensionsProps: Omit<ListDimensionsProps<ItemT>, 'id'>
  ): {
    dimensions: ListDimensions;
    remover: () => void;
  } {
    if (this.getDimension(listKey))
      return {
        dimensions: this.getDimension(listKey) as ListDimensions,
        remover: () => {
          this.removeListDimensions(listKey);
        },
      };
    // should update indexKeys first !!!
    this.pushIndexKey(listKey);
    const dimensions = new ListDimensions({
      ...listDimensionsProps,
      id: listKey,
      parentItemsDimensions: this._itemsDimensions,
      listGroupDimension: this,
      horizontal: this.getHorizontal(),
    });
    this.setDimension(listKey, dimensions);
    this.onItemsCountChanged();
    // because Dimensions should be create first, so after initialized
    // update dimensionsIntervalTree (to fix Dimensions with default layout
    // such getItemLayout)
    this.recalculateDimensionsIntervalTreeBatchinator.schedule();
    this.registeredKeys.push(listKey);
    this.updateFlattenData(listKey, listDimensionsProps.data);

    this._startInspectBatchinator.schedule();

    return {
      dimensions,
      remover: () => {
        this.removeListDimensions(listKey);
      },
    };
  }

  /**
   * should be run immediately...
   *
   * To cache dimension index range, startIndex included, endIndex exclusive.
   * just like [].slice(startIndex, endIndex)
   */
  calculateDimensionsIndexRange() {
    let startIndex = 0;
    this._dimensionsIndexRange = this.indexKeys.reduce((acc, key) => {
      const dimensions = this.getDimension(key);
      if (dimensions instanceof Dimension) {
        const endIndex = startIndex + dimensions.length;
        acc.push({
          startIndex,
          endIndex,
          dimensions,
        });
        startIndex = endIndex;
      } else if (dimensions instanceof ListDimensions) {
        const endIndex = startIndex + dimensions.length;
        acc.push({
          startIndex,
          endIndex,
          dimensions,
        });
        startIndex = endIndex;
      }
      return acc;
    }, []);
  }

  onItemsCountChanged(useCache = false) {
    this.calculateDimensionsIndexRange();
    this.calculateReflowItemsLength();
    this.updateChildDimensionsOffsetInContainer();
    this.updateScrollMetrics(this._scrollMetrics, { useCache });
    // this._updateChildPersistanceIndicesBatchinator.schedule();
  }

  updateChildPersistanceIndices() {
    this.indexKeys.forEach((key) => {
      const dimension = this.getDimension(key);
      if (dimension instanceof ListDimensions) {
        dimension?.updatePersistanceIndicesDueToListGroup();
      }
    });
  }

  /**
   * 当item layout发生变化以后，这个时候要将子 dimension的相对高度重新计算一下
   */
  updateChildDimensionsOffsetInContainer() {
    let len = 0;
    this.indexKeys.forEach((key) => {
      const dimension = this.getDimension(key);
      if (dimension) {
        dimension.offsetInListGroup = len;
        const total = dimension.getTotalLength();
        if (typeof total === 'number') len += total;
      }
    });
  }

  recalculateDimensionsIntervalTree() {
    this.indexKeys.forEach((key, index) => {
      const dimensions = this.getDimension(key);
      if (dimensions) {
        const len = dimensions.getTotalLength();
        if (typeof len === 'number')
          this._dimensionsIntervalTree.set(index, len);
      }
    });

    this.updateChildDimensionsOffsetInContainer();
    this.calculateReflowItemsLength();
  }

  removeItem(key: string) {
    const index = this.indexKeys.findIndex((indexKey) => indexKey === key);
    if (index !== -1) {
      const dimension = this.getDimension(key);

      dimension.getData().forEach(item => {
        const index = this._flattenData.findIndex(v => v === item)
        if (index !== -1) this._flattenData.splice(index, 1)
      })

      this.indexKeys.splice(index, 1);
      this._dimensionsIntervalTree.remove(index);
      this.deleteDimension(key);
      this.onItemsCountChanged();
    }
  }

  heartBeatResolveChanged() {
    const nextIndexKeys = this._heartBeatingIndexKeys.slice();

    // 比如说，中间发生了顺序调整；自动检测确保
    if (
      !this.registeredKeys.length &&
      resolveChanged(this._heartBeatingIndexKeys, this.indexKeys).isEqual
    ) {
      if (
        !shallowArrayEqual(
          this._heartBeatingIndexKeys,
          this._heartBeatingIndexKeysSentCommit
        )
      ) {
        this.indexKeys = nextIndexKeys;
        this.onItemsCountChanged();
        this._heartBeatingIndexKeysSentCommit = this.indexKeys;
      }

      this._inspectingTime += 1;
    }
  }

  // register first，then inspecting
  heartBeat(props: { listKey: string; inspectingTime: number }) {
    const { listKey, inspectingTime } = props;

    if (inspectingTime < this._inspectingTime) return;

    this._heartBeatingIndexKeys.push(listKey);

    const indexInRegisteredKeys = this.registeredKeys.findIndex(
      (key) => key === listKey
    );

    if (indexInRegisteredKeys !== -1) {
      this.registeredKeys.splice(indexInRegisteredKeys, 1);
    }

    this._heartBeatResolveChangedBatchinator.schedule();
  }

  getInspectAPI(): InspectingAPI {
    return {
      inspectingTimes: this._inspectingTimes,
      inspectingTime: this._inspectingTime,
      heartBeat: this.heartBeat,
      startInspection: this.startInspection,
    };
  }

  startInspection() {
    this._heartBeatResolveChangedBatchinator.dispose({
      abort: true,
    });

    const time = +Date.now();

    if (typeof this._inspectingListener === 'function') {
      this._inspectingTimes += 1;
      this._heartBeatingIndexKeys = [];
      this._inspectingListener.call(this, {
        inspectingTimes: this._inspectingTimes,
        inspectingTime: time,
        heartBeat: this.heartBeat,
        startInspection: this.startInspection,
      });
    }
  }

  addStartInspectingHandler(cb: InspectingListener) {
    if (typeof cb === 'function') this._inspectingListener = cb;
  }

  registerItem(
    key: string,
    ignoredToPerBatch?: boolean,
    onRender?: Function
  ): {
    dimensions: Dimension;
    remover: () => void;
  } {
    if (this.getDimension(key))
      return {
        dimensions: this.getDimension(key) as Dimension,
        remover: () => {
          this.removeItem(key);
        },
      };
    const len = this.indexKeys.length;
    const beforeKey = len ? this.indexKeys[len - 1] : '';
    this.pushIndexKey(key);
    const startIndex = beforeKey
      ? this.getDimensionStartIndex(beforeKey) +
        this.getDimension(beforeKey).length
      : 0;

    const dimensions = new Dimension({
      id: key,
      onRender,
      listGroupDimension: this,
      horizontal: this.getHorizontal(),
      initialStartIndex: startIndex,
      ignoredToPerBatch,
      canIUseRIC: this.canIUseRIC,
    });
    this.setDimension(key, dimensions);

    this.onItemsCountChanged();
    this.recalculateDimensionsIntervalTreeBatchinator.schedule();
    this.registeredKeys.push(key);
    this.updateFlattenData(key, dimensions.getData());
    this._startInspectBatchinator.schedule();
    return {
      dimensions,
      remover: () => {
        this.removeItem(key);
      },
    };
  }

  getData() {
    return this._flattenData;
  }



  /**
   *
   * @param listKey dimension key.
   * @param data list data or a dimension...
   */
  updateFlattenData(listKey: string, data: any) {
    const _dimensions = this.getDimension(listKey);
    const info = this._dimensionsIndexRange.find(
      ({ dimensions }) => dimensions === _dimensions
    );
    if (info) {
      const { startIndex, endIndex } = info;
      const before = this._flattenData.slice(0, startIndex);
      const after = this._flattenData.slice(endIndex);
      this._flattenData = [].concat(before, data, after);
      if (data.length !== endIndex - startIndex) {
        // the flattenData
        this.calculateDimensionsIndexRange();
      }

      // this._listBaseDimension.setData(this.getData());
    }
  }

  getItemKey() {}

  getKeyItem() {}

  getItemDimension() {}

  getKeyDimension() {}

  setListData(listKey: string, data: Array<any>) {
    const listDimensions = this.getDimension(listKey);
    this.updateFlattenData(listKey, data);

    if (listDimensions) {
      const changedType = (listDimensions as ListDimensions).setData(data);
    }

  }

  setOnEndReached(listKey: string, onEndReached: OnEndReached) {
    const listDimensions = this.getDimension(listKey);
    if (listDimensions) {
      (listDimensions as ListDimensions).setOnEndReached(onEndReached);
    }
  }

  getListData(listKey: string) {
    const listDimensions = this.getDimension(listKey);
    if (listDimensions) return (listDimensions as ListDimensions).getData();
    return [];
  }

  getItemKeyDimension(itemKey: string) {
    const len = this.indexKeys.length;
    for (let index = 0; index < len; index++) {
      const key = this.indexKeys[index];
      const dimension = this.getDimension(key);
      // @ts-ignore
      if (dimension.hasKey(itemKey)) {
        return dimension
      }
    }
    return null
  }

  getFinalKeyItemOffset(itemKey: string, exclusive?: boolean) {
    const dimension = this.getItemKeyDimension(itemKey)
    if (dimension) {
      const containerOffset = exclusive ? 0 : this.getContainerOffset();
      return (
        (dimension as ListDimensions).getKeyItemOffset(itemKey) +
        containerOffset
      );
    }
    return 0
  }

  getKeyItemOffset(key: string, listKey: string, exclusive?: boolean) {
    const containerOffset = exclusive ? 0 : this.getContainerOffset();
    const listDimensions = this.getDimension(listKey);
    if (listDimensions) {
      return (
        (listDimensions as ListDimensions).getKeyItemOffset(key) +
        containerOffset
      );
    }
    return null;
  }

  getFinalKeyMeta(itemKey: string) {
    const dimension = this.getItemKeyDimension(itemKey)
    if (dimension instanceof ListDimensions) return dimension.getKeyMeta(itemKey);
    else if (dimension instanceof Dimension) return dimension.getMeta();
    return null;
  }

  getKeyMeta(key: string, listKey: string) {
    const dimensions = this.getDimension(listKey);
    if (dimensions instanceof ListDimensions) return dimensions.getKeyMeta(key);
    else if (dimensions instanceof Dimension) return dimensions.getMeta();
    return null;
  }

  setFinalKeyMeta(itemKey: string, itemMeta: ItemMeta) {
    const dimensions = this.getItemKeyDimension(itemKey);
    if (dimensions instanceof ListDimensions)
      return dimensions.setKeyMeta(itemKey, itemMeta);
    else if (dimensions instanceof Dimension)
      return dimensions.setMeta(itemMeta);
    return null;
  }

  setKeyMeta(key: string, listKey: string, itemMeta: ItemMeta) {
    const dimensions = this.getDimension(listKey);
    if (dimensions instanceof ListDimensions)
      return dimensions.setKeyMeta(key, itemMeta);
    else if (dimensions instanceof Dimension)
      return dimensions.setMeta(itemMeta);
    return null;
  }

  ensureKeyMeta(key: string, listKey: string) {
    const dimensions = this.getDimension(listKey);
    if (dimensions instanceof ListDimensions)
      return dimensions.ensureKeyMeta(key);
    else if (dimensions instanceof Dimension) return dimensions.ensureKeyMeta();
    return null;
  }

  getKeyItemLayout(key: string, listKey: string) {
    const listDimensions = this.getDimension(listKey);
    if (listDimensions) {
      return (listDimensions as ListDimensions).getKeyItemLayout(key);
    }

    return null
  }

  getFinalKeyItemLayout(itemKey: string) {
    const dimensions = this.getItemKeyDimension(itemKey);
    if (dimensions) {
      return (dimensions as ListDimensions).getKeyItemLayout(itemKey);
    }
    return null
  }

  getIndexItemLayout(index: number, listKey: string) {
    const key = this.getIndexKey(index, listKey);
    return this.getKeyItemLayout(key, listKey);
  }

  setIndexItemLayout(index: number, listKey: string, layout: ItemLayout) {
    const key = this.getIndexKey(index, listKey);
    this.setKeyItemLayout(key, listKey, layout);
  }

  setFinalKeyItemLayout(itemKey: string, layout: ItemLayout | number) {
    const dimensions = this.getItemKeyDimension(itemKey);
    if (dimensions) {
      if (dimensions instanceof ListDimensions) {
          dimensions.setKeyItemLayout(itemKey, layout);
        } else if (dimensions instanceof Dimension) {
          dimensions.setItemLayout(layout);
        }
    }
  }

  setKeyItemLayout(key: string, listKey: string, layout: ItemLayout | number) {
    const dimensions = this.getDimension(listKey);
    if (dimensions) {
      if (dimensions instanceof ListDimensions) {
        dimensions.setKeyItemLayout(key, layout);
      } else if (dimensions instanceof Dimension) {
        dimensions.setItemLayout(layout);
      }
    }
  }

  static createPositionToken() {
    return {
      dimensionKey: '',
      index: null,
    };
  }

  findPosition(finalIndex: number) {
    const len = this.indexKeys.length;
    let startIndex = 0;
    const positionToken = ListGroupDimensions.createPositionToken();

    for (let index = 0; index < len; index++) {
      const key = this.indexKeys[index];

      const dimension = this.getDimension(key);
      const min = startIndex;
      const max =
        startIndex +
        (dimension instanceof Dimension
          ? 0
          : Math.max((dimension as ListDimensions).length - 1, 0));

      if (isClamped(min, finalIndex, max)) {
        positionToken.dimensionKey = key;
        positionToken.index = finalIndex - startIndex;

        return positionToken;
      }
      startIndex = max + 1;
    }

    return -1;
  }

  /**
   *
   * @param finalStartIndex
   * @param finalEndIndex
   * @returns
   */
  findListRange(finalStartIndex: number, finalEndIndex: number) {
    const startPosition = this.findPosition(finalStartIndex);
    const endPosition = this.findPosition(finalEndIndex);

    if (startPosition === -1 || endPosition === -1) return [];

    const startDimensionIndex = this.indexKeys.findIndex(
      (key) => key === startPosition.dimensionKey
    );
    const endDimensionIndex = this.indexKeys.findIndex(
      (key) => key === endPosition.dimensionKey
    );
    const result = [];

    for (let index = startDimensionIndex; index <= endDimensionIndex; index++) {
      const currentValues = [];
      const range = {
        startIndex: -1,
        endIndex: -1,
      };
      const dimensionKey = this.indexKeys[index];
      const dimension = this.getDimension(dimensionKey);

      if (dimension instanceof Dimension) {
        currentValues.push(dimension.getMeta());
        range.startIndex = 0;
        range.endIndex = 0;
        result.push({
          listKey: dimensionKey,
          isDimension: true,
        });
        continue;
      }

      const len = dimension.length;

      // the same list
      if (startDimensionIndex === endDimensionIndex) {
        range.startIndex = startPosition.index;
        range.endIndex = endPosition.index;
      } else if (index === startDimensionIndex) {
        // the begin
        const { index: startIndex } = startPosition;
        range.startIndex = startIndex;
        range.endIndex = len - 1;
      } else if (index === endDimensionIndex) {
        // the tail
        const { index: endIndex } = endPosition;
        range.startIndex = 0;
        range.endIndex = endIndex;
      } else {
        // middle
        range.startIndex = 0;
        range.endIndex = len - 1;
      }

      for (let idx = range.startIndex; idx < range.endIndex + 1; idx++) {
        const meta = dimension.getIndexItemMeta(idx);
        if (meta) currentValues.push(meta);
      }

      result.push({
        listKey: dimensionKey,
        isDimension: false,
        value: {
          ...range,
          data: this.getListData(dimensionKey).slice(0, range.endIndex + 1),
        },
      });
    }

    return result;
  }

  /**
   *
   * @param minOffset
   * @param maxOffset
   * @returns
   *
   * used in state reducer.
   */
  computeIndexRange(minOffset: number, maxOffset: number) {
    const dimensionResult = this._dimensionsIntervalTree.computeRange(
      minOffset,
      maxOffset
    );

    const { startIndex, endIndex } = dimensionResult;

    if (startIndex === endIndex) {
      const dimensionKey = this.indexKeys[startIndex];
      const dimensionsStartIndex = this.getDimensionStartIndex(dimensionKey);

      const dimensions = this.getDimension(dimensionKey);
      if (dimensions instanceof Dimension) {
        return {
          startIndex: dimensionsStartIndex,
          endIndex: dimensionsStartIndex,
        };
      } else if (dimensions instanceof ListDimensions) {
        const startOffset = this._dimensionsIntervalTree.sumUntil(startIndex);
        const { startIndex: innerStartIndex, endIndex: innerEndIndex } =
          dimensions.computeIndexRange(
            minOffset - startOffset,
            maxOffset - startOffset
          );

        return {
          startIndex: dimensionsStartIndex + innerStartIndex,
          endIndex: dimensionsStartIndex + innerEndIndex,
        };
      }
      return {
        startIndex: -1,
        endIndex: -1,
      };
    }

    const _nextStartIndex = Math.max(0, startIndex);
    const startDimensionsKey = this.indexKeys[_nextStartIndex];
    const startDimensions = this.getDimension(startDimensionsKey);

    let nextStartIndex = startIndex;

    if (startDimensions instanceof Dimension) {
      nextStartIndex = this.getDimensionStartIndex(startDimensionsKey);
    } else if (startDimensions instanceof ListDimensions) {
      const startOffset =
        this._dimensionsIntervalTree.sumUntil(_nextStartIndex);
      const dimensionsStartIndex =
        this.getDimensionStartIndex(startDimensionsKey);

      const index = startDimensions.intervalTree.greatestStrictLowerBound(
        minOffset - startOffset
      );
      nextStartIndex = dimensionsStartIndex + index;
    }

    const _nextEndIndex = Math.max(0, endIndex);
    const endDimensionsKey = this.indexKeys[_nextEndIndex];
    const endDimensions = this.getDimension(endDimensionsKey);

    let nextEndIndex = startIndex;

    if (endDimensions instanceof Dimension) {
      nextEndIndex = this.getDimensionStartIndex(endDimensionsKey);
    } else if (endDimensions instanceof ListDimensions) {
      const startOffset = this._dimensionsIntervalTree.sumUntil(_nextEndIndex);
      const dimensionsStartIndex =
        this.getDimensionStartIndex(endDimensionsKey);
      const index = endDimensions.intervalTree.greatestStrictLowerBound(
        maxOffset - startOffset
      );
      nextEndIndex = dimensionsStartIndex + index;
    }

    return {
      startIndex: nextStartIndex,
      endIndex: nextEndIndex,
    };
  }

  computeIndexRangeMeta(props: {
    startIndex: number;
    endIndex: number;
  }): ListRangeResult {
    const { startIndex, endIndex } = props;
    return this.findListRange(startIndex, endIndex);
  }

  addStateListener(listener: StateListener) {
    return this._listBaseDimension.addStateListener(listener);
  }

  dispatchMetrics(scrollMetrics: ScrollMetrics) {
    const state = this._store.dispatchMetrics({
      dimension: this,
      scrollMetrics,
    });

    if (isEmpty(state)) return;
    if (this.fillingMode === FillingMode.RECYCLE) {
      this._listBaseDimension.setState({
        ...state,
        data: this.getData(),
      });
      return;
    }

    // const bufferedMetaRanges = this.computeIndexRangeMeta({
    //   startIndex: state.bufferedStartIndex,
    //   endIndex: state.bufferedEndIndex,
    // });
    // const visibleMetaRanges = this.computeIndexRangeMeta({
    //   startIndex: state.visibleStartIndex,
    //   endIndex: state.visibleEndIndex,
    // });

    // const { removed } = resolveChanged(
    //   this._rangeResult?.bufferedMetaRanges || [],
    //   bufferedMetaRanges,
    //   (a, b) => a.listKey === b.listKey
    // );
    // const groupListItemsMeta = [];

    // // trigger ListDimensions viewable config
    // bufferedMetaRanges.forEach((range) => {
    //   const { listKey, value } = range;
    //   const dimension = this.getDimension(listKey);

    //   const visibleMetaRange = visibleMetaRanges.find(
    //     (v) => v.listKey === listKey
    //   );

    //   if (dimension instanceof ListDimensions) {
    //     dimension.updateState(
    //       {
    //         ...state,
    //         visibleStartIndex: visibleMetaRange
    //           ? visibleMetaRange.value.startIndex
    //           : -1,
    //         visibleEndIndex: visibleMetaRange
    //           ? visibleMetaRange.value.endIndex
    //           : -1,
    //         // visibleEndIndex: value.endIndex,
    //         // visibleStartIndex: value.startIndex,
    //         bufferedEndIndex: value.endIndex,
    //         bufferedStartIndex: value.startIndex,
    //       },
    //       scrollMetrics
    //     );
    //   } else {
    //     dimension.render();
    //     if (dimension.getMeta().getLayout()) {
    //       groupListItemsMeta.push(dimension.getMeta());
    //     }
    //   }
    // });

    // // trigger Dimensions viewable config
    // this._onUpdateDimensionItemsMetaChangeBatchinator.schedule(
    //   groupListItemsMeta,
    //   scrollMetrics
    // );

    // removed.forEach((range) => {
    //   const { listKey } = range;
    //   const dimension = this.getDimension(listKey);
    //   if (dimension instanceof ListDimensions) {
    //     dimension.updateState(
    //       {
    //         ...state,
    //         visibleStartIndex: -1,
    //         visibleEndIndex: -1,
    //         bufferedEndIndex: dimension.length - 1,
    //         // should be Infinity or bigger than bufferedEndIndex to make
    //         // item release possible.
    //         bufferedStartIndex: Infinity,
    //       },
    //       scrollMetrics
    //     );
    //   }
    // });

    // this._rangeResult = {
    //   bufferedMetaRanges,
    //   visibleMetaRanges,
    // };
    // this._dispatchedMetricsResult = state;
    // this._itemsDimensions.dispatchMetrics(scrollMetrics);
  }

  onUpdateDimensionItemsMetaChange(
    itemsMeta: Array<ItemMeta>,
    scrollMetrics: ScrollMetrics
  ) {
    this._configTuples.getViewabilityHelpers().forEach((helper) => {
      helper.onUpdateItemsMeta(itemsMeta, scrollMetrics);
    });
  }

  updateScrollMetricsWithCache(
    scrollMetrics: ScrollMetrics = this._scrollMetrics
  ) {
    // 之所以这么处理，是因为有可能数据的item值发生了变化，这个时候要重新刷一下
    // 嵌套的子item。
    const { bufferedMetaRanges, visibleMetaRanges } = this._rangeResult;
    bufferedMetaRanges.forEach((range) => {
      const { listKey, value } = range;
      const dimension = this.getDimension(listKey);

      const visibleMetaRange = visibleMetaRanges.find(
        (v) => v.listKey === listKey
      );

      if (dimension instanceof ListDimensions) {
        if (visibleMetaRange) {
          dimension.updateState(
            {
              ...this._dispatchedMetricsResult,
              visibleStartIndex: visibleMetaRange
                ? visibleMetaRange.value.startIndex
                : -1,
              visibleEndIndex: visibleMetaRange
                ? visibleMetaRange.value.endIndex
                : -1,
              bufferedEndIndex: value.endIndex,
              bufferedStartIndex: value.startIndex,
            },
            scrollMetrics
          );
        } else {
          dimension.updateStateBatchinator.schedule(
            {
              ...this._dispatchedMetricsResult,
              visibleStartIndex: -1,
              visibleEndIndex: -1,
              bufferedEndIndex: value.endIndex,
              bufferedStartIndex: value.startIndex,
            },
            scrollMetrics
          );
        }
      }
    });
  }

  dispatchScrollMetricsEnabled() {
    return (
      this.selector.getDispatchScrollMetricsEnabledStatus() &&
      ListSpyUtils.selector.getDispatchScrollMetricsEnabledStatus()
    );
  }

  updateScrollMetrics(
    _scrollMetrics?: ScrollMetrics,
    _options?: {
      useCache?: boolean;
      flush?: boolean;
    }
  ) {
    const scrollMetrics = _scrollMetrics || this._scrollMetrics;
    const useCache = defaultBooleanValue(_options?.useCache, true);
    const flush = defaultBooleanValue(_options?.flush, false);

    if (!scrollMetrics) return;
    if (!this.dispatchScrollMetricsEnabled()) {
      this._scrollMetrics = scrollMetrics;
      return;
    }
    if (
      !useCache ||
      // 刚开始时，this._scrollMetrics是不存在的
      !this._scrollMetrics ||
      scrollMetrics.contentLength !== this._scrollMetrics.contentLength ||
      scrollMetrics.offset !== this._scrollMetrics.offset ||
      scrollMetrics.visibleLength !== this._scrollMetrics.visibleLength
    ) {
      this._scrollMetrics = scrollMetrics;
      if (flush) {
        this._dispatchMetricsBatchinator.flush(scrollMetrics);
      } else {
        this._dispatchMetricsBatchinator.schedule(scrollMetrics);
      }
    } else if (this._rangeResult && this._dispatchedMetricsResult) {
      this._scrollMetrics = scrollMetrics;
      // 缓存的优先级，永远不如不使用缓存的；比如前面的list data发生了变化，
      // 但是后续的list并没有发生变化，这个时候要自行自定义的
      if (!this._dispatchMetricsBatchinator.inSchedule()) {
        if (flush) {
          this._updateScrollMetricsWithCacheBatchinator.flush(scrollMetrics);
        } else {
          this._updateScrollMetricsWithCacheBatchinator.schedule(scrollMetrics);
        }
      } else {
        // 刷新scrollMetrics的值
        if (flush) {
          this._dispatchMetricsBatchinator.flush(scrollMetrics);
        } else {
          this._dispatchMetricsBatchinator.schedule(scrollMetrics);
        }
      }
    }
  }

  addRenderStateListener(fn: Function) {
    if (typeof fn === 'function') {
      this._renderStateListeners.push(fn);

      return () => {
        const index = this._renderStateListeners.findIndex((s) => s === fn);
        if (index !== -1) this._renderStateListeners.splice(index, 1);
      };
    }

    return noop;
  }

  cleanRenderStateListeners() {
    this._renderStateListenersCleaner.forEach((cleaner) => cleaner());
  }
}

export default ListGroupDimensions;
