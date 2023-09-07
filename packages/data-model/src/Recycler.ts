import memoizeOne from 'memoize-one';
import { ActionType } from './state/types';
import { RecycleStateResult } from './types'

class Recycler {
  private _state: any
  private memoizedResolveRecycleState: (
    state: any
  ) => RecycleStateResult<ItemT>;

  constructor(props) {
    this._stateResult =
      this.fillingMode === FillingMode.RECYCLE
        ? this.memoizedResolveRecycleState(this._state)
        : this.memoizedResolveSpaceState(this._state);

    this._state = this.resolveInitialState();

    this.memoizedResolveRecycleState = memoizeOne(
      this.resolveRecycleState.bind(this)
    );
  }

  resolveInitialState() {
    if (!this.initialNumToRender)
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

    const maxIndex = Math.min(this.getData().length, this.initialNumToRender) - 1;
    return {
      visibleStartIndex: 0,
      visibleEndIndex: maxIndex,
      bufferedStartIndex: 0,
      bufferedEndIndex: maxIndex,
      isEndReached: false,
      distanceFromEnd: 0,
      data: this.getData().slice(0, maxIndex + 1),
      actionType: ActionType.Initial,
    };
  }

  getData() {
    return []
    // this.indexKeys.forEach(() => {

    // })
  }

  // updateState(newState: PreStateResult, scrollMetrics: ScrollMetrics) {
  //   const {
  //     bufferedStartIndex: nextBufferedStartIndex,
  //     bufferedEndIndex: nextBufferedEndIndex,
  //   } = newState;

  //   const omitKeys = ['data', 'distanceFromEnd', 'isEndReached'];
  //   const nextDataLength = Math.max(
  //     nextBufferedEndIndex + 1,
  //     this.getReflowItemsLength()
  //   );

  //   const oldData = this._state.data;

  //   const newData = this._data.slice(0, nextDataLength);

  //   const { isEqual } = resolveChanged(oldData, newData);

  //   const shouldSetState =
  //     shallowDiffers(
  //       omit(this._state || {}, omitKeys),
  //       omit(newState, omitKeys)
  //     ) || !isEqual;

  //   if (shouldSetState) {
  //     const state = {
  //       ...newState,
  //       data: this._data.slice(0, nextDataLength),
  //     };

  //     this.setState(state);
  //     this._state = state;
  //     this._offsetTriggerCachedState = scrollMetrics.offset;
  //   }
  // }

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

  _recycleEnabled() {
    if (this.fillingMode !== FillingMode.RECYCLE) return false;
    return this.getReflowItemsLength() >= this.initialNumToRender;
  }

  resolveRecycleState() {
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
}

export default Recycler