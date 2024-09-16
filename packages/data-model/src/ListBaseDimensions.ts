import Batchinator from '@x-oasis/batchinator';
import isClamped from '@x-oasis/is-clamped';
import defaultBooleanValue from '@x-oasis/default-boolean-value';
import Recycler, { OnRecyclerProcess } from '@x-oasis/recycler';
import memoizeOne from 'memoize-one';

import {
  isEmpty,
  buildStateTokenIndexKey,
  DISPATCH_METRICS_THRESHOLD,
  DEFAULT_RECYCLER_TYPE,
} from './common';
import { ActionType } from './state/types';
import {
  SpaceStateToken,
  ListBaseDimensionsProps,
  ListState,
  OnEndReached,
  ScrollMetrics,
  StateListener,
  ListStateResult,
  SpaceStateTokenPosition,
  FillingMode,
  RecycleStateResult,
  ItemLayout,
  SpaceStateResult,
  ListBaseDimensionsStore,
} from './types';
import ListSpyUtils from './utils/ListSpyUtils';
import OnEndReachedHelper from './viewable/OnEndReachedHelper';
import EnabledSelector from './utils/EnabledSelector';
import StillnessHelper from './utils/StillnessHelper';
import ViewabilityConfigTuples from './viewable/ViewabilityConfigTuples';
import BaseLayout from './BaseLayout';
// import createStore from './state/createStore';
// import { ReducerResult } from './state/types';

/**
 * item should be first class data model; item's value reference change will
 * cause recalculation of item key. However, if key is not changed, its itemMeta
 * will not change.
 */
abstract class ListBaseDimensions<ItemT extends {} = {}> extends BaseLayout {
  private _stateListener: StateListener<ItemT>;

  private _state: ListState<ItemT>;
  private _stateResult: ListStateResult<ItemT>;

  private _dispatchMetricsBatchinator: Batchinator;

  private _store: ListBaseDimensionsStore;

  readonly onEndReachedHelper: OnEndReachedHelper;

  public _scrollMetrics: ScrollMetrics;

  private _recalculateRecycleResultStateBatchinator: Batchinator;

  private _selector = new EnabledSelector({
    onEnabled: this.onEnableDispatchScrollMetrics.bind(this),
  });

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

  private _releaseSpaceStateItem: boolean;

  constructor(props: ListBaseDimensionsProps) {
    super(props);
    const {
      store,
      recyclerTypes,
      recyclerBufferSize,
      recyclerReservedBufferPerBatch,

      viewabilityConfig,
      onViewableItemsChanged,
      viewabilityConfigCallbackPairs,

      dispatchMetricsThreshold = DISPATCH_METRICS_THRESHOLD,

      onRecyclerProcess,
      stillnessThreshold,

      onEndReached,
      onEndReachedThreshold,
      onEndReachedTimeoutThreshold,
      distanceFromEndThresholdValue,
      onEndReachedHandlerTimeoutThreshold,

      releaseSpaceStateItem = false,

      maxCountOfHandleOnEndReachedAfterStillness,
    } = props;
    // this._store = createStore();
    this._store = store || createStore()

    this._onRecyclerProcess = onRecyclerProcess;
    this._releaseSpaceStateItem = releaseSpaceStateItem;
    this.stillnessHandler = this.stillnessHandler.bind(this);


    this.onEndReachedHelper = new OnEndReachedHelper({
      id: this.id,
      onEndReached,
      onEndReachedThreshold,
      onEndReachedTimeoutThreshold,
      distanceFromEndThresholdValue,
      onEndReachedHandlerTimeoutThreshold,
      maxCountOfHandleOnEndReachedAfterStillness,
    });

    this._configTuple = new ViewabilityConfigTuples({
      viewabilityConfig,
      onViewableItemsChanged,
      viewabilityConfigCallbackPairs,
      isListItem: true,
    });

    this._stillnessHelper = new StillnessHelper({
      stillnessThreshold,
      handler: this.stillnessHandler,
    });

    this._recycler = new Recycler({
      recyclerTypes,
      recyclerBufferSize,
      thresholdIndexValue: this.initialNumToRender,
      recyclerReservedBufferPerBatch,
      metaExtractor: (index) => this.getFinalIndexItemMeta(index),
      indexExtractor: (meta) => {
        const indexInfo = meta.getIndexInfo();
        return indexInfo?.indexInGroup;
      },
      getMetaType: (meta) => meta.recyclerType,
      getType: (index) => this.getFinalIndexItemMeta(index)?.recyclerType,
    });
    this.initializeDefaultRecycleBuffer();

    this.memoizedResolveSpaceState = memoizeOne(
      this.resolveSpaceState.bind(this)
    );
    this.memoizedResolveRecycleState = memoizeOne(
      this.resolveRecycleState.bind(this)
    );

    this._dispatchMetricsBatchinator = new Batchinator(
      this.dispatchMetrics.bind(this),
      dispatchMetricsThreshold
    );

    this._recalculateRecycleResultStateBatchinator =
      this._dispatchMetricsBatchinator = new Batchinator(
        this.dispatchMetrics.bind(this),
        dispatchMetricsThreshold
      );
  }

  initializeDefaultRecycleBuffer() {
    this.addBuffer(DEFAULT_RECYCLER_TYPE);
  }

