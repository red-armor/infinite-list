import noop from '@x-oasis/noop';
import Batchinator from '@x-oasis/batchinator';
import ListGroupDimensions from './ListGroupDimensions';
import omit from '@x-oasis/omit';

import SelectValue, {
  selectHorizontalValue,
  selectVerticalValue,
} from '@x-oasis/select-value';

import {
  isEmpty,
  shallowDiffers,
  INITIAL_NUM_TO_RENDER,
  MAX_TO_RENDER_PER_BATCH,
  buildStateTokenIndexKey,
  DISPATCH_METRICS_THRESHOLD,
  RECYCLE_BUFFERED_COUNT,
  DEFAULT_ITEM_APPROXIMATE_LENGTH,
  ITEM_OFFSET_BEFORE_LAYOUT_READY,
} from './common';
import resolveChanged from '@x-oasis/resolve-changed';
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
// import IntegerBufferSet from '@x-oasis/integer-buffer-set';
import memoizeOne from 'memoize-one';
import shallowEqual from '@x-oasis/shallow-equal';
import shallowArrayEqual from '@x-oasis/shallow-array-equal';
import StillnessHelper from './utils/StillnessHelper';
import defaultBooleanValue from '@x-oasis/default-boolean-value';
import FixedBuffer from './FixedBuffer';
import ViewabilityConfigTuples from './viewable/ViewabilityConfigTuples';

/**
 * item should be first class data model; item's value reference change will
 * cause recalculation of item key. However, if key is not changed, its itemMeta
 * will not change.
 */
class ListBaseDimensions<ItemT extends {} = {}> {
  // private _data: Array<ItemT> = [];

  // to save data before list is active
  // private _softData: Array<ItemT> = [];
  public _selectValue: SelectValue;

  // private _keyExtractor: KeyExtractor<ItemT>;
  private _getItemLayout: GetItemLayout<ItemT>;
  private _getItemSeparatorLength: GetItemSeparatorLength<ItemT>;

  // private _itemToKeyMap: WeakMap<ItemT, string> = new WeakMap();
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

  private _initializeMode = false;

  // private _onBatchLayoutFinished: () => boolean;

  public updateStateBatchinator: Batchinator;

  private _recalculateRecycleResultStateBatchinator: Batchinator;

  private _recyclerTypeKeys: Array<string>;

  private _selector = new EnabledSelector({
    onEnabled: this.onEnableDispatchScrollMetrics.bind(this),
  });

  private _offsetTriggerCachedState = 0;

  private _stillnessHelper: StillnessHelper;

  private _recycleThreshold: number;
  readonly _onEndReachedThreshold: number;
  readonly _fillingMode: FillingMode;
  private _fixedBuffer: FixedBuffer;
  initialNumToRender: number;
  private _recycleBufferedCount: number;

  // private _initialNumToRender: number;
  private _persistanceIndices = [];
  private _stickyHeaderIndices = [];
  private _reservedIndices = [];
  private _maxToRenderPerBatch: number;
  private _canIUseRIC: boolean;
  private _itemOffsetBeforeLayoutReady: number;
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

