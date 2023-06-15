import noop from '@x-oasis/noop';
import Batchinator from '@x-oasis/batchinator';
import BaseDimensions from './BaseDimensions';
import ItemMeta from './ItemMeta';
import ItemsDimensions from './ItemsDimensions';
import ListGroupDimensions from './ListGroupDimensions';
import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';
import layoutEqual from '@x-oasis/layout-equal';
import omit from '@x-oasis/omit';
import {
  INVALID_LENGTH,
  isEmpty,
  shallowDiffers,
  buildStateTokenIndexKey,
  DISPATCH_METRICS_THRESHOLD,
} from './common';
import resolveChanged from '@x-oasis/resolve-changed';
import manager from './manager';
import createStore from './state/createStore';
import { ActionType, ReducerResult, Store } from './state/types';
import {
  SpaceStateToken,
  GetItemLayout,
  GetItemSeparatorLength,
  IndexInfo,
  ItemLayout,
  KeyExtractor,
  KeysChangedType,
  ListDimensionsProps,
  ListRenderState,
  ListState,
  OnEndReached,
  PreStateResult,
  ScrollMetrics,
  StateListener,
  ListStateResult,
  SpaceStateTokenPosition,
  FillingMode,
  RecycleStateResult,
  SpaceStateResult,
} from './types';
import ListSpyUtils from './utils/ListSpyUtils';
import OnEndReachedHelper from './viewable/OnEndReachedHelper';
import EnabledSelector from './utils/EnabledSelector';
import isClamped from '@x-oasis/is-clamped';
import IntegerBufferSet from '@x-oasis/integer-buffer-set';
import memoizeOne from 'memoize-one';
import shallowEqual from '@x-oasis/shallow-equal';
import shallowArrayEqual from '@x-oasis/shallow-array-equal';
import StillnessHelper from './utils/StillnessHelper';

class ListDimensions<ItemT extends {} = {}> extends BaseDimensions {
  private _data: Array<ItemT> = [];

  // to save data before list is active
  private _softData: Array<ItemT> = [];

  private _keyExtractor: KeyExtractor<ItemT>;
  private _getItemLayout: GetItemLayout<ItemT>;
  private _getItemSeparatorLength: GetItemSeparatorLength<ItemT>;

  private _itemToKeyMap: WeakMap<ItemT, string> = new WeakMap();
  private _stateListener: StateListener<ItemT>;

  private _state: ListState<ItemT>;
  private _stateResult: ListStateResult<ItemT>;

  private _listGroupDimension: ListGroupDimensions;
  private _parentItemsDimensions: ItemsDimensions;

  private _dispatchMetricsBatchinator: Batchinator;

  private _store: Store<ReducerResult>;

  readonly onEndReachedHelper: OnEndReachedHelper;

  private _scrollMetrics: ScrollMetrics;

  private _offsetInListGroup: number;

  private _isActive = true;

  private _renderState: ListRenderState;
  private _renderStateListeners: Array<Function> = [];
  private _renderStateListenersCleaner: Array<Function> = [];

  private _deps: Array<string>;

  private _removeList: Function;

  private _initializeMode = false;

  private _onBatchLayoutFinished: () => boolean;

  public updateStateBatchinator: Batchinator;

  private _recalculateRecycleResultStateBatchinator: Batchinator;

  private _selector = new EnabledSelector({
    onEnabled: this.onEnableDispatchScrollMetrics.bind(this),
  });

  private _bufferSet = new IntegerBufferSet();

  private _offsetTriggerCachedState = 0;

  private _stillnessHelper: StillnessHelper;

  private memoizedResolveSpaceState: (
    state: ListState<ItemT>
  ) => SpaceStateResult<ItemT>;
  private memoizedResolveRecycleState: (
    state: ListState<ItemT>
  ) => RecycleStateResult<ItemT>;

  // private _dataChangeTriggerOnEndReachedTimer: any;

  constructor(props: ListDimensionsProps<ItemT>) {
    super({
      ...props,
      isIntervalTreeItems: true,
    });
    const {
      store,
      data = [],
      deps = [],
      keyExtractor,
      getItemLayout,
      onEndReached,
      active = true,
      listGroupDimension,
      onEndReachedThreshold,
      parentItemsDimensions,
      getItemSeparatorLength,
      onBatchLayoutFinished,
      persistanceIndices,
      dispatchMetricsThreshold = DISPATCH_METRICS_THRESHOLD,

      stillnessThreshold,
      onEndReachedTimeoutThreshold,
      distanceFromEndThresholdValue,
      onEndReachedHandlerTimeoutThreshold,
      maxCountOfHandleOnEndReachedAfterStillness,
    } = props;
    this._keyExtractor = keyExtractor;
    this._getItemLayout = getItemLayout;
    this._getItemSeparatorLength = getItemSeparatorLength;
    // for ListItem include a basic items condition
    this._parentItemsDimensions = parentItemsDimensions;
    this._listGroupDimension = listGroupDimension;
    this._dispatchMetricsBatchinator = new Batchinator(
      this.dispatchMetrics.bind(this),
      dispatchMetricsThreshold
    );
    this.onEndReachedHelper = new OnEndReachedHelper({
      id: this.id,
      onEndReached,
      onEndReachedThreshold,
      onEndReachedTimeoutThreshold,
      distanceFromEndThresholdValue,
      onEndReachedHandlerTimeoutThreshold,
      maxCountOfHandleOnEndReachedAfterStillness,
    });
    this._onBatchLayoutFinished = onBatchLayoutFinished;

    this.stillnessHandler = this.stillnessHandler.bind(this);
    this._stillnessHelper = new StillnessHelper({
      stillnessThreshold,
      handler: this.stillnessHandler,
    });

    this._deps = deps;
    this._isActive = this.resolveInitialActiveValue(active);

    if (this._listGroupDimension && this.initialNumToRender) {
      if (process.env.NODE_ENV === 'development')
        console.warn(
          '[Spectrum warning] : As a `ListGroup` child list,  List Props ' +
            ' initialNumToRender value should be controlled' +
            'by `ListGroup` commander. So value is reset to `0`.'
        );
      this.initialNumToRender = 0;
    }

    if (this._listGroupDimension && persistanceIndices) {
      if (process.env.NODE_ENV === 'development')
        console.warn(
          '[Spectrum warning] : As a `ListGroup` child list,  List Props ' +
            ' persistanceIndices value should be controlled' +
            'by `ListGroup` commander. So value is reset to `[]`.'
        );
      this.persistanceIndices = [];
    }

    this.updateInitialNumDueToListGroup(data);
    this.updatePersistanceIndicesDueToListGroup(data);
    if (!this._isActive) {
      this._softData = data;
    } else {
      this._setData(data);
    }
    this._state = this.resolveInitialState();
    this.memoizedResolveSpaceState = memoizeOne(
      this.resolveSpaceState.bind(this)
    );
    this.memoizedResolveRecycleState = memoizeOne(
      this.resolveRecycleState.bind(this)
    );
    this._stateResult =
      this.fillingMode === FillingMode.RECYCLE
        ? this.memoizedResolveRecycleState(this._state)
        : this.memoizedResolveSpaceState(this._state);

    this._store = createStore<ReducerResult>() || store;

    this._offsetInListGroup = 0;

    this.attemptToHandleEndReached();
    this.handleDeps = this.handleDeps.bind(this);

    // 比如刚开始就有值，并且给了`getItemLayout`的话，需要手动更新Parent中的layout
    // this.hydrateParentIntervalTree();

    this._removeList = this._listGroupDimension ? noop : manager.addList(this);
    this.updateStateBatchinator = new Batchinator(
      this.updateState.bind(this),
      50
    );
    this._recalculateRecycleResultStateBatchinator = new Batchinator(
      this.recalculateRecycleResultState.bind(this),
      50
    );
  }