  get length() {
    return this._data.length;
  }

  get store() {
    return this._store;
  }

  get selector() {
    return this._selector;
  }

  set scrollMetrics(scrollMetrics: ScrollMetrics) {
    this._scrollMetrics = scrollMetrics;
  }

  get stateResult() {
    return this._stateResult;
  }

  get state() {
    return this.store.getState();
  }

  getState() {
    return this.state;
  }

  getStateResult() {
    return this.stateResult;
  }

  addBuffer(recyclerType: string) {
    this._recycler.addBuffer(recyclerType);
  }

  addOnEndReached(onEndReached: OnEndReached) {
    return this.onEndReachedHelper.addHandler(onEndReached);
  }

  removeOnEndReached(onEndReached: OnEndReached) {
    this.onEndReachedHelper.removeHandler(onEndReached);
  }

  initializeStateResult() {
    this._state = this.resolveInitialState();

    this._stateResult =
      this.fillingMode === FillingMode.RECYCLE
        ? this.memoizedResolveRecycleState(this._state)
        : this.memoizedResolveSpaceState(this._state);
  }

  resolveInitialState() {
    if (!this.initialNumToRender || !this._data.length)
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
  // abstract getContainerOffset(): number

  get _data() {
    return this.getData();
  }

  abstract getData();
  abstract getDataLength(): number;
  abstract getTotalLength(): number | string;
  abstract getReflowItemsLength(): number;
  abstract getFinalItemKey(item: any);
  abstract getFinalIndexItemMeta(index: number);
  abstract getFinalItemMeta(item: any);
  abstract getFinalIndexItemLength(index: number);
  abstract getFinalIndexKeyOffset(index: number, exclusive?: boolean);
  abstract getFinalIndexKeyBottomOffset(index: number);
  abstract setFinalKeyItemLayout(
    key: string,
    info: ItemLayout | number,
    updateIntervalTree?: boolean
  );
  abstract getFinalIndexRangeOffsetMap(
    startIndex: number,
    endIndex: number,
    exclusive?: boolean
  );
  abstract computeIndexRange(minOffset: number, maxOffset: number);

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

  attemptToHandleEndReached() {
    if (this.initialNumToRender)
      this.onEndReachedHelper.attemptToHandleOnEndReachedBatchinator.schedule();
  }

  resetViewableItems() {
    if (this._scrollMetrics) this.dispatchMetrics(this._scrollMetrics);
  }

  getConfigTuple() {
    return this._configTuple;
  }

  resolveConfigTuplesDefaultState(defaultValue?: boolean) {
    return this._configTuple.getDefaultState(defaultValue);
  }

  addStateListener(listener: StateListener<ItemT>) {
    if (typeof listener === 'function') this._stateListener = listener;
    return () => {
      if (typeof listener === 'function') this._stateListener = null;
    };
  }

  applyStateResult(stateResult: ListStateResult<ItemT>) {
    const shouldStateUpdate = true;

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

  /**
   *
   * @param state
   * @param force
   *
   * Pay attention if you want to compare state first, then decide setState or not..
   * There is a condition the old and new stat are same, but item meta info changed
   * such as approximateLayout props change, then the list should rerun
   *
   */

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

        if (indexToOffsetMap[targetIndex] != null) {
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
                      : indexToOffsetMap[targetIndex] +
                        this.getContainerOffset()
                );

          itemMeta?.setItemMetaState(itemMetaState);
        }

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
      const indexToOffsetMap = this.getFinalIndexRangeOffsetMap(
        0,
        this.initialNumToRender - 1,
        true
      );

      for (let targetIndex = 0; targetIndex < nextData.length; targetIndex++) {
        const item = this._data[targetIndex];
        const itemMeta = this.getFinalItemMeta(item);
        if (itemMeta) {
          spaceState.push({
            item,
            isSpace: false,
            itemMeta,
            key: itemMeta.getKey(),
            isSticky: false,
            isReserved: true,
            length: this.getFinalIndexItemLength(targetIndex),
          });
          if (indexToOffsetMap[targetIndex] != null) {
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
                        : indexToOffsetMap[targetIndex] +
                          this.getContainerOffset()
                  );

            // 触发打点
            itemMeta?.setItemMetaState(itemMetaState);
          }
        }
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
      bufferedEndIndex: _bufferedEndIndex,
      bufferedStartIndex: _bufferedStartIndex,
    } = state;
    const bufferedEndIndex = resolver?.bufferedEndIndex
      ? resolver?.bufferedEndIndex(state)
      : _bufferedEndIndex;
    const bufferedStartIndex = resolver?.bufferedStartIndex
      ? resolver?.bufferedStartIndex(state)
      : _bufferedStartIndex;
    const data = this.getData()

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
          key: itemMeta?.getKey(),
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

  dispatchStoreMetrics(scrollMetrics: ScrollMetrics) {
    const state = this._store.dispatchMetrics({
      // @ts-ignore
      dimension: this,
      scrollMetrics,
    });
    if (isEmpty(state)) return state;
    this.setState({ ...state });

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
      ListSpyUtils.selector.getDispatchScrollMetricsEnabledStatus()
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

  _updateScrollMetrics(
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
