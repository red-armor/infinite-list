import memoizeOne from 'memoize-one';

import { buildStateTokenIndexKey } from '../common';
import {
  ListState,
  GenericItemT,
  SpaceStateResult,
  StateListener,
  SpaceStateImplProps,
} from '../types';
import BaseState from './BaseState';

/**
 * item should be first class data model; item's value reference change will
 * cause recalculation of item key. However, if key is not changed, its itemMeta
 * will not change.
 */
class SpaceStateImpl<
  ItemT extends GenericItemT = GenericItemT
> extends BaseState<ItemT> {
  private _stateResult?: SpaceStateResult<ItemT>;

  private memoizedResolveSpaceState: (
    state: ListState
  ) => SpaceStateResult<ItemT>;

  constructor(props: SpaceStateImplProps<ItemT>) {
    super(props);

    this.memoizedResolveSpaceState = memoizeOne(
      this.resolveSpaceState.bind(this)
    );
  }

  addStateListener(listener: StateListener<ItemT>) {
    if (typeof listener === 'function') this.stateListener = listener;
    return () => {
      if (typeof listener === 'function') this.stateListener = undefined;
    };
  }

  applyStateResult(stateResult: SpaceStateResult<ItemT>) {
    const shouldStateUpdate = true;

    if (shouldStateUpdate && typeof this.stateListener === 'function') {
      this.stateListener(stateResult, this._stateResult);
    }

    this._stateResult = {
      ...stateResult,
      rangeState: stateResult.rangeState,
    };
  }

  getStateResult() {
    return this._stateResult;
  }

  setState(state: ListState, force = false) {
    const stateResult = force
      ? this.resolveSpaceState(state)
      : this.memoizedResolveSpaceState(state);
    this.applyStateResult(stateResult);
  }

  resolveSpaceState(
    state: ListState,
    resolver?: {
      bufferedStartIndex?: (state: ListState) => number;
      bufferedEndIndex?: (state: ListState) => number;
      visibleStartIndex?: (state: ListState) => number;
      visibleEndIndex?: (state: ListState) => number;
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
    const data = this.getData();

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

      const itemKey = itemMeta.getKey();

      const itemLength = itemMeta?.getFinalItemLength();

      // const itemLayout = itemMeta?.getLayout();
      // const itemLength =
      //   (itemLayout?.height || 0) + (itemMeta?.getSeparatorLength() || 0);

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
}

export default SpaceStateImpl;