  constructor(props: ListBaseDimensionsProps<ItemT>) {
    // super({
    //   ...props,
    //   isIntervalTreeItems: true,
    // });
    const {
      store,
      getData,
      horizontal,

      provider,
      canIUseRIC,
      recycleThreshold,
      maxToRenderPerBatch = MAX_TO_RENDER_PER_BATCH,
      initialNumToRender = INITIAL_NUM_TO_RENDER,
      recycleBufferedCount = RECYCLE_BUFFERED_COUNT,
      itemOffsetBeforeLayoutReady = ITEM_OFFSET_BEFORE_LAYOUT_READY,
      viewabilityConfig,
      onViewableItemsChanged,
      viewabilityConfigCallbackPairs,

      recycleEnabled,
      recyclerTypeKeys = ['default_recycler'],
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

      useItemApproximateLength,
      itemApproximateLength = DEFAULT_ITEM_APPROXIMATE_LENGTH,

      stillnessThreshold,
      onEndReachedTimeoutThreshold,
      distanceFromEndThresholdValue,
      onEndReachedHandlerTimeoutThreshold,

      maxCountOfHandleOnEndReachedAfterStillness,
    } = props;
    this._provider = provider;
    // this._keyExtractor = keyExtractor;
    this._itemApproximateLength = itemApproximateLength || 0;
    this._getItemLayout = getItemLayout;
    this._recyclerTypeKeys = recyclerTypeKeys;
    this._getData = getData;
    this._recycleBufferedCount = Math.max(recycleBufferedCount, 1);
    this._maxToRenderPerBatch = maxToRenderPerBatch;
    this._itemOffsetBeforeLayoutReady = itemOffsetBeforeLayoutReady;
    this._canIUseRIC = canIUseRIC;

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
      // id: this.id,
      id: 'xxxx',
      onEndReached,
      onEndReachedThreshold,
      onEndReachedTimeoutThreshold,
      distanceFromEndThresholdValue,
      onEndReachedHandlerTimeoutThreshold,
      maxCountOfHandleOnEndReachedAfterStillness,
    });
    // this._onBatchLayoutFinished = onBatchLayoutFinished;

    this._selectValue = horizontal
      ? selectHorizontalValue
      : selectVerticalValue;

    this._fillingMode = recycleEnabled
      ? FillingMode.RECYCLE
      : FillingMode.SPACE;
    this._recycleThreshold = recycleEnabled
      ? recycleThreshold || maxToRenderPerBatch * 2
      : 0;

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

    this._fixedBuffer = new FixedBuffer({
      /**
       * TODO temp set 0,
       */
      thresholdIndexValue: this.initialNumToRender,
      // thresholdIndexValue: 0,
      size: this._recycleThreshold,
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
  }

  get recycleBufferedCount() {
    return this._recycleBufferedCount;
  }

  get itemOffsetBeforeLayoutReady() {
    return this._itemOffsetBeforeLayoutReady;
  }

  get fillingMode() {
    return this._fillingMode;
  }

  get reservedIndices() {
    return this._reservedIndices;
  }

  get maxToRenderPerBatch() {
    return this._maxToRenderPerBatch;
  }

  get canIUseRIC() {
    return this._canIUseRIC;
  }

  updateReservedIndices() {
    const indices = new Set(
      [].concat(this.persistanceIndices, this.stickyHeaderIndices)
    );
    this._reservedIndices = Array.from(indices).sort((a, b) => a - b);
  }

  get persistanceIndices() {
    return this._persistanceIndices;
  }

  set persistanceIndices(indices: Array<number>) {
    this._persistanceIndices = indices.sort((a, b) => a - b);
    this.updateReservedIndices();
  }

  get stickyHeaderIndices() {
    return this._stickyHeaderIndices;
  }

  set stickyHeaderIndices(indices: Array<number>) {
    this._stickyHeaderIndices = indices.sort((a, b) => a - b);
    this.updateReservedIndices();
  }

  get recycleThreshold() {
    return this._recycleThreshold;
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

  // set offsetInListGroup(offset: number) {
  //   this._offsetInListGroup = offset;
  // }

  get state() {
    return this._state;
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

        // if (
        //   listHandler.getRenderState() !== ListRenderState.ON_RENDER_FINISHED
        // ) {
        //   this._renderStateListenersCleaner.push(
        //     listHandler.addRenderStateListener(this.handleDeps.bind(this))
        //   );
        //   isActive = false;
        // }
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

  /**
   *
   * @returns TODO: temp
   */
  getContainerOffset(): number {
    return 0;
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

  getReflowItemsLength() {
    return this._provider.getReflowItemsLength();
  }
  getFinalItemKey(item: any) {
    return this._provider.getFinalItemKey(item);
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
      endIndex: Math.min(
        visibleEndIndex,
        visibleStartIndex + this.recycleThreshold - 1
      ),
    };
  }

  resolveRecycleRecycleState(state: ListState<ItemT>) {
    const {
      visibleEndIndex,
      visibleStartIndex: _visibleStartIndex,
      isEndReached,
    } = state;
    const targetIndices = this._fixedBuffer
      .getIndices()
      .map((i) => parseInt(i));
    const recycleStateResult = [];
    const velocity = this._scrollMetrics?.velocity || 0;

    const visibleStartIndex = Math.max(
      _visibleStartIndex,
      /** TODO: temp set to 0 */
      // this.initialNumToRender
      this._fixedBuffer.thresholdIndexValue
    );

    const safeRange = this.resolveSafeRange({
      visibleStartIndex,
      visibleEndIndex,
    });

    if (this.recognizeLengthBeforeLayout()) {
      if (Math.abs(velocity) <= 1) {
        this._fixedBuffer.updateIndices(targetIndices, {
          safeRange,
          startIndex: visibleStartIndex - 1,
          maxCount: visibleEndIndex - visibleStartIndex + 1 + 2,
          step: 1,
          /** TODO !!!!!! */
          maxIndex: this.getData().length,
        });
      } else if (velocity > 0) {
        this._fixedBuffer.updateIndices(targetIndices, {
          safeRange,
          startIndex: visibleStartIndex,
          maxCount:
            visibleEndIndex - visibleStartIndex + 1 + this.recycleBufferedCount,
          step: 1,
          /** TODO */
          maxIndex: this.getData().length,
        });
      } else {
        this._fixedBuffer.updateIndices(targetIndices, {
          safeRange,
          startIndex: visibleStartIndex - 2,
          maxCount:
            visibleEndIndex - visibleStartIndex + 1 + this.recycleBufferedCount,
          step: 1,
          /** TODO */
          maxIndex: this.getData().length,
        });
      }
    } else {
      this._fixedBuffer.updateIndices(targetIndices, {
        safeRange,
        startIndex: visibleStartIndex,
        maxCount: visibleEndIndex - visibleStartIndex + 1,
        step: 1,
        /** TODO */
        maxIndex: this.getData().length,
      });
      // ********************** commented on 0626 begin ************************//
      if (velocity >= 0) {
        const maxValue = this._fixedBuffer.getMaxValue();
        if (
          isEndReached &&
          maxValue - (visibleEndIndex + 1) < this.maxToRenderPerBatch
        ) {
          // const remainingSpace = this.recycleThreshold - (visibleEndIndex - visibleStartIndex + 2)
          this._fixedBuffer.updateIndices(targetIndices, {
            safeRange,
            startIndex: maxValue + 1,
            maxCount: Math.max(
              Math.min(
                this.recycleThreshold - (maxValue - visibleStartIndex + 2),
                this.recycleBufferedCount
              ),
              0
            ),
            step: 1,
            /** TODO */
            maxIndex: this.getData().length,
          });
        } else if (!velocity) {
          const part = Math.floor(this.recycleBufferedCount / 2);
          this._fixedBuffer.updateIndices(targetIndices, {
            safeRange,
            startIndex: visibleStartIndex - 1,
            maxCount: part,
            step: -1,
            /** TODO */
            maxIndex: this.getData().length,
          });
          this._fixedBuffer.updateIndices(targetIndices, {
            safeRange,
            startIndex: visibleEndIndex + 1,
            maxCount: this.recycleBufferedCount - part,
            step: 1,
            /** TODO */
            maxIndex: this.getData().length,
          });
        } else if (Math.abs(velocity) < 0.5) {
          this._fixedBuffer.updateIndices(targetIndices, {
            safeRange,
            startIndex: visibleEndIndex + 1,
            maxCount: this.recycleBufferedCount,
            step: 1,
            /** TODO */
            maxIndex: this.getData().length,
          });
        }
      } else {
        if (Math.abs(velocity) < 0.5) {
          this._fixedBuffer.updateIndices(targetIndices, {
            safeRange,
            startIndex: visibleStartIndex - 1,
            maxCount: this.recycleBufferedCount,
            step: -1,
            /** TODO */
            maxIndex: this.getData().length,
          });
        }
      }
      // ********************** commented on 0626 end ************************//
    }

    const minValue = this._fixedBuffer.getMinValue();
    const maxValue = this._fixedBuffer.getMaxValue();
    const indexToOffsetMap = this.getFinalIndexRangeOffsetMap(
      minValue,
      maxValue,
      true
    );

    targetIndices.forEach((targetIndex, index) => {
      const item = this._data[targetIndex];
      if (!item) return;

      const itemKey = this.getFinalItemKey(item);
      const itemMeta = this.getFinalItemMeta(item);
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

        /**
         * itemMeta should get from parent
         */
        viewable: itemMeta.getState().viewable,
        // 如果没有offset，说明item是新增的，那么它渲染就在最开始位置好了
        offset:
          itemLength && !itemMeta.isApproximateLayout
            ? indexToOffsetMap[targetIndex]
            : this.itemOffsetBeforeLayoutReady,
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
        const endIndexOffset = this.getFinalIndexKeyOffset(endIndex);
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

export default ListBaseDimensions;
