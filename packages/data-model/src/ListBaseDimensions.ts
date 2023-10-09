import noop from '@x-oasis/noop';
import Batchinator from '@x-oasis/batchinator';
import omit from '@x-oasis/omit';
import {
  selectHorizontalValue,
  selectVerticalValue,
} from '@x-oasis/select-value';
import resolveChanged from '@x-oasis/resolve-changed';
import isClamped from '@x-oasis/is-clamped';
import defaultBooleanValue from '@x-oasis/default-boolean-value';
import Recycler from '@x-oasis/recycler';
import memoizeOne from 'memoize-one';

import {
  isEmpty,
  shallowDiffers,
  INITIAL_NUM_TO_RENDER,
  buildStateTokenIndexKey,
  DISPATCH_METRICS_THRESHOLD,
  DEFAULT_ITEM_APPROXIMATE_LENGTH,
  DEFAULT_RECYCLER_TYPE,
} from './common';
import manager from './manager';
import createStore from './state/createStore';
import { ActionType, ReducerResult, Store } from './state/types';
import {
  SpaceStateToken,
  GetItemLayout,
  GetItemSeparatorLength,
  ListBaseDimensionsProps,
  ListRenderState,
  ListState,
  OnRecyclerProcess,
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
import StillnessHelper from './utils/StillnessHelper';
import ViewabilityConfigTuples from './viewable/ViewabilityConfigTuples';
import BaseLayout from './BaseLayout';
import ListGroupDimensions from './ListGroupDimensions';

/**
 * item should be first class data model; item's value reference change will
 * cause recalculation of item key. However, if key is not changed, its itemMeta
 * will not change.
 */
class ListBaseDimensions<ItemT extends {} = {}> extends BaseLayout {
  // public _selectValue: SelectValue;
  private _getItemLayout: GetItemLayout<ItemT>;
  private _getItemSeparatorLength: GetItemSeparatorLength<ItemT>;
  private _stateListener: StateListener<ItemT>;

  private _state: ListState<ItemT>;
  private _stateResult: ListStateResult<ItemT>;

  private _listGroupDimension: ListGroupDimensions;

  private _dispatchMetricsBatchinator: Batchinator;

  private _store: Store<ReducerResult>;

  readonly onEndReachedHelper: OnEndReachedHelper;

  private _scrollMetrics: ScrollMetrics;

  private _isActive = true;

  private _renderState: ListRenderState;
  private _renderStateListeners: Array<Function> = [];
  private _renderStateListenersCleaner: Array<Function> = [];

  private _deps: Array<string>;

  public updateStateBatchinator: Batchinator;

  private _recalculateRecycleResultStateBatchinator: Batchinator;

  private _selector = new EnabledSelector({
    onEnabled: this.onEnableDispatchScrollMetrics.bind(this),
  });

  private _offsetTriggerCachedState = 0;

  private _onRecyclerProcess: OnRecyclerProcess;

  private _stillnessHelper: StillnessHelper;
  private _recycler: Recycler;

  _configTuple: ViewabilityConfigTuples;

  private memoizedResolveSpaceState: (
    state: ListState<ItemT>
  ) => SpaceStateResult<ItemT>;
  private memoizedResolveRecycleState: (
    state: ListState<ItemT>
  ) => RecycleStateResult<ItemT>;

  private _itemApproximateLength: number;
  private _approximateMode: boolean;
  private _getData: { (): any };
  /**
   *
   */
  private _provider: ListGroupDimensions;

  private _releaseSpaceStateItem: boolean;

  constructor(props: ListBaseDimensionsProps<ItemT>) {
    super(props);
    const {
      store,
      getData,
      horizontal,

      provider,
      initialNumToRender = INITIAL_NUM_TO_RENDER,

      recyclerBufferSize,
      recyclerReservedBufferPerBatch,

      viewabilityConfig,
      onViewableItemsChanged,
      viewabilityConfigCallbackPairs,

      recycleEnabled,
      recyclerTypes,
      deps = [],
      getItemLayout,
      onEndReached,
      active = true,
      listGroupDimension,
      onEndReachedThreshold,
      getItemSeparatorLength,
      dispatchMetricsThreshold = DISPATCH_METRICS_THRESHOLD,

      useItemApproximateLength,
      itemApproximateLength = DEFAULT_ITEM_APPROXIMATE_LENGTH,

      onRecyclerProcess,

      stillnessThreshold,
      onEndReachedTimeoutThreshold,
      distanceFromEndThresholdValue,
      onEndReachedHandlerTimeoutThreshold,

      releaseSpaceStateItem = false,

      maxCountOfHandleOnEndReachedAfterStillness,
    } = props;
    this._provider = provider;
    this._itemApproximateLength = itemApproximateLength || 0;
    this._getItemLayout = getItemLayout;
    this._getData = getData;
    this._onRecyclerProcess = onRecyclerProcess;
    this._releaseSpaceStateItem = releaseSpaceStateItem;

    // `_approximateMode` is enabled on default
    this._approximateMode = recycleEnabled
      ? defaultBooleanValue(
          useItemApproximateLength,
          typeof this._getItemLayout !== 'function' ||
            !this._itemApproximateLength
        )
      : false;
    this._getItemSeparatorLength = getItemSeparatorLength;
    // for ListItem include a basic items condition
    // this._parentItemsDimensions = parentItemsDimensions;
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

    this._selectValue = horizontal
      ? selectHorizontalValue
      : selectVerticalValue;

    this._configTuple = new ViewabilityConfigTuples({
      viewabilityConfig,
      onViewableItemsChanged,
      viewabilityConfigCallbackPairs,
      isListItem: true,
    });

    this.stillnessHandler = this.stillnessHandler.bind(this);
    this._stillnessHelper = new StillnessHelper({
      stillnessThreshold,
      handler: this.stillnessHandler,
    });

    this._deps = deps;
    this._isActive = this.resolveInitialActiveValue(active);
    this.initialNumToRender = initialNumToRender;

    this._recycler = new Recycler({
      recyclerTypes,
      recyclerBufferSize,
      thresholdIndexValue: initialNumToRender,
      recyclerReservedBufferPerBatch,
      metaExtractor: (index) => this.getFinalIndexItemMeta(index),
      indexExtractor: (meta) => {
        const indexInfo = meta.getIndexInfo();
        return indexInfo?.indexInGroup;
      },
      getType: (index) => this.getFinalIndexItemMeta(index)?.recyclerType,
    });

    this.memoizedResolveSpaceState = memoizeOne(
      this.resolveSpaceState.bind(this)
    );
    this.memoizedResolveRecycleState = memoizeOne(
      this.resolveRecycleState.bind(this)
    );

    // @ts-ignore
    this._state = this.resolveInitialState();

    this._stateResult =
      this.fillingMode === FillingMode.RECYCLE
        ? this.memoizedResolveRecycleState(this._state)
        : this.memoizedResolveSpaceState(this._state);

    this._store = createStore<ReducerResult>() || store;

    this.attemptToHandleEndReached();

    // 比如刚开始就有值，并且给了`getItemLayout`的话，需要手动更新Parent中的layout
    // this.hydrateParentIntervalTree();

    /**
     * 0911 temp ignore
     */
    // this._removeList = this._listGroupDimension ? noop : manager.addList(this);
    this.updateStateBatchinator = new Batchinator(
      this.updateState.bind(this),
      50
    );
    this._recalculateRecycleResultStateBatchinator = new Batchinator(
      this.recalculateRecycleResultState.bind(this),
      50
    );

    this.initializeDefaultRecycleBuffer();
  }

  initializeDefaultRecycleBuffer() {
    this._recycler.addBuffer(DEFAULT_RECYCLER_TYPE);
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

  get state() {
    return this._state;
  }

  addBuffer(recyclerType: string) {
    return this._recycler.addBuffer(recyclerType);
  }

  cleanup() {
    // this._removeList?.();
    this._renderStateListeners = [];
  }

  resolveInitialActiveValue(active: boolean) {
    if (this._deps.length) {
      const isActive = true;
      for (let index = 0; index < this._deps.length; index++) {
        const listKey = this._deps[index];
        const listHandler = manager.getKeyList(listKey);
        if (!listHandler) continue;
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

  addOnEndReached(onEndReached: OnEndReached) {
    return this.onEndReachedHelper.addHandler(onEndReached);
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

  /**
   *
   * @returns TODO: temp
   */
  getContainerOffset(): number {
    return this._provider.getContainerOffset();
    // return 0;
    // if (this._listGroupDimension) {
    //   return (
    //     this._listGroupDimension.getContainerOffset() + this._offsetInListGroup
    //   );
    // }
    // const layout = this.getContainerLayout();
    // if (!layout) return 0;
    // return this._selectValue.selectOffset(layout);
  }

  get _data() {
    return this._provider.getData();
  }

  getData() {
    return this._provider.getData();
  }

  getDataLength() {
    return this._provider.getDataLength();
  }

  getTotalLength() {
    return this._provider.getTotalLength();
  }

  getReflowItemsLength() {
    return this._provider.getReflowItemsLength();
  }
  getFinalItemKey(item: any) {
    return this._provider.getFinalItemKey(item);
  }

  getFinalIndexItemMeta(index: number) {
    return this._provider.getFinalIndexItemMeta(index);
  }

  getFinalItemMeta(item: any) {
    return this._provider.getFinalItemMeta(item);
  }

  getFinalIndexItemLength(index: number) {
    return this._provider.getFinalIndexItemLength(index);
  }

  getFinalIndexKeyOffset(index: number) {
    return this._provider.getFinalIndexKeyOffset(index);
  }

  getFinalIndexKeyBottomOffset(index: number) {
    return this._provider.getFinalIndexKeyBottomOffset(index);
  }

  hasUnLayoutItems() {
    return this.getReflowItemsLength() < this._data.length;
  }

  computeIndexRange(minOffset: number, maxOffset: number) {
    return this._provider.computeIndexRange(minOffset, maxOffset);
  }

  _recycleEnabled() {
    if (this.fillingMode !== FillingMode.RECYCLE) return false;
    return this.getReflowItemsLength() >= this.initialNumToRender;
  }

  recalculateRecycleResultState() {
    this.setState(this._state, true);
  }

  notifyRenderFinished() {
    this.setRenderStateFinished();
    this._renderStateListeners.forEach((listener) => listener());
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

  attemptToHandleEndReached() {
    if (!this._listGroupDimension) {
      if (this.initialNumToRender)
        this.onEndReachedHelper.attemptToHandleOnEndReachedBatchinator.schedule();
    }
  }

  setOnEndReached(onEndReached: OnEndReached) {
    this.onEndReachedHelper.setHandler(onEndReached);
  }

  resetViewableItems() {
    if (this._scrollMetrics) this.dispatchMetrics(this._scrollMetrics);
  }

  addStateListener(listener: StateListener<ItemT>) {
    if (typeof listener === 'function') this._stateListener = listener;
    return () => {
      if (typeof listener === 'function') this._stateListener = null;
    };
  }

  applyStateResult(stateResult: ListStateResult<ItemT>) {
    const shouldStateUpdate = true;

    // if (!this._stateResult && stateResult) {
    //   shouldStateUpdate = true;
    // } else if (this.fillingMode === FillingMode.SPACE) {
    //   shouldStateUpdate = !shallowEqual(stateResult, this._stateResult);
    // } else if (this.fillingMode === FillingMode.RECYCLE) {
    //   const _stateResult = stateResult as RecycleStateResult<ItemT>;
    //   const _oldStateResult = this._stateResult as RecycleStateResult<ItemT>;

    //   const newRecycleState = [];
    //   const oldRecycleState = [];

    //   let maxIndex = 0;

    //   for (let index = 0; index < _stateResult.recycleState.length; index++) {
    //     // @ts-ignore
    //     const { itemMeta, targetIndex } = _stateResult.recycleState[index];
    //     if (!itemMeta || (itemMeta && itemMeta.getState().viewable)) {
    //       newRecycleState.push(_stateResult.recycleState[index]);
    //       oldRecycleState.push(_oldStateResult.recycleState[index]);
    //       maxIndex = Math.max(targetIndex, index);
    //     } else {
    //       newRecycleState.push(null);
    //       oldRecycleState.push(null);
    //     }
    //   }

    //   let exists = true;

    //   // To fix onEndReached condition, data is updated. it will not trigger update issue.
    //   if (isClamped(0, maxIndex + 1, this._data.length - 1)) {
    //     exists =
    //       _oldStateResult.recycleState.findIndex(
    //         (s) => s?.targetIndex === maxIndex + 1
    //       ) !== -1;
    //   }

    //   shouldStateUpdate =
    //     !(
    //       shallowArrayEqual(newRecycleState, oldRecycleState, shallowEqual) &&
    //       shallowArrayEqual(
    //         _stateResult.spaceState,
    //         _oldStateResult.spaceState,
    //         shallowEqual
    //       )
    //     ) || !exists;
    // }

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

        if (
          (this._stateResult as RecycleStateResult<ItemT>).recycleState
            .length &&
          !recycleState.length
        ) {
          this._recycler.reset();
        }

        this._stateListener(
          {
            recycleState,
            spaceState,
            // @ts-ignore
            rangeState: stateResult.rangeState,
          },
          this._stateResult
        );
      } else {
        this._stateListener(stateResult, this._stateResult);
      }
    }

    this._stateResult = {
      ...stateResult,
      // @ts-ignore
      rangeState: stateResult.rangeState,
    };
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
  getFinalIndexRangeOffsetMap(
    startIndex: number,
    endIndex: number,
    exclusive?: boolean
  ) {
    return this._provider.getFinalIndexRangeOffsetMap(
      startIndex,
      endIndex,
      exclusive
    );
  }

  recognizeLengthBeforeLayout() {
    return this._getItemLayout || this._approximateMode;
  }

  resolveSafeRange(props: {
    visibleStartIndex: number;
    visibleEndIndex: number;
  }) {
    const { visibleStartIndex, visibleEndIndex } = props;

    return {
      startIndex: visibleStartIndex,
      // endIndex: Math.min(
      //   visibleEndIndex,
      //   visibleStartIndex + this.recycleThreshold - 1
      // ),
      endIndex: visibleEndIndex,
    };
  }

  resolveSiblingOffset(props: {
    startIndex: number;
    step: number;
    max: number;
    itemLength: number;
    offsetMap: {
      [key: number]: number;
    };
  }) {
    const { startIndex, step = -1, max = 1, offsetMap, itemLength } = props;
    let siblingLength = 0;
    for (let idx = 0; idx < max; idx++) {
      const index = startIndex + step * idx;
      const meta = this.getFinalIndexItemMeta(index);
      const layout = meta?.getLayout();
      const length = (layout?.height || 0) + (meta?.getSeparatorLength() || 0);
      if (meta && !meta?.isApproximateLayout) {
        const offset =
          offsetMap[index] != null
            ? offsetMap[index]
            : this.getFinalIndexKeyOffset(index) || 0;
        return (
          offset +
          siblingLength * (step > 0 ? -1 : 1) +
          length * (step > 0 ? 0 : 1) -
          itemLength * (step > 0 ? 1 : 0)
        );
      }

      siblingLength += length;
    }
    return this.itemOffsetBeforeLayoutReady;
  }

  resolveRecycleItemLayout(info, indexToOffsetMap) {
    const { meta: itemMeta, targetIndex } = info;
    const itemLayout = itemMeta?.getLayout();
    const itemLength =
      (itemLayout?.height || 0) + (itemMeta?.getSeparatorLength() || 0);

    if (
      !itemMeta.isApproximateLayout &&
      indexToOffsetMap[targetIndex] != null
    ) {
      return {
        offset: indexToOffsetMap[targetIndex],
        length: itemLength,
      };
    }

    let offset = this.resolveSiblingOffset({
      itemLength,
      offsetMap: indexToOffsetMap,
      startIndex: targetIndex - 1,
      step: -1,
      max: 3,
    });

    if (offset === this.itemOffsetBeforeLayoutReady) {
      offset = this.resolveSiblingOffset({
        itemLength,
        offsetMap: indexToOffsetMap,
        startIndex: targetIndex + 1,
        step: 1,
        max: 3,
      });
    }

    return { offset, length: itemLength };
  }

  resolveRecycleRecycleState(state: ListState<ItemT>) {
    const { visibleEndIndex, visibleStartIndex: _visibleStartIndex } = state;
    const recycleStateResult = [];
    const velocity = this._scrollMetrics?.velocity || 0;

    const visibleStartIndex = Math.max(
      _visibleStartIndex,
      this._recycler.thresholdIndexValue
    );

    const safeRange = this.resolveSafeRange({
      visibleStartIndex,
      visibleEndIndex,
    });

    const recycleBufferedCount = this._recycler.recyclerReservedBufferPerBatch;

    if (Math.abs(velocity) <= 1) {
      const startIndex = Math.max(
        visibleStartIndex - Math.ceil(recycleBufferedCount / 2),
        this._recycler.thresholdIndexValue
      );
      this._recycler.updateIndices({
        safeRange,
        startIndex,
        maxCount: 10,
        step: 1,
        onProcess: this._onRecyclerProcess,
        /** TODO !!!!!! */
        // maxIndex: this.getData().length,
      });
    } else if (velocity > 0) {
      // iOS scroll up velocity > 0
      this._recycler.updateIndices({
        safeRange,
        startIndex: visibleStartIndex,
        maxCount: 10,
        step: 1,
        onProcess: this._onRecyclerProcess,

        /** TODO */
        // maxIndex: this.getData().length,
      });
    } else {
      this._recycler.updateIndices({
        safeRange,
        startIndex: visibleEndIndex,
        maxCount: 10,
        step: -1,
        onProcess: this._onRecyclerProcess,
        /** TODO */
        // maxIndex: this.getData().length,
      });
    }

    const minValue = this._recycler.getMinValue();
    const maxValue = this._recycler.getMaxValue();

    // maybe should split by recyclerType
    const indexToOffsetMap = this.getFinalIndexRangeOffsetMap(
      minValue,
      maxValue,
      true
    );
    const targetIndices = this._recycler.getIndices();

    targetIndices
      .filter((v) => v)
      .forEach((info) => {
        const { meta: itemMeta, targetIndex, recyclerKey } = info;
        const item = this.getData()[targetIndex];

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
                () =>
                  indexToOffsetMap[targetIndex] == null
                    ? this.itemOffsetBeforeLayoutReady
                    : indexToOffsetMap[targetIndex] + this.getContainerOffset()
              );

        itemMeta?.setItemMetaState(itemMetaState);

        recycleStateResult.push({
          key: recyclerKey,
          targetKey: itemMeta.getKey(),
          targetIndex,
          isSpace: false,
          isSticky: false,
          item,
          itemMeta,

          /**
           * itemMeta should get from parent
           */
          viewable: itemMeta.getState().viewable,
          // 如果没有offset，说明item是新增的，那么它渲染就在最开始位置好了
          position: 'buffered',
          ...this.resolveRecycleItemLayout(info, indexToOffsetMap),
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
      rangeState: state,
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
          lastToken.isSpace = !isSticky && !isReserved;
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
    if (!this._releaseSpaceStateItem) {
      const nextData = this._data.slice(0, this.initialNumToRender);
      const spaceState = [];
      for (let index = 0; index < nextData.length; index++) {
        const item = this._data[index];
        const itemMeta = this.getFinalItemMeta(item);
        if (itemMeta)
          spaceState.push({
            item,
            isSpace: false,
            itemMeta,
            key: itemMeta.getKey(),
            isSticky: false,
            isReserved: true,
            length: this.getFinalIndexItemLength(index),
          });
      }
      const afterTokens = this.resolveToken(
        this.initialNumToRender,
        this._data.length - 1
      );

      afterTokens.forEach((token) => {
        const { isSticky, isReserved, startIndex, endIndex } = token;
        if (isSticky || isReserved) {
          const item = this._data[startIndex];
          const itemMeta = this.getFinalItemMeta(item);
          spaceState.push({
            item,
            isSpace: false,
            key: itemMeta.getKey(),
            itemMeta,
            isSticky,
            isReserved,
            length: this.getFinalIndexItemLength(startIndex),
          });
        } else {
          const startIndexOffset = this.getFinalIndexKeyOffset(startIndex);
          // should plus 1, use list total length
          const endIndexOffset = this.getFinalIndexKeyBottomOffset(endIndex);
          spaceState.push({
            item: null,
            isSpace: true,
            isSticky: false,
            isReserved: false,
            length: endIndexOffset - startIndexOffset,
            // endIndex is not included
            itemMeta: null,
            key: buildStateTokenIndexKey(startIndex, endIndex - 1),
          });
        }
      });
      return spaceState;
    }

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
        const itemMeta = this.getFinalItemMeta(item);

        spaceState.push({
          item,
          itemMeta,
          key: itemMeta.getKey(),
          isSpace: false,
          isSticky,
          length: this.getFinalIndexItemLength(startIndex),
          isReserved,
        });
      } else {
        const startIndexOffset = this.getFinalIndexKeyOffset(startIndex);
        const endIndexOffset = this.getFinalIndexKeyOffset(endIndex);
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

    const indexToOffsetMap = this.getFinalIndexRangeOffsetMap(
      bufferedStartIndex,
      bufferedEndIndex
    );

    remainingData.forEach((item, _index) => {
      const index = bufferedStartIndex + _index;
      const itemMeta = this.getFinalItemMeta(item);
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
        itemMeta,
        isSpace: false,
        isSticky,
        isReserved,
        length: itemLength,
      });
    });

    const afterTokens = this.resolveToken(nextEnd, data.length - 1);

    afterTokens.forEach((token) => {
      const { isSticky, isReserved, startIndex, endIndex } = token;
      if (isSticky || isReserved) {
        const item = this._data[startIndex];
        const itemMeta = this.getFinalItemMeta(item);
        spaceState.push({
          item,
          isSpace: false,
          key: itemMeta.getKey(),
          itemMeta,
          isSticky,
          isReserved,
          length: this.getFinalIndexItemLength(startIndex),
        });
      } else {
        const startIndexOffset = this.getFinalIndexKeyOffset(startIndex);
        const endIndexOffset = this.getFinalIndexKeyBottomOffset(endIndex);
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
    // const {
    //   bufferedStartIndex: nextBufferedStartIndex,
    //   bufferedEndIndex: nextBufferedEndIndex,
    // } = newState;

    const omitKeys = ['data', 'distanceFromEnd', 'isEndReached'];
    // const nextDataLength = Math.max(
    //   nextBufferedEndIndex + 1,
    //   this.getReflowItemsLength()
    // );

    const oldData = this._state.data;
    const newData = this._data;

    const shouldSetState =
      shallowDiffers(
        omit(this._state || {}, omitKeys),
        omit(newState, omitKeys)
      ) || !resolveChanged(oldData, newData).isEqual;

    if (shouldSetState) {
      const state = {
        ...newState,
        data: newData,
      };

      // @ts-ignore
      this.setState(state);
      // @ts-ignore
      this._state = state;
      this._offsetTriggerCachedState = scrollMetrics.offset;
    }
  }

  dispatchStoreMetrics(scrollMetrics: ScrollMetrics) {
    const state = this._store.dispatchMetrics({
      // @ts-ignore
      dimension: this,
      scrollMetrics,
    });
    if (isEmpty(state)) return state;
    this.setState({
      ...state,
      // @ts-ignore
      data: this.getData(),
    });

    // maybe itemMeta approximateLayout change, but will not trigger update...
    // this.updateState(state, scrollMetrics);

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

  updateScrollMetrics(
    _scrollMetrics?: ScrollMetrics,
    _options?: {
      useCache?: boolean;
      flush?: boolean;
    }
  ) {
    const scrollMetrics = _scrollMetrics || this._scrollMetrics;
    const flush = defaultBooleanValue(_options?.flush, false);

    if (!scrollMetrics) return;
    if (!this.dispatchScrollMetricsEnabled()) {
      this._scrollMetrics = scrollMetrics;
      return;
    }

    this._scrollMetrics = scrollMetrics;
    if (flush) {
      this._dispatchMetricsBatchinator.flush(scrollMetrics);
    } else {
      this._dispatchMetricsBatchinator.schedule(scrollMetrics);
    }

    return;
  }
}

export default ListBaseDimensions;