  get length() {
    return this._data.length;
  }

  get selector() {
    return this._selector;
  }

  get stateResult() {
    return this._stateResult;
  }

  set scrollMetrics(scrollMetrics: ScrollMetrics) {
    this._scrollMetrics = scrollMetrics;
  }

  set offsetInListGroup(offset: number) {
    this._offsetInListGroup = offset;
  }

  get state() {
    return this._state;
  }

  cleanup() {
    this._removeList?.();
    this._renderStateListeners = [];
  }

  resolveInitialActiveValue(active: boolean) {
    if (this._deps.length) {
      let isActive = true;
      for (let index = 0; index < this._deps.length; index++) {
        const listKey = this._deps[index];
        const listHandler = manager.getKeyList(listKey);
        if (!listHandler) continue;

        if (
          listHandler.getRenderState() !== ListRenderState.ON_RENDER_FINISHED
        ) {
          this._renderStateListenersCleaner.push(
            listHandler.addRenderStateListener(this.handleDeps.bind(this))
          );
          isActive = false;
        }
      }
      return isActive;
    }

    return active;
  }

  getRenderState() {
    return this._renderState;
  }

  setRenderState(state: ListRenderState) {
    this._renderState = state;
  }

  setRenderStateFinished() {
    return (this._renderState = ListRenderState.ON_RENDER_FINISHED);
  }

  setActive() {
    this._isActive = true;
  }

  resolveInitialState() {
    if (!this.initialNumToRender || !this._data.length || !this._isActive)
      return {
        visibleStartIndex: -1,
        visibleEndIndex: -1,
        bufferedStartIndex: -1,
        bufferedEndIndex: -1,
        isEndReached: false,
        distanceFromEnd: 0,
        data: [],
        actionType: ActionType.Initial,
      };

    if (this._state && this._state.bufferedEndIndex > 0) return this._state;

    const maxIndex = Math.min(this._data.length, this.initialNumToRender) - 1;
    return {
      visibleStartIndex: 0,
      visibleEndIndex: maxIndex,
      bufferedStartIndex: 0,
      bufferedEndIndex: maxIndex,
      isEndReached: false,
      distanceFromEnd: 0,
      data: this._data.slice(0, maxIndex + 1),
      actionType: ActionType.Initial,
    };
  }

  getOnEndReachedHelper() {
    return this.onEndReachedHelper;
  }

  getContainerOffset(): number {
    if (this._listGroupDimension) {
      return (
        this._listGroupDimension.getContainerOffset() + this._offsetInListGroup
      );
    }
    const layout = this.getContainerLayout();
    if (!layout) return 0;
    return this._selectValue.selectOffset(layout);
  }

  getData() {
    return this._data;
  }

  getTotalLength() {
    return this.intervalTree.getMaxUsefulLength()
      ? this.intervalTree.getHeap()[1]
      : INVALID_LENGTH;
  }

  getReflowItemsLength() {
    return this.intervalTree.getMaxUsefulLength();
  }

  getIndexItemMeta(index: number) {
    const item = this._data[index];
    return this.getItemMeta(item, index);
  }

  getKeyMeta(key: string) {
    let meta = this._getKeyMeta(key);
    if (!meta && this._parentItemsDimensions) {
      meta = this._parentItemsDimensions.getKeyMeta(key);
    }

    return meta;
  }

  getItemMeta(item: ItemT, index: number) {
    const key = this.getItemKey(item, index);
    if (key) return this.getKeyMeta(key);
    return null;
  }

  /**
   * Basically, List item meta should be created first or has some error condition
   * @param key ItemMeta key
   * @returns ItemMeta
   */
  ensureKeyMeta(key: string) {
    let meta = this.getKeyMeta(key);

    if (!meta && this._parentItemsDimensions) {
      meta = this._parentItemsDimensions.ensureKeyMeta(key);
    }

    if (meta) return meta;

    // TODO: separatorLength may be included!!!!
    meta = new ItemMeta({
      key,
      owner: this,
      isListItem: true,
      isInitialItem: false,
    });
    this.setKeyMeta(key, meta);

    return meta;
  }

  setItemMeta(item: ItemT, index: number, meta: ItemMeta) {
    const key = this.getItemKey(item, index);
    if (key) {
      this.setKeyMeta(key, meta);
    }
  }

  getItemKey(item: ItemT, index: number) {
    const cachedKey = this._itemToKeyMap.get(item);
    if (cachedKey) return cachedKey;
    if (!item) return null;
    return this._keyExtractor(item, index);
  }

  createIntervalTree() {
    return new PrefixIntervalTree(100);
  }

  resetIntervalTree() {
    this.replaceIntervalTree(this.createIntervalTree());
    return this.intervalTree;
  }

  hasUnLayoutItems() {
    return this.getReflowItemsLength() < this._data.length;
  }

  _recycleEnabled() {
    if (this.fillingMode !== FillingMode.RECYCLE) return false;
    return this.getReflowItemsLength() >= this.initialNumToRender;
  }

  recalculateRecycleResultState() {
    this.setState(this._state, true);
  }

