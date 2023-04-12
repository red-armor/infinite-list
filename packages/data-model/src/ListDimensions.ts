import noop from '@x-oasis/noop';
import Batchinator from '@x-oasis/batchinator';
import BaseDimensions from './BaseDimensions';
import ItemMeta from './ItemMeta';
import ItemsDimensions from './ItemsDimensions';
import ListGroupDimensions from './ListGroupDimensions';
import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';
import layoutEqual from '@x-oasis/layout-equal';
import omit from '@x-oasis/omit';
import { INVALID_LENGTH, isNotEmpty, shallowDiffers } from './common';
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
  private _stateResult: ListStateResult<ItemT> = [];

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

  private _onUpdateItemsMetaChangeBatchinator: Batchinator;

  private _initializeMode = false;

  private _onBatchLayoutFinished: () => boolean;

  public updateStateBatchinator: Batchinator;
  private _recalculateRecycleResultStateBatchinator: Batchinator;

  private _selector = new EnabledSelector();

  private _bufferSet = new IntegerBufferSet();

  private _offsetTriggerCachedState = 0;

  private memoizedResolveSpaceState: (
    state: ListState<ItemT>
  ) => SpaceStateResult<ItemT>;
  private memoizedResolveRecycleState: (
    state: ListState<ItemT>
  ) => RecycleStateResult<ItemT>;

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
      initialNumToRender,
      persistanceIndices,
      onEndReachedTimeoutThreshold,
      onEndReachedHandlerTimeoutThreshold,
    } = props;
    this._keyExtractor = keyExtractor;
    this._getItemLayout = getItemLayout;
    this._getItemSeparatorLength = getItemSeparatorLength;
    // for ListItem include a basic items condition
    this._parentItemsDimensions = parentItemsDimensions;
    this._listGroupDimension = listGroupDimension;
    this._dispatchMetricsBatchinator = new Batchinator(
      this.dispatchMetrics.bind(this),
      50
    );
    this.onEndReachedHelper = new OnEndReachedHelper({
      onEndReached,
      onEndReachedThreshold,
      onEndReachedTimeoutThreshold,
      onEndReachedHandlerTimeoutThreshold,
    });
    this._onBatchLayoutFinished = onBatchLayoutFinished;

    this._deps = deps;
    this._isActive = this.resolveInitialActiveValue(active);

    if (this._listGroupDimension && initialNumToRender) {
      console.warn(
        '[Spectrum warning] : As a `ListGroup` child list,  List Props ' +
          ' initialNumToRender value should be controlled' +
          'by `ListGroup` commander. So value is reset to `0`.'
      );
      this.initialNumToRender = 0;
    }

    if (this._listGroupDimension && persistanceIndices) {
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

    this._onUpdateItemsMetaChangeBatchinator = new Batchinator(
      this.onUpdateItemsMetaChange.bind(this),
      50
    );
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

  set offsetInListGroup(offset: number) {
    this._offsetInListGroup = offset;
  }

  getState() {
    return this._stateResult;
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

  _recycleEnabled() {
    if (this.fillingMode !== FillingMode.RECYCLE) return false;
    const originalPositionSize = this._bufferSet.getSize();
    return originalPositionSize >= this.recycleThreshold;
  }

  recalculateRecycleResultState() {
    this.setState(this._state, true);
  }

  // 一旦当前的length 发生了变化，判断一下自己总的高度是否变化，如果
  // 变了，那么就去更新
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
    this._renderStateListeners = [];
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
      this.onEndReachedHelper.onEndReachedHandler({
        distanceFromEnd: 0,
      });
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
        this.onEndReachedHelper.onEndReachedHandler({
          distanceFromEnd: 0,
        });
    }
  }

  setData(data: Array<ItemT>) {
    if (!this._isActive) {
      this._softData = data;
      return KeysChangedType.Idle;
    }

    const changedType = this._setData(data);

    if (!this._listGroupDimension && changedType === KeysChangedType.Initial) {
      const state = this.resolveInitialState();
      this.setState(state);
      return changedType;
    }

    if (changedType === KeysChangedType.Equal) return KeysChangedType.Equal;

    // 如果没有值，这个时候要触发一次触底
    if (!data.length && this.initialNumToRender) {
      this.onEndReachedHelper.onEndReachedHandler({
        distanceFromEnd: 0,
      });
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
      this.updateScrollMetrics(this._scrollMetrics, false);
    }

    return changedType;
  }

  setOnEndReached(onEndReached: OnEndReached) {
    this.onEndReachedHelper.setHandler(onEndReached);
  }

  _setData(data: Array<ItemT>) {
    if (data === this._data) return KeysChangedType.Equal;
    const keyToIndexMap: Map<string, number> = new Map();
    const keyToIndexArray: Array<string> = [];
    const itemToKeyMap: Map<ItemT, string> = new Map();
    // TODO: optimization
    data.forEach((item, index) => {
      let itemKey = this.getItemKey(item, index);
      const _index = keyToIndexArray.findIndex((key) => key === itemKey);

      if (_index !== -1 && _index !== index) {
        itemKey = `${itemKey}_${index}`;
        keyToIndexArray.push(itemKey);
        keyToIndexMap.set(itemKey, index);
      } else {
        keyToIndexMap.set(itemKey, index);
        keyToIndexArray.push(itemKey);
      }

      itemToKeyMap.set(item, itemKey);
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
    data: Array<ItemT>,
    baseIndex = 0,
    keyToMetaMap: Map<string, ItemMeta>,
    intervalTree: PrefixIntervalTree
  ) {
    const len = data.length;
    let updateIntervalTree = true;
    for (let index = 0; index < len; index++) {
      const item = data[index];
      const currentIndex = index + baseIndex;
      const itemKey = this.getItemKey(item, currentIndex);
      const meta =
        this.getKeyMeta(itemKey) ||
        this.createItemMeta(itemKey, data, currentIndex);

      if (meta.getLayout() && updateIntervalTree) {
        const itemLength = this._selectValue.selectLength(meta.getLayout());
        const separatorLength = meta.getSeparatorLength();
        const length =
          currentIndex === len - 1 ? itemLength : itemLength + separatorLength;
        intervalTree.set(currentIndex, length);
      } else {
        updateIntervalTree = false;
      }

      keyToMetaMap.set(itemKey, meta);
    }
  }

  append(data: Array<ItemT>) {
    const baseIndex = this._indexKeys.length;
    const appended = data.slice(baseIndex);
    this.pump(appended, baseIndex, this._keyToMetaMap, this.intervalTree);
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
    const item = this._data[index];
    const meta = this.getItemMeta(item, index);

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

  setState(state: ListState<ItemT>, force = false) {
    if (this.fillingMode === FillingMode.SPACE) {
      const stateResult = force
        ? this.resolveSpaceState(state)
        : this.memoizedResolveSpaceState(state);
      if (typeof this._stateListener === 'function') {
        this._stateListener(stateResult, this._stateResult);
      }
      this._stateResult = stateResult;
    } else if (this.fillingMode === FillingMode.RECYCLE) {
      const stateResult = force
        ? this.resolveRecycleState(state)
        : this.memoizedResolveRecycleState(state);
      if (typeof this._stateListener === 'function') {
        this._stateListener(stateResult, this._stateResult);
      }
      this._stateResult = stateResult;
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
      ...options,
    };
  }

  hydrateSpaceStateToken(
    spaceStateResult: Array<SpaceStateToken<ItemT>>,
    item: ItemT,
    index: number,
    position: SpaceStateTokenPosition
  ) {
    const itemMeta = this.getItemMeta(item, index);
    const { index: currentIndex } = itemMeta.getIndexInfo();
    const lastTokenIndex = spaceStateResult.length - 1;
    const lastToken = spaceStateResult[lastTokenIndex];
    const itemKey = itemMeta.getKey();
    const itemLayout = itemMeta?.getLayout();
    const isSticky = this.stickyHeaderIndices.indexOf(index) !== -1;
    const isSpace =
      !isSticky &&
      position !== 'buffered' &&
      this.persistanceIndices.indexOf(currentIndex) === -1;
    const itemLength =
      (itemLayout?.height || 0) + (itemMeta?.getSeparatorLength() || 0);

    if (!isSticky && isSpace && lastToken && lastToken.isSpace) {
      const key = `${lastToken.key}_${itemKey}`;
      spaceStateResult[lastTokenIndex] = {
        ...lastToken,
        item: null,
        key,
        length: lastToken.length + itemLength,
      };
    } else {
      const token = this.createSpaceStateToken({
        key: itemKey,
        length: itemLength,
        isSpace,
        isSticky,
        item,
        position,
      });
      spaceStateResult.push(token);
    }
  }

  getPosition(rowIndex: number, startIndex: number, endIndex: number) {
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

  resolveRecycleState(state: ListState<ItemT>) {
    const {
      visibleEndIndex,
      bufferedEndIndex,
      visibleStartIndex,
      bufferedStartIndex,
      // actionType,
      data,
    } = state;

    const targetIndices = this._bufferSet.indices.map((i) => parseInt(i));

    // const scrolling = actionType === 'scrollDown' || actionType === 'scrollUp';
    // const originalPositionSize = this._bufferSet.getSize();

    const recycleEnabled = this._recycleEnabled();

    if (visibleEndIndex >= 0) {
      for (let index = visibleStartIndex; index <= visibleEndIndex; index++) {
        const position = this.getPosition(
          index,
          visibleStartIndex,
          visibleEndIndex
        );
        if (position !== null) targetIndices[position] = index;
      }
    }

    const visibleSize = Math.max(visibleEndIndex - visibleStartIndex + 1, 0);
    const beforeSize = Math.floor((this.recycleThreshold - visibleSize) / 2);
    const afterSize = this.recycleThreshold - visibleSize - beforeSize;

    for (
      let index = visibleStartIndex, size = beforeSize;
      size > 0 && index >= 0;
      size--, index--
    ) {
      const position = this.getPosition(
        index,
        bufferedStartIndex,
        visibleStartIndex
      );
      if (position !== null) targetIndices[position] = index;
    }

    for (
      let index = visibleEndIndex + 1, size = afterSize;
      size > 0 && index <= bufferedEndIndex;
      size--, index++
    ) {
      const position = this.getPosition(
        index,
        visibleEndIndex + 1,
        bufferedEndIndex
      );
      if (position !== null) targetIndices[position] = index;
    }

    const recycleStateResult = [];

    if (recycleEnabled) {
      const indexToOffsetMap = {};
      const minValue = this._bufferSet.getMinValue();
      const maxValue = this._bufferSet.getMaxValue();
      let startOffset = this.getIndexKeyOffset(minValue, true);

      for (let index = minValue; index <= maxValue; index++) {
        indexToOffsetMap[index] = startOffset;
        const item = data[index];
        const itemMeta = this.getItemMeta(item, index);
        startOffset +=
          (itemMeta?.getLayout()?.height || 0) +
          (itemMeta?.getSeparatorLength() || 0);
      }

      targetIndices.forEach((targetIndex, index) => {
        const item = data[targetIndex];
        if (!item) return;

        const itemKey = this.getItemKey(item, targetIndex);
        const itemMeta = this.getItemMeta(item, targetIndex);

        const itemLayout = itemMeta?.getLayout();
        const itemLength =
          (itemLayout?.height || 0) + (itemMeta?.getSeparatorLength() || 0);
        recycleStateResult.push({
          key: `recycle_${index}`,
          targetKey: itemKey,
          length: itemLength,
          isSpace: false,
          isSticky: false,
          item,
          offset: itemLayout ? indexToOffsetMap[targetIndex] : 0,
          position: 'buffered',
        });
      });
    }

    let spaceStateResult = [];

    // 滚动中
    if (recycleEnabled) {
      spaceStateResult.push({
        key: `spacer_${this.getTotalLength()}`,
        length: this.getTotalLength(),
        isSpace: true,
        isSticky: false,
        item: null,
        position: 'buffered',
      });
    } else {
      if (recycleEnabled) {
        if (visibleStartIndex > 0) {
          spaceStateResult.push({
            key: 'spacer_before',
            length: this.getIndexKeyOffset(visibleStartIndex, true),
            isSpace: true,
            isSticky: false,
            item: null,
            position: 'buffered',
          });
        }

        for (let index = visibleStartIndex; index <= visibleEndIndex; index++) {
          const item = data[index];
          if (item)
            this.hydrateSpaceStateToken(
              spaceStateResult,
              item,
              index,
              'buffered'
            );
        }

        if (
          visibleEndIndex < data.length - 1 &&
          typeof this.getTotalLength() === 'number'
        ) {
          spaceStateResult.push({
            key: 'spacer_after',
            length:
              (this.getTotalLength() as number) -
              this.getIndexKeyOffset(visibleEndIndex + 1, true),
            isSpace: true,
            isSticky: false,
            item: null,
            position: 'buffered',
          });
        }
      } else {
        spaceStateResult = this.resolveSpaceState(state);
      }
    }

    const stateResult = {
      recycleState: recycleStateResult,
      spaceState: spaceStateResult,
    };

    return stateResult;
  }

  resolveSpaceState(state: ListState<ItemT>) {
    const { data, bufferedEndIndex, bufferedStartIndex } = state;
    const afterStartIndex = bufferedEndIndex + 1;
    const beforeData = data.slice(0, bufferedStartIndex);
    const afterData = data.slice(afterStartIndex);
    const remainingData = data.slice(bufferedStartIndex, bufferedEndIndex + 1);

    const spaceStateResult = [] as Array<SpaceStateToken<ItemT>>;

    beforeData.forEach((item, index) =>
      this.hydrateSpaceStateToken(spaceStateResult, item, index, 'before')
    );

    remainingData.forEach((item, _index) => {
      const index = bufferedStartIndex + _index;
      this.hydrateSpaceStateToken(spaceStateResult, item, index, 'buffered');
    });

    afterData.forEach((item, _index) => {
      const index = afterStartIndex + _index;
      this.hydrateSpaceStateToken(spaceStateResult, item, index, 'after');
    });

    return spaceStateResult;
  }

  updateState(
    newState: PreStateResult,
    scrollMetrics: ScrollMetrics,
    performItemsMetaChange = true
  ) {
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

      if (performItemsMetaChange) {
        const bufferedItems = this._data.slice(
          nextBufferedStartIndex,
          nextBufferedEndIndex + 1
        );

        const bufferedItemsMeta = bufferedItems
          .map((item, index) =>
            this.getItemMeta(item, nextBufferedStartIndex + index)
          )
          .filter((v) => v);

        this._onUpdateItemsMetaChangeBatchinator.schedule(
          bufferedItemsMeta,
          scrollMetrics
        );
      }
    }
  }

  dispatchMetrics(scrollMetrics: ScrollMetrics) {
    const state = this._store.dispatchMetrics({
      dimension: this,
      scrollMetrics,
    });
    if (!isNotEmpty(state)) return;
    this.updateState(state, scrollMetrics);
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
      this.updateState(this._state, scrollMetrics, false);
    }

    this._scrollMetrics = scrollMetrics;
  }
}

export default ListDimensions;
