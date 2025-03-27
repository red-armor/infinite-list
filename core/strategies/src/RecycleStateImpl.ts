import type { ItemMeta } from '@infinite-list/item-meta';
import type { ListGroupIndexInfo } from '@infinite-list/types';
import { log } from '@infinite-list/utils';
import defaultValue from '@x-oasis/default-value';
import type { OnRecyclerProcess } from '@x-oasis/recycler';
import Recycler from '@x-oasis/recycler';
// import { resolveToken } from './utils';
import BaseState from './BaseState';
import {
  DEFAULT_RECYCLER_TYPE,
  RECYCLER_BUFFER_SIZE,
  RECYCLER_RESERVED_BUFFER_PER_BATCH,
  buildStateTokenIndexKey,
} from './common';
import type {
  GenericItemT,
  ListState,
  RecycleRecycleState,
  RecycleStateImplProps,
  RecycleStateResult,
  SpaceStateResult,
  StateListener,
} from './types';

/**
 * item should be first class data model; item's value reference change will
 * cause recalculation of item key. However, if key is not changed, its itemMeta
 * will not change.
 */
class RecycleStateImpl<
  ItemT extends GenericItemT = GenericItemT,
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
      recyclerTypes = [DEFAULT_RECYCLER_TYPE],
      recyclerBufferSize = RECYCLER_BUFFER_SIZE,
      recyclerReservedBufferPerBatch = RECYCLER_RESERVED_BUFFER_PER_BATCH,

      onRecyclerProcess,
    } = props;

    this._onRecyclerProcess = onRecyclerProcess;

    // this._releaseSpaceStateItem = releaseSpaceStateItem;

    this._recycler = new Recycler<ItemMeta<ItemT>>({
      // the following is appended with setting default recyclerType
      recyclerTypes,
      recyclerBufferSize,
      recyclerReservedBufferPerBatch,
      /**
       * set recycle start item
       */
      thresholdIndexValue: this.listContainer.initialNumToRender,
      metaExtractor: (index) => {
        // console.log('met ---- ', index, this.listContainer.getFinalIndexItemMeta(index))
        return this.listContainer.getFinalIndexItemMeta(index);
      },
      indexExtractor: (meta: ItemMeta<ItemT>) => {
        const indexInfo = meta.getIndexInfo();
        const index =
          (indexInfo as ListGroupIndexInfo<ItemT>)?.indexInGroup ||
          indexInfo?.index;
        if (typeof index !== 'number') {
          console.error(
            '[RecycleStateImpl error]: index should has a valid number ' +
              'or will cause recycler not work correctly'
          );
        }
        return defaultValue(index, -1);
      },
      getMetaType: (meta) => meta.recyclerType,
      getType: (index) =>
        this.listContainer.getFinalIndexItemMeta(index)?.recyclerType ||
        DEFAULT_RECYCLER_TYPE,
    });

    // default recyclerTypes should be set immediately
    this.initializeDefaultRecycleBuffer();

    this.memoizedResolveRecycleState = this.resolveRecycleState.bind(this);
    // this.memoizedResolveRecycleState = memoizeOne(
    //   this.resolveRecycleState.bind(this)
    // );
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
    const isFunction = typeof listener === 'function';
    if (isFunction) this.stateListener = listener;
    return () => {
      if (isFunction) this.stateListener = undefined;
    };
  }

  applyStateResult(stateResult: RecycleStateResult<ItemT>) {
    if (typeof this.stateListener === 'function') {
      const { recycleState: _recycleState, spaceState } = stateResult;

      const recycleState = _recycleState
        .map((state) => {
          if (!state) return null;
          const copy = { ...state };

          // @ts-expect-error [TODO]
          delete copy.viewable;

          return copy;
        })
        .filter((v) => v != null);

      // TODO: when to reset
      if (
        (this._stateResult as RecycleStateResult<ItemT>).recycleState.length >
          0 &&
        recycleState.length === 0
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
      recycleState: recycleStateResult.filter(Boolean),
      spaceState: spaceStateResult.filter(Boolean),
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

  dispatchState(
    state: ListState,
    force = false
  ): [RecycleStateResult<ItemT>, RecycleStateResult<ItemT>] {
    const oldStateResult = { ...this._stateResult };
    const stateResult = force
      ? this.resolveRecycleState(state)
      : this.memoizedResolveRecycleState(state);
    this._stateResult = stateResult;

    return [stateResult, oldStateResult];
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
        maxCount: recycleBufferedCount,
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
        maxCount: recycleBufferedCount,
        step: 1,
        onProcess: this._onRecyclerProcess,
        /** TODO */
        // maxIndex: this.getData().length,
      });
    } else {
      this._recycler.updateIndices({
        safeRange,
        startIndex: visibleEndIndex,
        maxCount: recycleBufferedCount,
        step: -1,
        onProcess: this._onRecyclerProcess,
        /** TODO */
        // maxIndex: this.getData().length,
      });
    }

    // should getIndices first, then resolve minValue or maxValue
    const targetIndices = this._recycler.getIndices();

    const minValue = this._recycler.getMinValue();
    const maxValue = this._recycler.getMaxValue();

    // maybe should split by recyclerType
    const indexToOffsetMap = this.listContainer.getFinalIndexRangeOffsetMap(
      minValue,
      maxValue,
      true
    );

    log.info('target indices ', { ...state }, targetIndices.slice());

    targetIndices.filter(Boolean).forEach((info) => {
      const { meta: itemMeta, targetIndex, recyclerKey } = info;
      const item = this.listContainer.getData()[targetIndex];

      let itemMetaState = null;

      if (indexToOffsetMap[targetIndex] != null) {
        /**
         * [TODO]: maybe only sensitive item should calculate...
         */
        if (itemMeta.isApproximateLayout) {
          const itemOffset = this.listContainer.getFinalIndexKeyOffset(
            targetIndex,
            true
          );

          itemMetaState = this.listContainer._configTuple.resolveItemMetaState(
            itemMeta,
            this.listContainer._scrollMetrics,
            () => itemOffset + this.listContainer.getContainerOffset()
          );
        }
        if (!itemMetaState) {
          itemMetaState = this.listContainer._configTuple.resolveItemMetaState(
            itemMeta,
            this.listContainer._scrollMetrics,
            () =>
              indexToOffsetMap[targetIndex] +
              this.listContainer.getContainerOffset()
          );

          // console.log('update =====', this.listContainer._scrollMetrics, indexToOffsetMap[targetIndex], itemMetaState)
        }

        itemMeta?.setItemMetaState(itemMetaState);
      }

      recycleRecycleStateResult.push({
        key: recyclerKey,
        targetKey: itemMeta.getKey(),
        targetIndex,
        isSpace: false,
        isSticky: this.listContainer.stickyHeaderIndices.includes(targetIndex),
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
              () =>
                indexToOffsetMap[targetIndex] +
                this.listContainer.getContainerOffset()
            );
          itemMeta?.setItemMetaState(itemMetaState);
        }
      }
    }

    const startIndexOffset = this.listContainer.getFinalIndexKeyOffset(
      this.listContainer.initialNumToRender || 0,
      true
    );
    const endIndexOffset = this.listContainer.getTotalLength();

    spaceState.push({
      item: null,
      isSpace: true,
      isSticky: false,
      isReserved: false,
      length:
        typeof endIndexOffset === 'number'
          ? endIndexOffset - startIndexOffset
          : startIndexOffset,
      itemMeta: null,

      /**
       * key is used to identify space state
       */
      key: buildStateTokenIndexKey(
        this.listContainer.initialNumToRender,
        this.listContainer.getData().length
      ),
    });

    // const afterTokens = resolveToken({
    //   startIndex: this.listContainer.initialNumToRender,
    //   endIndex: this.listContainer.getData().length - 1,
    //   reservedIndices: this.listContainer.reservedIndices,
    //   stickyHeaderIndices: this.listContainer.stickyHeaderIndices,
    //   persistenceIndices: this.listContainer.persistenceIndices,
    // });

    // afterTokens.forEach((token) => {
    //   const { isSticky, isReserved, startIndex, endIndex } = token;
    //   if (isSticky || isReserved) {
    //     const item = this.listContainer.getData()[startIndex];
    //     const itemMeta = this.listContainer.getFinalItemMeta(item);
    //     spaceState.push({
    //       item,
    //       isSpace: false,
    //       key: itemMeta?.getKey() || '',
    //       itemMeta,
    //       isSticky,
    //       isReserved,
    //       length: this.listContainer.getFinalIndexItemLength(startIndex),
    //     });
    //   } else {
    //     const startIndexOffset =
    //       this.listContainer.getFinalIndexKeyOffset(startIndex);
    //     // should plus 1, use list total length
    //     const endIndexOffset =
    //       // this.listContainer.getFinalIndexKeyOffset(endIndex);

    // this.listContainer.getFinalIndexKeyBottomOffset(endIndex);

    //     console.log('start =======', buildStateTokenIndexKey(startIndex, endIndex - 1), startIndexOffset, endIndexOffset, endIndexOffset - startIndexOffset)
    //     spaceState.push({
    //       item: null,
    //       isSpace: true,
    //       isSticky: false,
    //       isReserved: false,
    //       length: endIndexOffset - startIndexOffset,
    //       // endIndex is not included
    //       itemMeta: null,
    //       key: buildStateTokenIndexKey(startIndex, endIndex - 1),
    //     });
    //   }
    // });
    return spaceState;
  }
}

export default RecycleStateImpl;
