import Recycler, { OnRecyclerProcess } from '@x-oasis/recycler';
import memoizeOne from 'memoize-one';
import { buildStateTokenIndexKey, DEFAULT_RECYCLER_TYPE } from '../common';
import {
  ListBaseDimensionsProps,
  ListState,
  FillingMode,
  RecycleStateResult,
  RecycleRecycleState,
  GenericItemT,
  IndexToOffsetMap,
} from '../types';
import ItemMeta from '../ItemMeta';
import BaseImpl from './BaseImpl';

/**
 * item should be first class data model; item's value reference change will
 * cause recalculation of item key. However, if key is not changed, its itemMeta
 * will not change.
 */
class RecycleImpl<ItemT extends GenericItemT = GenericItemT> extends BaseImpl {
  private _onRecyclerProcess?: OnRecyclerProcess;

  private _recycler: Recycler<ItemMeta>;

  private _releaseSpaceStateItem: boolean;

  private memoizedResolveRecycleState: (
    state: ListState
  ) => RecycleStateResult<ItemT>;

  constructor(props: ListBaseDimensionsProps) {
    super({
      ...props,
      recycleEnabled: true,
    });
    const {
      recyclerTypes,
      recyclerBufferSize,
      recyclerReservedBufferPerBatch,

      onRecyclerProcess,

      releaseSpaceStateItem = false,
    } = props;

    this._onRecyclerProcess = onRecyclerProcess;
    this._releaseSpaceStateItem = releaseSpaceStateItem;

    this._recycler = new Recycler<ItemMeta>({
      // the following is appended with setting default recyclerType
      recyclerTypes,
      recyclerBufferSize,
      /**
       * set recycle start item
       */
      thresholdIndexValue: this.initialNumToRender,
      recyclerReservedBufferPerBatch,
      metaExtractor: (index) => this.getFinalIndexItemMeta(index),
      indexExtractor: (meta) => {
        const indexInfo = meta.getIndexInfo();
        return indexInfo?.indexInGroup || indexInfo.index;
      },
      getMetaType: (meta) => meta.recyclerType,
      getType: (index) =>
        this.getFinalIndexItemMeta(index)?.recyclerType ||
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

  _recycleEnabled() {
    if (this.fillingMode !== FillingMode.RECYCLE) return false;
    return this.getReflowItemsLength() >= this.initialNumToRender;
  }

  applyStateResult(stateResult: RecycleStateResult<ItemT>) {
    const shouldStateUpdate = true;

    if (shouldStateUpdate && typeof this._stateListener === 'function') {
      const { recycleState: _recycleState, spaceState } =
        stateResult as RecycleStateResult<ItemT>;
      // @ts-ignore
      const recycleState = _recycleState.map((state) => {
        if (!state) return null;
        const copy = { ...state };
        // @ts-expect-error
        delete copy.viewable;

        return copy;
      });

      if (
        (this._stateResult as RecycleStateResult<ItemT>).recycleState.length &&
        !recycleState.length
      ) {
        this._recycler.reset();
      }

      this._stateListener(
        {
          recycleState,
          spaceState,
          rangeState: stateResult.rangeState,
        },
        this._stateResult
      );
    }

    this._stateResult = {
      ...stateResult,
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

  setState(state: ListState, force = false) {
    const stateResult = force
      ? this.resolveRecycleState(state)
      : this.memoizedResolveRecycleState(state);
    this.applyStateResult(stateResult);
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
      // const layout = meta?.getLayout();
      // const length = (layout?.height || 0) + (meta?.getSeparatorLength() || 0);
      const length = meta.getFinalItemLength();
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

  resolveRecycleItemLayout(info, indexToOffsetMap: IndexToOffsetMap) {
    const { meta: itemMeta, targetIndex } = info;

    const itemLength = itemMeta.getFinalItemLength();

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

  resolveRecycleRecycleState(state: ListState) {
    const { visibleEndIndex, visibleStartIndex: _visibleStartIndex } = state;
    const recycleRecycleStateResult: RecycleRecycleState[] = [];
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
          position: 'buffered',
          ...this.resolveRecycleItemLayout(info, indexToOffsetMap),
        });
      });
    return recycleRecycleStateResult;
  }

  resolveRecycleSpaceState(state: ListState) {
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
}

export default RecycleImpl;
