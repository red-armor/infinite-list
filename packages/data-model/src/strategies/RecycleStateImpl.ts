import Recycler, { OnRecyclerProcess } from '@x-oasis/recycler';
import memoizeOne from 'memoize-one';
import { buildStateTokenIndexKey, DEFAULT_RECYCLER_TYPE } from '../common';
import {
  ListState,
  RecycleStateResult,
  RecycleRecycleState,
  GenericItemT,
  StateListener,
  SpaceStateResult,
  RecycleStateImplProps,
} from '../types';
import ItemMeta from '../ItemMeta';
import { resolveToken } from './utils';
import BaseState from './BaseState';

/**
 * item should be first class data model; item's value reference change will
 * cause recalculation of item key. However, if key is not changed, its itemMeta
 * will not change.
 */
class RecycleStateImpl<
  ItemT extends GenericItemT = GenericItemT
> extends BaseState<ItemT> {
  private _onRecyclerProcess?: OnRecyclerProcess;
  public stateListener?: StateListener<ItemT>;

  private _recycler: Recycler<ItemMeta<ItemT>>;

  private _stateResult: RecycleStateResult<ItemT> = {
    recycleState: [],
    spaceState: [],
    rangeState: {} as any,
  };

  private memoizedResolveRecycleState: (
    state: ListState
  ) => RecycleStateResult<ItemT>;

  constructor(props: RecycleStateImplProps<ItemT>) {
    super({
      listContainer: props.listContainer,
    });
    const {
      recyclerTypes,
      recyclerBufferSize,
      recyclerReservedBufferPerBatch,

      onRecyclerProcess,
    } = props;

    this._onRecyclerProcess = onRecyclerProcess;
    // this._releaseSpaceStateItem = releaseSpaceStateItem;

    this._recycler = new Recycler<ItemMeta<ItemT>>({
      // the following is appended with setting default recyclerType
      recyclerTypes,
      recyclerBufferSize,
      /**
       * set recycle start item
       */
      thresholdIndexValue: this.listContainer.initialNumToRender,
      recyclerReservedBufferPerBatch,
      metaExtractor: (index) => this.listContainer.getFinalIndexItemMeta(index),
      indexExtractor: (meta) => {
        const indexInfo = meta.getIndexInfo();
        return indexInfo?.indexInGroup || indexInfo.index;
      },
      getMetaType: (meta) => meta.recyclerType,
      getType: (index) =>
        this.listContainer.getFinalIndexItemMeta(index)?.recyclerType ||
        DEFAULT_RECYCLER_TYPE,
    });
    // default recyclerTypes should be set immediately
    this.initializeDefaultRecycleBuffer();

    this.memoizedResolveRecycleState = memoizeOne(
      this.resolveRecycleState.bind(this)
    );
  }

  initializeDefaultRecycleBuffer() {
    this.addBuffer(DEFAULT_RECYCLER_TYPE);
  }

  addBuffer(recyclerType: string) {
    this._recycler.addBuffer(recyclerType);
  }

  // _recycleEnabled() {
  //   if (this.fillingMode !== FillingMode.RECYCLE) return false;
  //   return this.getReflowItemsLength() >= this.initialNumToRender;
  // }

  addStateListener(listener: StateListener<ItemT>) {
    if (typeof listener === 'function') this.stateListener = listener;
    return () => {
      if (typeof listener === 'function') this.stateListener = undefined;
    };
  }

  applyStateResult(stateResult: RecycleStateResult<ItemT>) {
    const shouldStateUpdate = true;

    if (shouldStateUpdate && typeof this.stateListener === 'function') {
      const { recycleState: _recycleState, spaceState } = stateResult;

      const recycleState = _recycleState
        .map((state) => {
          if (!state) return null;
          const copy = { ...state };
          // @ts-expect-error
          delete copy.viewable;

          return copy;
        })
        .filter((v) => v != null);

      // TODO: when to reset
      if (
        (this._stateResult as RecycleStateResult<ItemT>).recycleState.length &&
        !recycleState.length
      ) {
        this._recycler.reset();
      }

      this.stateListener(
        {
          recycleState,
          spaceState,
          rangeState: stateResult.rangeState,
        },
        this._stateResult
      );
    }

    this._stateResult = { ...stateResult };
  }

  resolveRecycleState(state: ListState) {
    // const recycleEnabled = this._recycleEnabled();
    // 只有当recycleEnabled为true的时候，才进行位置替换
    const recycleStateResult = this.resolveRecycleRecycleState(state);
    const spaceStateResult = this.resolveRecycleSpaceState();

    const stateResult = {
      recycleState: recycleStateResult.filter((v) => v),
      spaceState: spaceStateResult.filter((v) => v),
      rangeState: state,
    };

    return stateResult;
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

  setState(state: ListState, force = false) {
    const stateResult = force
      ? this.resolveRecycleState(state)
      : this.memoizedResolveRecycleState(state);
    this.applyStateResult(stateResult);
  }

  getStateResult() {
    return this._stateResult;
  }

  resolveSafeRange(props: {
    visibleStartIndex: number;
    visibleEndIndex: number;
  }) {
    const { visibleStartIndex, visibleEndIndex } = props;

    return {
      startIndex: visibleStartIndex,
      endIndex: visibleEndIndex,
    };
  }

  // resolveSiblingOffset(props: {
  //   startIndex: number;
  //   step: number;
  //   max: number;
  //   itemLength: number;
  //   offsetMap: {
  //     [key: number]: number;
  //   };
  // }) {
  //   const { startIndex, step = -1, max = 1, offsetMap, itemLength } = props;
  //   let siblingLength = 0;
  //   for (let idx = 0; idx < max; idx++) {
  //     const index = startIndex + step * idx;
  //     const meta = this.getFinalIndexItemMeta(index);
  //     const length = meta?.getFinalItemLength() || 0;
  //     if (meta && !meta?.isApproximateLayout) {
  //       const offset =
  //         offsetMap[index] != null
  //           ? offsetMap[index]
  //           : this.getFinalIndexKeyOffset(index) || 0;
  //       return (
  //         offset +
  //         siblingLength * (step > 0 ? -1 : 1) +
  //         length * (step > 0 ? 0 : 1) -
  //         itemLength * (step > 0 ? 1 : 0)
  //       );
  //     }

  //     siblingLength += length;
  //   }
  //   return this.itemOffsetBeforeLayoutReady;
  // }

  resolveRecycleRecycleState(state: ListState) {
    const { visibleEndIndex, visibleStartIndex: _visibleStartIndex } = state;
    const recycleRecycleStateResult: RecycleRecycleState<ItemT> = [];
    const velocity = this.listContainer._scrollMetrics?.velocity || 0;

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
    const indexToOffsetMap = this.listContainer.getFinalIndexRangeOffsetMap(
      minValue,
      maxValue,
      true
    );
    const targetIndices = this._recycler.getIndices();

    targetIndices
      .filter((v) => v)
      .forEach((info) => {
        const { meta: itemMeta, targetIndex, recyclerKey } = info;
        const item = this.listContainer.getData()[targetIndex];

        if (indexToOffsetMap[targetIndex] != null) {
          const itemMetaState =
            this.listContainer._configTuple.resolveItemMetaState(
              itemMeta,
              this.listContainer._scrollMetrics,
              () => indexToOffsetMap[targetIndex]
            );

          itemMeta?.setItemMetaState(itemMetaState);
        }

        recycleRecycleStateResult.push({
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
          viewable: !!itemMeta.getState()['viewable'],
          // 如果没有offset，说明item是新增的，那么它渲染就在最开始位置好了
          // position: 'buffered',
          offset: indexToOffsetMap[targetIndex],
          length: itemMeta.getFinalItemLength(),
        });
      });
    return recycleRecycleStateResult;
  }

  resolveRecycleSpaceState() {
    const nextData = this.listContainer
      .getData()
      .slice(0, this.listContainer.initialNumToRender);
    const spaceState: SpaceStateResult<ItemT> = [];
    const indexToOffsetMap = this.listContainer.getFinalIndexRangeOffsetMap(
      0,
      this.listContainer.initialNumToRender - 1,
      true
    );

    for (let targetIndex = 0; targetIndex < nextData.length; targetIndex++) {
      const item = this.listContainer.getData()[targetIndex];
      const itemMeta = this.listContainer.getFinalItemMeta(item);
      if (itemMeta) {
        spaceState.push({
          item,
          isSpace: false,
          itemMeta,
          key: itemMeta.getKey(),
          isSticky: false,
          isReserved: true,
          length: this.listContainer.getFinalIndexItemLength(targetIndex),
        });
        if (indexToOffsetMap[targetIndex] != null) {
          const itemMetaState =
            this.listContainer._configTuple.resolveItemMetaState(
              itemMeta,
              this.listContainer._scrollMetrics,
              () => indexToOffsetMap[targetIndex]
            );
          itemMeta?.setItemMetaState(itemMetaState);
        }
      }
    }
    const afterTokens = resolveToken({
      startIndex: this.listContainer.initialNumToRender,
      endIndex: this.listContainer.getData().length - 1,
      reservedIndices: this.listContainer.reservedIndices,
      stickyHeaderIndices: this.listContainer.stickyHeaderIndices,
      persistanceIndices: this.listContainer.persistanceIndices,
    });

    afterTokens.forEach((token) => {
      const { isSticky, isReserved, startIndex, endIndex } = token;
      if (isSticky || isReserved) {
        const item = this.listContainer.getData()[startIndex];
        const itemMeta = this.listContainer.getFinalItemMeta(item);
        spaceState.push({
          item,
          isSpace: false,
          key: itemMeta?.getKey() || '',
          itemMeta,
          isSticky,
          isReserved,
          length: this.listContainer.getFinalIndexItemLength(startIndex),
        });
      } else {
        const startIndexOffset =
          this.listContainer.getFinalIndexKeyOffset(startIndex);
        // should plus 1, use list total length
        const endIndexOffset =
          this.listContainer.getFinalIndexKeyBottomOffset(endIndex);
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
}

export default RecycleStateImpl;