  // 一旦当前的length 发生了变化，判断一下自己总的高度是否变化，如果
  // 变了，那么就去更新
  /**
   * In RN, layout change will not trigger `updateScrollMetrics`, because it's replaced with
   * onContentSizeChanged.
   */
  setIntervalTreeValue(index: number, length: number) {
    const oldLength = this.intervalTree.getHeap()[1];
    this.intervalTree.set(index, length);
    const nextLength = this.intervalTree.getHeap()[1];

    if (oldLength !== nextLength && this._listGroupDimension) {
      this._listGroupDimension.recalculateDimensionsIntervalTreeBatchinator.schedule();
    }

    if (
      this.getReflowItemsLength() === this._data.length &&
      this._renderStateListeners.length
    ) {
      if (typeof this._onBatchLayoutFinished === 'function') {
        const falsy = this._onBatchLayoutFinished();
        if (falsy) this.notifyRenderFinished();
      }
    }

    if (this._recycleEnabled()) {
      this._recalculateRecycleResultStateBatchinator.schedule();
    }
  }

  replaceIntervalTree(intervalTree: PrefixIntervalTree) {
    const oldLength = this.intervalTree.getHeap()[1];
    this.intervalTree = intervalTree;
    const nextLength = intervalTree.getHeap()[1];

    if (oldLength !== nextLength && this._listGroupDimension) {
      this._listGroupDimension.recalculateDimensionsIntervalTreeBatchinator.schedule();
    }
  }

  notifyRenderFinished() {
    this.setRenderStateFinished();
    this._renderStateListeners.forEach((listener) => listener());
  }

  createItemMeta(key: string, data: Array<ItemT>, index: number) {
    const isInitialItem = this._initializeMode
      ? index < this.initialNumToRender
      : false;

    const meta = new ItemMeta({
      key,
      owner: this,
      isListItem: true,
      isInitialItem,
    });

    if (typeof this._getItemLayout === 'function') {
      const { length } = this._getItemLayout(data, index);
      // only List with getItemLayout has default layout value
      meta.setLayout({ x: 0, y: 0, height: 0, width: 0 });
      this._selectValue.setLength(meta.getLayout(), length);
    }

    if (typeof this._getItemSeparatorLength === 'function') {
      const { length } = this._getItemSeparatorLength(data, index);
      meta.setSeparatorLength(length);
    }

    return meta;
  }

  performKeyOperationGuard(key: string) {
    if (this._indexKeys.indexOf(key) !== -1) return true;
    return false;
  }

  addRenderStateListener(fn: Function) {
    if (typeof fn === 'function') {
      const index = this._renderStateListeners.findIndex((s) => s === fn);
      if (index === -1) this._renderStateListeners.push(fn);

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

  handleDeps() {
    for (let index = 0; index < this._deps.length; index++) {
      const listKey = this._deps[index];
      const dep = this._deps[index];
      const listHandler = manager.getKeyList(listKey);
      if (!listHandler) continue;

      if (listHandler.getRenderState() === ListRenderState.ON_RENDER_FINISHED) {
        const index = this._deps.findIndex((d) => d === dep);
        if (index !== -1) this._deps.splice(index, 1);
      }
    }

    if (!this._deps.length) this.performActiveChange(true);
  }

  performActiveChange(active: boolean) {
    if (this._isActive) return;
    if (!this._isActive && active) {
      this._isActive = true;
      // 只有当有值的时候才设置一次
      if (this._softData.length) {
        this.setData(this._softData);
      }
      // 无脑调用一次触底
      // this.onEndReachedHelper.onEndReachedHandler({
      //   distanceFromEnd: 0,
      // });
      this.onEndReachedHelper.attemptToHandleOnEndReachedBatchinator.schedule();
    }
  }

  // 临时提供data，不然的话，data.length会一直返回0
  updateInitialNumDueToListGroup(data: Array<ItemT>) {
    if (!this._listGroupDimension) return;
    if (!data.length) return;
    const startIndex = this._listGroupDimension.getDimensionStartIndex(
      this.id,
      true
    );
    const initialNumToRender = this._listGroupDimension.initialNumToRender;
    if (startIndex < initialNumToRender) {
      const step = initialNumToRender - startIndex;
      this.initialNumToRender = data.length >= step ? step : data.length;
    }
  }

  updatePersistanceIndicesDueToListGroup(data: Array<ItemT> = this._data) {
    if (!this._listGroupDimension) return;
    if (!data.length) return;
    const persistanceIndices = this._listGroupDimension.persistanceIndices;
    if (!persistanceIndices.length) return;

    const startIndex = this._listGroupDimension.getDimensionStartIndex(
      this.id,
      true
    );
    const endIndex = startIndex + data.length;

    const first = persistanceIndices[0];
    const last = persistanceIndices[persistanceIndices.length - 1];

    if (
      isClamped(first, startIndex, last) ||
      isClamped(first, endIndex, last)
    ) {
      const indices = [];
      for (let index = 0; index < persistanceIndices.length; index++) {
        const currentIndex = persistanceIndices[index];
        if (isClamped(startIndex, currentIndex, endIndex)) {
          indices.push(currentIndex - startIndex);
        }
      }
      if (indices.length) this.persistanceIndices = indices;
    } else {
      this.persistanceIndices = [];
    }
  }

  attemptToHandleEndReached() {
    if (!this._listGroupDimension) {
      if (this.initialNumToRender)
        this.onEndReachedHelper.attemptToHandleOnEndReachedBatchinator.schedule();
    }
  }

  /**
   * Data change will trigger `state` update for one times.
   */
  setData(data: Array<ItemT>) {
    if (!this._isActive) {
      this._softData = data;
      return KeysChangedType.Idle;
    }

    const changedType = this._setData(data);

    if (!this._listGroupDimension && changedType === KeysChangedType.Initial) {
      const state = this.resolveInitialState();
      this.setState(state);
      this._state = state;
      return changedType;
    }

    if (changedType === KeysChangedType.Equal) return KeysChangedType.Equal;

    // 如果没有值，这个时候要触发一次触底
    if (!data.length && this.initialNumToRender) {
      this.onEndReachedHelper.attemptToHandleOnEndReachedBatchinator.schedule();
    }

    if (this._listGroupDimension) {
      if (
        [KeysChangedType.Add, KeysChangedType.Remove].indexOf(changedType) !==
        -1
      ) {
        this._listGroupDimension.onItemsCountChanged(false);
      } else if (changedType === KeysChangedType.Reorder) {
        // 之所以，不能够用缓存；因为现在的判断Reorder只是看key；这个key对应的item其实
        // 并没有看；所以它不是纯粹的shuffle；这个时候item可能发生了变化，所以是不能够用
        // 缓存的。艸，描述错了。。它其实是因为打乱顺序以后，可能indexRange会发生变化；
        this._listGroupDimension.updateScrollMetrics(this._scrollMetrics, {
          flush: true,
          useCache: false,
        });
      }
    } else {
      // disable onEndReached; which may cause loop
      setTimeout(() => {
        if (this._scrollMetrics) this.dispatchStoreMetrics(this._scrollMetrics);
      });

      // if (this._scrollMetrics) this.dispatchStoreMetrics(this._scrollMetrics);

      // if (this._dataChangeTriggerOnEndReachedTimer) {
      //   clearTimeout(this._dataChangeTriggerOnEndReachedTimer);
      // }

      // this._dataChangeTriggerOnEndReachedTimer = setTimeout(() => {
      //   this.updateScrollMetrics(this._scrollMetrics, false);
      // }, 350);

      // temp fix
      // this.updateScrollMetrics(this._scrollMetrics, false);
    }

    return changedType;
  }

  setOnEndReached(onEndReached: OnEndReached) {
    this.onEndReachedHelper.setHandler(onEndReached);
  }

  _setData(_data: Array<ItemT>) {
    if (_data === this._data) return KeysChangedType.Equal;
    const keyToIndexMap: Map<string, number> = new Map();
    const keyToIndexArray: Array<string> = [];
    const itemToKeyMap: Map<ItemT, string> = new Map();
    let duplicateKeyCount = 0;
    // TODO: optimization
    const data = _data.filter((item, index) => {
      const itemKey = this.getItemKey(item, index);
      const _index = keyToIndexArray.findIndex((key) => key === itemKey);
      if (_index === -1) {
        keyToIndexMap.set(itemKey, index - duplicateKeyCount);
        keyToIndexArray.push(itemKey);
        itemToKeyMap.set(item, itemKey);
        return true;
      }
      duplicateKeyCount += 1;

      return false;
    });

    const dataChangedType = this.resolveKeysChangedType(
      keyToIndexArray,
      (index: number) => this._data[index] === data[index]
    );

    switch (dataChangedType) {
      case KeysChangedType.Equal:
        break;
      case KeysChangedType.Append:
        this.updateTheLastItemIntervalValue();
        this.append(data);
        break;
      case KeysChangedType.Initial:
        this._initializeMode = true;
        this.append(data);
        this._initializeMode = false;
        break;
      case KeysChangedType.Add:
      case KeysChangedType.Remove:
      case KeysChangedType.Reorder:
        this.shuffle(data);
        break;
    }

    this._data = data;

    this._keyToIndexMap = keyToIndexMap;
    this._indexKeys = keyToIndexArray;
    this._itemToKeyMap = itemToKeyMap;
    return dataChangedType;
  }

  /**
   * 当追加data的时候，假如说有separator存在的话，本来最后一个的item，不再是最后一个了；
   * 这个时候其实要加上separatorLength的
   * @returns void
   */
  updateTheLastItemIntervalValue() {
    const len = this._data.length;
    const index = len - 1;
    const item = this._data[index];
    if (!item) return;

    const meta = this.getItemMeta(item, index);
    const layout = meta?.getLayout();

    if (meta && layout) {
      const separatorLength = meta.getSeparatorLength();
      const length = this._selectValue.selectLength(layout) + separatorLength;
      this.setIntervalTreeValue(index, length);
    }
  }

  getIndexInfo(key: string): IndexInfo {
    const info = {} as IndexInfo;
    info.index = this._indexKeys.indexOf(key);
    if (this._listGroupDimension) {
      info.indexInGroup = this._listGroupDimension.getFinalIndex(key, this.id);
    }
    return info;
  }

  pump(
    _data: Array<ItemT>,
    baseIndex = 0,
    keyToMetaMap: Map<string, ItemMeta>,
    intervalTree: PrefixIntervalTree
  ) {
    const data = _data.slice(baseIndex);
    const len = data.length;

    for (let index = 0; index < len; index++) {
      const item = data[index];
      const currentIndex = index + baseIndex;
      const itemKey = this.getItemKey(item, currentIndex);
      const meta =
        this.getKeyMeta(itemKey) ||
        this.createItemMeta(itemKey, _data, currentIndex);

      if (meta.getLayout()) {
        const itemLength = this._selectValue.selectLength(meta.getLayout());
        const separatorLength = meta.getSeparatorLength();

        // 最后一个不包含separatorLength
        const length =
          index === len - 1 ? itemLength : itemLength + separatorLength;
        intervalTree.set(currentIndex, length);
      }

      keyToMetaMap.set(itemKey, meta);
    }
  }

  viewableItemsOnly() {
    if (this._fillingMode === FillingMode.RECYCLE) {
      const { recycleState, spaceState } = this
        ._stateResult as RecycleStateResult<ItemT>;
      const nextRecycleState = recycleState.filter((info) => {
        const { itemMeta } = info;
        if (itemMeta) {
          if (itemMeta?.getState().viewable) return true;
          return false;
        }
        return true;
      });
      this._stateListener(
        {
          recycleState: nextRecycleState,
          spaceState,
        },
        this._stateResult
      );
    }
  }

  resetViewableItems() {
    if (this._scrollMetrics) this.dispatchMetrics(this._scrollMetrics);
  }

  append(data: Array<ItemT>) {
    const baseIndex = this._indexKeys.length;
    this.pump(data, baseIndex, this._keyToMetaMap, this.intervalTree);
  }

  shuffle(data: Array<ItemT>) {
    const itemIntervalTree = this.createIntervalTree();
    const keyToMetaMap = new Map();
    this.pump(data, 0, keyToMetaMap, itemIntervalTree);
    this.replaceIntervalTree(itemIntervalTree);
    this._keyToMetaMap = keyToMetaMap;
  }

  /**
   *
   * @param key string, itemKey
   * @param info
   * @param updateIntervalTree target IntervalTree
   * @returns boolean value, true for updating intervalTree successfully.
   */
  _setKeyItemLayout(
    key: string,
    info: ItemLayout | number,
    updateIntervalTree?: boolean
  ) {
    const falsy = this.performKeyOperationGuard(key);
    const _update =
      typeof updateIntervalTree === 'boolean' ? updateIntervalTree : true;

    if (!falsy) {
      if (this._parentItemsDimensions)
        return this._parentItemsDimensions.setKeyItemLayout(key, info, _update);
      return false;
    }
    const index = this.getKeyIndex(key);
    // const item = this._data[index];
    const meta = this.getKeyMeta(key);
    // const meta = this.getItemMeta(item, index);

    if (!meta) return false;

    if (typeof info === 'number') {
      let length = info;
      if (this._selectValue.selectLength(meta.getLayout() || {}) !== length) {
        this._selectValue.setLength(meta.ensureLayout(), length);

        if (index !== this._data.length - 1) {
          length = meta.getSeparatorLength() + length;
        }
        if (_update) {
          this.setIntervalTreeValue(index, length);
          return true;
        }
      }
    }

    if (!layoutEqual(meta.getLayout(), info as ItemLayout)) {
      const currentLength = this._selectValue.selectLength(
        meta.getLayout() || {}
      );
      let length = this._selectValue.selectLength((info as ItemLayout) || {});
      meta.setLayout(info as ItemLayout);
      // 只有关心的值发生变化时，才会再次触发setIntervalTreeValue
      if (currentLength !== length && _update) {
        if (index !== this._data.length - 1) {
          length = meta.getSeparatorLength() + length;
        }
        this.setIntervalTreeValue(index, length);
        return true;
      }
    }

    return false;
  }

  computeIndexRange(minOffset: number, maxOffset: number) {
    const result = this.intervalTree.computeRange(minOffset, maxOffset);
    return result;
  }

  computeIndexRangeMeta(minOffset: number, maxOffset: number): Array<ItemMeta> {
    const result = this.intervalTree.computeRange(minOffset, maxOffset);
    if (result.startIndex === -1 && result.endIndex === -1) return [];

    const { startIndex, endIndex } = result;
    const returnValue = [];
    for (let index = startIndex; index <= endIndex; index++) {
      const meta = this.getIndexItemMeta(index);
      if (meta) returnValue.push(meta);
    }
    return returnValue;
  }

  addStateListener(listener: StateListener<ItemT>) {
    if (typeof listener === 'function') this._stateListener = listener;
    return () => {
      if (typeof listener === 'function') this._stateListener = null;
    };
  }

  applyStateResult(stateResult: ListStateResult<ItemT>) {
    let shouldStateUpdate = false;

    if (!this._stateResult && stateResult) {
      shouldStateUpdate = true;
    } else if (this.fillingMode === FillingMode.SPACE) {
      shouldStateUpdate = !shallowEqual(stateResult, this._stateResult);
    } else if (this.fillingMode === FillingMode.RECYCLE) {
      const _stateResult = stateResult as RecycleStateResult<ItemT>;
      const _oldStateResult = this._stateResult as RecycleStateResult<ItemT>;

      const newRecycleState = [];
      const oldRecycleState = [];

      let maxIndex = 0;

      for (let index = 0; index < _stateResult.recycleState.length; index++) {
        // @ts-ignore
        const { itemMeta, targetIndex } = _stateResult.recycleState[index];
        if (!itemMeta || (itemMeta && itemMeta.getState().viewable)) {
          newRecycleState.push(_stateResult.recycleState[index]);
          oldRecycleState.push(_oldStateResult.recycleState[index]);
          maxIndex = Math.max(targetIndex, index);
        } else {
          newRecycleState.push(null);
          oldRecycleState.push(null);
        }
      }

      let exists = true;

      // To fix onEndReached condition, data is updated. it will not trigger update issue.
      if (isClamped(0, maxIndex + 1, this._data.length - 1)) {
        exists =
          _oldStateResult.recycleState.findIndex(
            (s) => s?.targetIndex === maxIndex + 1
          ) !== -1;
      }

      // if (this.id === 'component-list-all') {
      //   console.log(
      //     'applyStateResult ',
      //     minIndex,
      //     maxIndex,
      //     this._data.length,
      //     exists
      //   );
      // }

      shouldStateUpdate =
        !(
          shallowArrayEqual(newRecycleState, oldRecycleState, shallowEqual) &&
          shallowArrayEqual(
            _stateResult.spaceState,
            _oldStateResult.spaceState,
            shallowEqual
          )
        ) || !exists;
    }

    if (shouldStateUpdate && typeof this._stateListener === 'function') {
      if (this.fillingMode === FillingMode.RECYCLE) {
        const { recycleState: _recycleState, spaceState } =
          stateResult as RecycleStateResult<ItemT>;
        // @ts-ignore
        const recycleState = _recycleState.map((state) => {
          if (!state) return null;
          // @ts-ignore
          const { viewable, ...rest } = state;
          return rest;
        });
        this._stateListener(
          {
            recycleState,
            spaceState,
          },
          this._stateResult
        );
      } else {
        this._stateListener(stateResult, this._stateResult);
      }
    }

    this._stateResult = stateResult;
  }

  setState(state: ListState<ItemT>, force = false) {
    if (this.fillingMode === FillingMode.SPACE) {
      const stateResult = force
        ? this.resolveSpaceState(state)
        : this.memoizedResolveSpaceState(state);
      this.applyStateResult(stateResult);
    } else if (this.fillingMode === FillingMode.RECYCLE) {
      const stateResult = force
        ? this.resolveRecycleState(state)
        : this.memoizedResolveRecycleState(state);
      this.applyStateResult(stateResult);
    }
  }

  createSpaceStateToken(options?: Partial<SpaceStateToken<ItemT>>) {
    return {
      item: null,
      key: '',
      length: 0,
      isSpace: false,
      position: 'before' as SpaceStateTokenPosition,
      isSticky: false,
      isReserved: false,
      ...options,
    };
  }

  /**
   * For performance boosting. `getIndexKeyOffset` will call intervalTree's sumUtil
   * function. this method may cause performance issue.
   * @param startIndex
   * @param endIndex
   * @param exclusive
   * @returns
   */
  getIndexRangeOffsetMap(
    startIndex: number,
    endIndex: number,
    exclusive?: boolean
  ) {
    const indexToOffsetMap = {};
    let startOffset = this.getIndexKeyOffset(startIndex, exclusive);
    for (let index = startIndex; index <= endIndex; index++) {
      indexToOffsetMap[index] = startOffset;
      const item = this._data[index];
      const itemMeta = this.getItemMeta(item, index);
      startOffset +=
        (itemMeta?.getLayout()?.height || 0) +
        (itemMeta?.getSeparatorLength() || 0);
    }
    return indexToOffsetMap;
  }

  getPosition(rowIndex: number, startIndex: number, endIndex: number) {
    // 初始化的item不参与absolute替换
    if (rowIndex < this.initialNumToRender) return null;
    let position = this._bufferSet.getValuePosition(rowIndex);

    if (
      position === null &&
      this._bufferSet.getSize() >= this.recycleThreshold
    ) {
      position = this._bufferSet.replaceFurthestValuePosition(
        startIndex,
        endIndex,
        rowIndex
      );
    }

    if (position === null) {
      position = this._bufferSet.getNewPositionForValue(rowIndex);
    }

    return position;
  }

  // getRecycleReuseOffsetBuilder(props: {
  //   minIndex: number;
  //   topStartOffset: number;
  //   topStartIndex: number;
  //   bottomStartOffset: number;
  //   bottomStartIndex: number;
  // }) {
  //   const {
  //     minIndex,
  //     topStartOffset: _topStartOffset,
  //     topStartIndex: _topStartIndex,
  //     bottomStartOffset: _bottomStartOffset,
  //     bottomStartIndex: _bottomStartIndex,
  //   } = props;

  //   let topStartIndex = _topStartIndex;
  //   let topStartOffset = _topStartOffset;
  //   let bottomStartIndex = _bottomStartIndex;
  //   let bottomStartOffset = _bottomStartOffset;

  //   const placeOnTop = (length: number) => {
  //     let offset = 0;
  //     if (topStartIndex < minIndex) {
  //       offset = bottomStartOffset + length;
  //       bottomStartIndex += 1;
  //       bottomStartOffset = offset;
  //     } else {
  //       offset = topStartOffset - length;
  //       if (offset >= 0) {
  //         topStartIndex -= 1;
  //         topStartOffset = offset;
  //       }
  //     }
  //     return offset;
  //   };

  //   const placeOnBottom = (length: number) => {
  //     let offset = 0;
  //     offset = bottomStartOffset + length;
  //     bottomStartIndex += 1;
  //     bottomStartOffset = offset;
  //     return offset;
  //   };

  //   return (info: {
  //     currentIndex: number;
  //     length: number;
  //     velocity: number;
  //   }) => {
  //     const { velocity, currentIndex, length } = info;
  //     // scroll up, preserve start
  //     if (velocity < 0) {
  //       return placeOnTop(length);
  //     } else if (velocity > 0) {
  //       return placeOnBottom(length);
  //     }
  //     if (currentIndex < _topStartIndex) {
  //       return placeOnTop(length);
  //     }
  //     return placeOnBottom(length);
  //   };
  // }

  resolveSafeRange(props: {
    visibleStartIndex: number;
    visibleEndIndex: number;
  }) {
    const { visibleStartIndex, visibleEndIndex } = props;
    // const velocity = this._scrollMetrics?.velocity || 0;

    // let startIndex = visibleStartIndex
    // let endIndex = visibleEndIndex

    // if (velocity < 0) {
    //   startIndex = Math.max(
    //       visibleStartIndex - this.recycleBufferedCount * 2,
    //       0
    //     )
    //   endIndex = visibleEndIndex
    // } else if (velocity > 0) {
    //     startIndex = visibleStartIndex
    //     endIndex = Math.min(
    //       visibleEndIndex + this.recycleBufferedCount * 2,
    //       this._data.length
    //     )
    // } else {
    //   startIndex = Math.max(visibleStartIndex - this.recycleBufferedCount, 0)
    //   endIndex = Math.min(
    //     visibleEndIndex + this.recycleBufferedCount,
    //     this._data.length
    //   )
    // }

    return {
      startIndex: visibleStartIndex,
      endIndex: Math.min(
        visibleEndIndex,
        visibleStartIndex + this.recycleThreshold - 1
      ),
    };
  }

  updateIndices(
    targetIndices: Array<number>,
    props: {
      safeRange: {
        startIndex: number;
        endIndex: number;
      };
      startIndex: number;
      maxCount: number;
      step: number;
    }
  ) {
    const { startIndex, safeRange, step, maxCount } = props;
    let finalIndex = startIndex;
    let count = 0;
    if (maxCount < 0) return finalIndex;
    for (
      let index = startIndex;
      step > 0 ? index <= this._data.length - 1 : index >= 0;
      index += step
    ) {
      const item = this._data[index];
      if (!item) continue;
      // const itemMeta = this.getItemMeta(item, index);
      // const itemLayout = itemMeta?.getLayout();

      // itemLayout should not be a condition, may cause too many unLayout item
      if (count < maxCount) {
        const position = this.getPosition(
          index,
          safeRange.startIndex,
          safeRange.endIndex
        );

        finalIndex = index;
        if (position !== null) targetIndices[position] = index;
      } else {
        break;
      }

      if (index >= this.initialNumToRender) {
        count++;
      }
    }
    return finalIndex;
  }

  resolveRecycleRecycleState(state: ListState<ItemT>) {
    const { visibleEndIndex, visibleStartIndex: _visibleStartIndex } = state;
    const targetIndices = this._bufferSet.indices.map((i) => parseInt(i));
    const recycleStateResult = [];
    const velocity = this._scrollMetrics?.velocity || 0;
    // const targetIndicesCopy = targetIndices.slice();

    const visibleStartIndex = Math.max(
      _visibleStartIndex,
      this.initialNumToRender
    );

    const safeRange = this.resolveSafeRange({
      visibleStartIndex,
      visibleEndIndex,
    });

    if (visibleEndIndex >= 0) {
      for (let index = visibleStartIndex; index <= visibleEndIndex; index++) {
        const position = this.getPosition(
          index,
          safeRange.startIndex,
          safeRange.endIndex
        );
        if (position !== null) targetIndices[position] = index;
      }
    }

    const remainingPosition = Math.max(
      this.recycleThreshold - (safeRange.endIndex - safeRange.startIndex + 1),
      0
    );
    const remainingCount = Math.min(
      this.recycleBufferedCount * 2,
      remainingPosition
    );

    if (velocity > 0) {
      this.updateIndices(targetIndices, {
        safeRange,
        startIndex: visibleEndIndex + 1,
        maxCount: remainingCount,
        step: 1,
      });
    } else if (velocity < 0) {
      this.updateIndices(targetIndices, {
        safeRange,
        startIndex: visibleStartIndex - 1,
        maxCount: remainingCount,
        step: -1,
      });
    } else {
      const part = Math.floor(remainingCount / 2);
      this.updateIndices(targetIndices, {
        safeRange,
        startIndex: visibleStartIndex - 1,
        maxCount: part,
        step: -1,
      });
      this.updateIndices(targetIndices, {
        safeRange,
        startIndex: visibleEndIndex + 1,
        maxCount: remainingCount - part,
        step: 1,
      });
    }

    const minValue = this._bufferSet.getMinValue();
    const maxValue = this._bufferSet.getMaxValue();
    const indexToOffsetMap = this.getIndexRangeOffsetMap(
      minValue,
      maxValue,
      true
    );

    // const getOffset = this.getRecycleReuseOffsetBuilder({
    //   topStartOffset: indexToOffsetMap[Math.max(topStartIndex, 0)] || 0,
    //   bottomStartOffset: indexToOffsetMap[Math.max(bottomStartIndex, 0)] || 0,
    //   minIndex: this.initialNumToRender,
    //   topStartIndex,
    //   bottomStartIndex,
    // });

    // if (this.id === 'component-list-all') {
    //   console.log('targetIndices ', targetIndicesCopy, targetIndices.slice());
    // }

    targetIndices.forEach((targetIndex, index) => {
      // if (targetIndex == null) {
      //   targetIndex = _targetIndices[index];
      //   const item = this._data[targetIndex];
      //   if (!item) return;
      //   const itemKey = this.getItemKey(item, targetIndex);
      //   const itemMeta = this.getItemMeta(item, targetIndex);
      //   const itemLayout = itemMeta?.getLayout();
      //   const itemLength =
      //     (itemLayout?.height || 0) + (itemMeta?.getSeparatorLength() || 0);

      //   let offset = 0;

      //   if (this._scrollMetrics && itemLayout) {
      //     const velocity = this._scrollMetrics.velocity;
      //     offset = getOffset({
      //       currentIndex: targetIndex,
      //       length: itemLength,
      //       velocity,
      //     });
      //   }

      //   recycleStateResult.push({
      //     key: `recycle_${index}`,
      //     targetKey: itemKey,
      //     targetIndex,
      //     length: itemLength,
      //     isSpace: false,
      //     isSticky: false,
      //     item,
      //     itemMeta,
      //     viewable: itemMeta.getState().viewable,
      //     // 如果没有offset，说明item是新增的，那么它渲染就在最开始位置好了
      //     offset: itemLayout ? offset : 0,
      //     position: 'buffered',
      //   });
      //   return;
      // }
      const item = this._data[targetIndex];
      if (!item) return;

      const itemKey = this.getItemKey(item, targetIndex);
      const itemMeta = this.getItemMeta(item, targetIndex);
      const itemLayout = itemMeta?.getLayout();
      const itemLength =
        (itemLayout?.height || 0) + (itemMeta?.getSeparatorLength() || 0);

      const itemMetaState =
        !this._scrollMetrics || !itemMeta?.getLayout()
          ? itemMeta
            ? itemMeta.getState()
            : {}
          : this._configTuple.resolveItemMetaState(
              itemMeta,
              this._scrollMetrics,
              // should add container offset, because indexToOffsetMap containerOffset is
              // exclusive.
              () => indexToOffsetMap[targetIndex] + this.getContainerOffset()
            );

      itemMeta?.setItemMetaState(itemMetaState);

      recycleStateResult.push({
        key: `recycle_${index}`,
        targetKey: itemKey,
        targetIndex,
        length: itemLength,
        isSpace: false,
        isSticky: false,
        item,
        itemMeta,
        viewable: itemMeta.getState().viewable,
        // 如果没有offset，说明item是新增的，那么它渲染就在最开始位置好了
        offset: itemLength ? indexToOffsetMap[targetIndex] : 0,
        position: 'buffered',
      });
    });
    return recycleStateResult;
  }

  resolveRecycleState(state: ListState<ItemT>) {
    const recycleEnabled = this._recycleEnabled();
    // 只有当recycleEnabled为true的时候，才进行位置替换
    const recycleStateResult = recycleEnabled
      ? this.resolveRecycleRecycleState(state)
      : [];
    const spaceStateResult = this.resolveRecycleSpaceState(state);

    const stateResult = {
      recycleState: recycleStateResult.filter((v) => v),
      spaceState: spaceStateResult.filter((v) => v),
    };

    return stateResult;
  }

  /**
   *
   * @param startIndex included
   * @param endIndex exclusive
   */
  resolveToken(startIndex: number, endIndex: number) {
    if (startIndex >= endIndex) return [];
    const createToken = (startIndex: number) => ({
      startIndex,
      endIndex: startIndex + 1,
      isSticky: false,
      isReserved: false,
      isSpace: true,
    });
    const tokens = [createToken(startIndex)];

    this.reservedIndices.forEach((index) => {
      const lastToken = tokens[tokens.length - 1];
      if (isClamped(startIndex, index, endIndex - 1)) {
        const isSticky = this.stickyHeaderIndices.indexOf(index) !== -1;
        const isReserved = this.persistanceIndices.indexOf(index) !== -1;
        if (lastToken.startIndex === index) {
          lastToken.isSticky = isSticky;
          lastToken.isReserved = isReserved;
          if (index + 1 !== endIndex) tokens.push(createToken(index + 1));
        } else {
          lastToken.endIndex = index;
          tokens.push({
            startIndex: index,
            endIndex: index + 1,
            isSticky,
            isReserved,
            isSpace: !isSticky && !isReserved,
          });
          if (index + 1 !== endIndex) tokens.push(createToken(index + 1));
        }
      }
    });

    const lastToken = tokens[tokens.length - 1];
    if (lastToken.endIndex !== endIndex) lastToken.endIndex = endIndex;

    return tokens;
  }

  resolveRecycleSpaceState(state: ListState<ItemT>) {
    return this.resolveSpaceState(state, {
      bufferedStartIndex: (state) =>
        state.bufferedStartIndex >= this.initialNumToRender
          ? this.initialNumToRender
          : state.bufferedStartIndex,
      bufferedEndIndex: (state) =>
        state.bufferedEndIndex >= this.initialNumToRender
          ? this.initialNumToRender - 1
          : state.bufferedEndIndex,
    });
  }

  resolveSpaceState(
    state: ListState<ItemT>,
    resolver?: {
      bufferedStartIndex?: (state: ListState<ItemT>) => number;
      bufferedEndIndex?: (state: ListState<ItemT>) => number;
      visibleStartIndex?: (state: ListState<ItemT>) => number;
      visibleEndIndex?: (state: ListState<ItemT>) => number;
    }
  ) {
    const {
      data,
      bufferedEndIndex: _bufferedEndIndex,
      bufferedStartIndex: _bufferedStartIndex,
    } = state;
    const bufferedEndIndex = resolver?.bufferedEndIndex
      ? resolver?.bufferedEndIndex(state)
      : _bufferedEndIndex;
    const bufferedStartIndex = resolver?.bufferedStartIndex
      ? resolver?.bufferedStartIndex(state)
      : _bufferedStartIndex;

    const nextStart = bufferedStartIndex;
    const nextEnd = bufferedEndIndex + 1;
    const remainingData = data.slice(nextStart, nextEnd);
    const beforeTokens = this.resolveToken(0, nextStart);
    const spaceState = [];

    beforeTokens.forEach((token) => {
      const { isSticky, isReserved, startIndex, endIndex } = token;
      if (isSticky || isReserved) {
        const item = this._data[startIndex];
        spaceState.push({
          item,
          key: this.getItemKey(item, startIndex),
          isSpace: false,
          isSticky,
          length: this.getIndexItemLength(startIndex),
          isReserved,
        });
      } else {
        const startIndexOffset = this.getIndexKeyOffset(startIndex);
        const endIndexOffset = this.getIndexKeyOffset(endIndex);
        spaceState.push({
          isSpace: true,
          item: null,
          isSticky: false,
          isReserved: false,
          key: buildStateTokenIndexKey(startIndex, endIndex - 1),
          length: endIndexOffset - startIndexOffset,
        });
      }
    });

    const indexToOffsetMap = this.getIndexRangeOffsetMap(
      bufferedStartIndex,
      bufferedEndIndex
    );

    remainingData.forEach((item, _index) => {
      const index = bufferedStartIndex + _index;
      const itemMeta = this.getItemMeta(item, index);
      if (!itemMeta) return;
      const isSticky = this.stickyHeaderIndices.indexOf(index) !== -1;
      const isReserved = this.persistanceIndices.indexOf(index) !== -1;
      const itemLayout = itemMeta?.getLayout();
      const itemKey = itemMeta.getKey();
      const itemLength =
        (itemLayout?.height || 0) + (itemMeta?.getSeparatorLength() || 0);

      const itemMetaState =
        !this._scrollMetrics || !itemMeta?.getLayout()
          ? itemMeta
            ? itemMeta.getState()
            : {}
          : this._configTuple.resolveItemMetaState(
              itemMeta,
              this._scrollMetrics,
              () => indexToOffsetMap[index]
            );

      itemMeta?.setItemMetaState(itemMetaState);

      spaceState.push({
        key: itemKey,
        item,
        isSpace: false,
        isSticky,
        isReserved,
        length: itemLength,
      });
    });

    const afterTokens = this.resolveToken(nextEnd, data.length);

    afterTokens.forEach((token) => {
      const { isSticky, isReserved, startIndex, endIndex } = token;
      if (isSticky || isReserved) {
        const item = this._data[startIndex];
        spaceState.push({
          item,
          isSpace: false,
          key: this.getItemKey(item, startIndex),
          isSticky,
          isReserved,
          length: this.getIndexItemLength(startIndex),
        });
      } else {
        const startIndexOffset = this.getIndexKeyOffset(startIndex);
        const endIndexOffset = this.getIndexKeyOffset(endIndex);

        spaceState.push({
          item: null,
          isSpace: true,
          isSticky: false,
          isReserved: false,
          length: endIndexOffset - startIndexOffset,
          // endIndex is not included
          key: buildStateTokenIndexKey(startIndex, endIndex - 1),
        });
      }
    });

    return spaceState;
  }

  updateState(newState: PreStateResult, scrollMetrics: ScrollMetrics) {
    const {
      bufferedStartIndex: nextBufferedStartIndex,
      bufferedEndIndex: nextBufferedEndIndex,
    } = newState;

    const omitKeys = ['data', 'distanceFromEnd', 'isEndReached'];
    const nextDataLength = Math.max(
      nextBufferedEndIndex + 1,
      this.getReflowItemsLength()
    );

    const oldData = this._state.data;

    const newData = this._data.slice(0, nextDataLength);

    const { isEqual } = resolveChanged(oldData, newData);

    const shouldSetState =
      shallowDiffers(
        omit(this._state || {}, omitKeys),
        omit(newState, omitKeys)
      ) || !isEqual;

    if (shouldSetState) {
      const state = {
        ...newState,
        data: this._data.slice(0, nextDataLength),
      };

      this.setState(state);
      this._state = state;
      this._offsetTriggerCachedState = scrollMetrics.offset;
    }
  }

  dispatchStoreMetrics(scrollMetrics: ScrollMetrics) {
    const state = this._store.dispatchMetrics({
      dimension: this,
      scrollMetrics,
    });

    // if (this.id === 'component-list-all') {
    //   console.log('dispatchStoreMetrics ', { ...state });
    // }

    if (isEmpty(state)) return state;
    this.updateState(state, scrollMetrics);
    return state;
  }

  dispatchMetrics(scrollMetrics: ScrollMetrics) {
    const state = this.dispatchStoreMetrics(scrollMetrics);
    const { isEndReached, distanceFromEnd } = state;

    this.onEndReachedHelper.performEndReached({
      isEndReached,
      distanceFromEnd,
    });
  }

  dispatchScrollMetricsEnabled() {
    return (
      this.selector.getDispatchScrollMetricsEnabledStatus() &&
      ListSpyUtils.selector.getDispatchScrollMetricsEnabledStatus() &&
      (this._listGroupDimension
        ? this._listGroupDimension.dispatchScrollMetricsEnabled()
        : true)
    );
  }

  onEnableDispatchScrollMetrics() {
    this.dispatchMetrics(this._scrollMetrics);
  }

  stillnessHandler() {
    this.dispatchMetrics(this._scrollMetrics);
  }

  isStill() {
    this._stillnessHelper.isStill;
  }

  /**
   * When to trigger updateScrollMetrics..
   * - on scroll
   * - layout change.
   *   - In rn, use contentSizeChanged. `setIntervalTreeValue` has remove update scroll logic.
   *   - In web, maybe `setIntervalTreeValue` to trigger state updating..
   */
  updateScrollMetrics(
    scrollMetrics: ScrollMetrics = this._scrollMetrics,
    useCache = true
  ) {
    if (!scrollMetrics) return;
    if (!this.dispatchScrollMetricsEnabled()) {
      this._scrollMetrics = scrollMetrics;
      return;
    }

    if (!useCache) {
      this._scrollMetrics = scrollMetrics;
      this._dispatchMetricsBatchinator.schedule(scrollMetrics);
      return;
    }

    if (this._scrollMetrics?.offset !== scrollMetrics?.offset) {
      // this._stillnessHelper.startClockBatchinateLast.schedule();
    }

    if (
      !this._scrollMetrics ||
      scrollMetrics.contentLength !== this._scrollMetrics.contentLength ||
      scrollMetrics.offset !== this._scrollMetrics.offset ||
      scrollMetrics.visibleLength !== this._scrollMetrics.visibleLength
    ) {
      this._scrollMetrics = scrollMetrics;
      this._dispatchMetricsBatchinator.schedule(scrollMetrics);
    } else if (scrollMetrics.offset !== this._offsetTriggerCachedState) {
      this._scrollMetrics = scrollMetrics;
      this._dispatchMetricsBatchinator.schedule(scrollMetrics);
    } else {
      this._dispatchMetricsBatchinator.dispose({
        abort: true,
      });
      this.updateState(this._state, scrollMetrics);
    }

    this._scrollMetrics = scrollMetrics;
  }
}

export default ListDimensions;
