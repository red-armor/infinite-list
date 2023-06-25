import ListDimensions from '../ListDimensions';
import Batchinator from '@x-oasis/batchinator';
import {
  KeysChangedType,
  SpaceStateResult,
  RecycleStateResult,
} from '../types';
import { defaultKeyExtractor } from '../exportedUtils';
import { buildStateTokenIndexKey } from '../common';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index + startIndex,
  }));

vi.spyOn(Batchinator.prototype, 'schedule').mockImplementation(function (
  ...args
) {
  // eslint-disable-next-line prefer-spread
  this._callback.apply(this, args);
});

describe('basic', () => {
  it('constructor - default value', () => {
    const listDimensions = new ListDimensions({
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      data: [],
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    expect(listDimensions.maxToRenderPerBatch).toBe(10);
    expect(listDimensions.windowSize).toBe(5);
    expect(listDimensions.initialNumToRender).toBe(10);
    expect(listDimensions.onEndReachedThreshold).toBe(2);
    expect(listDimensions.horizontal).toBe(false);
  });

  it('constructor', () => {
    const listDimensions = new ListDimensions({
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      data: buildData(50),
      maxToRenderPerBatch: 7,
      windowSize: 9,
      initialNumToRender: 20,
      onEndReachedThreshold: 2,
      horizontal: true,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    expect(listDimensions.maxToRenderPerBatch).toBe(7);
    expect(listDimensions.windowSize).toBe(9);
    expect(listDimensions.initialNumToRender).toBe(20);
    expect(listDimensions.onEndReachedThreshold).toBe(2);
    expect(listDimensions.horizontal).toBe(true);
  });

  it('verify changedType', () => {
    const data = buildData(10);

    const listDimensions = new ListDimensions({
      id: 'list_1',
      data,
      keyExtractor: defaultKeyExtractor,
    });

    const nextData = data.slice();
    nextData.splice(3, 1);
    const changedType = listDimensions.setData(nextData);
    expect(changedType).toBe(KeysChangedType.Remove);

    const changedTypeAdd = listDimensions.setData(buildData(12));
    expect(changedTypeAdd).toBe(KeysChangedType.Add);
  });

  it('initial itemMeta instance layout -- with getItemLayout', () => {
    const data = buildData(10);

    const listDimensions = new ListDimensions({
      id: 'list_1',
      data,
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({
        index,
        length: 100,
      }),
    });

    data.forEach((item, index) => {
      const meta = listDimensions.getItemMeta(item, index);
      expect(meta.getLayout()).toEqual({
        x: 0,
        y: 0,
        height: 100,
        width: 0,
      });
    });

    expect(listDimensions.getReflowItemsLength()).toBe(10);
  });

  it('initial itemMeta instance layout -- without getItemLayout', () => {
    const data = buildData(10);

    const listDimensions = new ListDimensions({
      id: 'list_1',
      data,
      keyExtractor: defaultKeyExtractor,
    });

    data.forEach((item, index) => {
      const meta = listDimensions.getItemMeta(item, index);
      expect(meta.getLayout()).toBeUndefined();
    });
    expect(listDimensions.getReflowItemsLength()).toBe(0);
  });
});

describe('resolve space state', () => {
  it('basic output state', () => {
    const data = buildData(100);

    const listDimensions = new ListDimensions({
      id: 'list_1',
      data,
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({
        index,
        length: 100,
      }),
    });

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 990,
      visibleLength: 926,
      contentLength: 10000,
    });

    const stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(39);
    expect(stateResult[0].length).toBe(100);
    expect(stateResult[0].isSpace).toBe(false);
    expect(stateResult[38].length).toBe(6200);
    expect(stateResult[38].isSpace).toBe(true);

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 995,
      visibleLength: 926,
      contentLength: 10000,
    });

    expect(stateResult).toBe(listDimensions.stateResult);
  });

  it('Has sticky indices', () => {
    const data = buildData(100);

    const listDimensions = new ListDimensions({
      id: 'list_1',
      data,
      stickyHeaderIndices: [0, 10],
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({
        index,
        length: 100,
      }),
    });

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 990,
      visibleLength: 926,
      contentLength: 10000,
    });

    let stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(39);
    expect(stateResult[0].length).toBe(100);
    expect(stateResult[0].isSpace).toBe(false);
    expect(stateResult[0].isSticky).toBe(true);
    expect(stateResult[0].isReserved).toBe(false);
    expect(stateResult[10].isSpace).toBe(false);
    expect(stateResult[10].isSticky).toBe(true);
    expect(stateResult[10].isReserved).toBe(false);
    expect(stateResult[38].length).toBe(6200);
    expect(stateResult[38].isSpace).toBe(true);

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 3009,
      visibleLength: 926,
      contentLength: 10000,
    });

    stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(51);
    expect(stateResult[0].length).toBe(100);
    expect(stateResult[0].isSpace).toBe(false);
    expect(stateResult[0].isSticky).toBe(true);
    expect(stateResult[1].length).toBe(900);
    expect(stateResult[1].isSpace).toBe(true);
    // expect(stateResult[21].viewable).toBe(false);
    // expect(stateResult[22].viewable).toBe(true);
    // expect(stateResult[31].viewable).toBe(true);
    // expect(stateResult[32].viewable).toBe(false);
    expect(stateResult[50].length).toBe(4200);
    expect(stateResult[50].isSpace).toBe(true);
  });

  it('memoize state result if input is equal', () => {
    const data = buildData(100);

    const listDimensions = new ListDimensions({
      id: 'list_1',
      data,
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({
        index,
        length: 100,
      }),
    });

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 990,
      visibleLength: 926,
      contentLength: 10000,
    });

    const stateResult = listDimensions.stateResult;

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 995,
      visibleLength: 926,
      contentLength: 10000,
    });

    expect(stateResult).toBe(listDimensions.stateResult);
  });

  it('persistanceIndices', () => {
    const data = buildData(100);

    const listDimensions = new ListDimensions({
      id: 'list_1',
      data,
      persistanceIndices: [1, 2, 10, 20],
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({
        index,
        length: 100,
      }),
    });

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 990,
      visibleLength: 926,
      contentLength: 10000,
    });

    let stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(39);
    expect(stateResult[0].length).toBe(100);
    expect(stateResult[0].isSpace).toBe(false);
    expect(stateResult[0].isSticky).toBe(false);
    expect(stateResult[0].isReserved).toBe(false);

    expect(stateResult[1].length).toBe(100);
    expect(stateResult[1].isSpace).toBe(false);
    expect(stateResult[1].isSticky).toBe(false);
    expect(stateResult[1].isReserved).toBe(true);

    expect(stateResult[2].length).toBe(100);
    expect(stateResult[2].isSpace).toBe(false);
    expect(stateResult[2].isSticky).toBe(false);
    expect(stateResult[2].isReserved).toBe(true);

    expect(stateResult[10].isSpace).toBe(false);
    expect(stateResult[10].isSticky).toBe(false);
    expect(stateResult[10].isReserved).toBe(true);

    expect(stateResult[38].length).toBe(6200);
    expect(stateResult[38].isSpace).toBe(true);

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 995,
      visibleLength: 926,
      contentLength: 10000,
    });

    expect(stateResult).toBe(listDimensions.stateResult);

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 3009,
      visibleLength: 926,
      contentLength: 10000,
    });

    stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(53);
    expect(stateResult[0].length).toBe(100);
    expect(stateResult[0].isSpace).toBe(true);
    expect(stateResult[1].isSpace).toBe(false);
    expect(stateResult[2].isSpace).toBe(false);
    expect(stateResult[3].isSpace).toBe(true);
    expect(stateResult[3].length).toBe(700);
    expect(stateResult[4].isSpace).toBe(false);
    expect(stateResult[4].isReserved).toBe(true);
    expect(stateResult[14].isSpace).toBe(false);
    expect(stateResult[14].isReserved).toBe(true);
    expect(stateResult[52].length).toBe(4200);
    expect(stateResult[52].isSpace).toBe(true);

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 5009,
      visibleLength: 926,
      contentLength: 10000,
    });

    stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(56);
    expect(stateResult[0].length).toBe(100);
    expect(stateResult[0].isSpace).toBe(true);
    expect(stateResult[1].isSpace).toBe(false);
    expect(stateResult[1].isReserved).toBe(true);
    expect(stateResult[2].isSpace).toBe(false);
    expect(stateResult[2].isReserved).toBe(true);
    expect(stateResult[3].isSpace).toBe(true);
    expect(stateResult[3].length).toBe(700);
    expect(stateResult[4].isSpace).toBe(false);
    expect(stateResult[4].isReserved).toBe(true);
    expect(stateResult[5].isSpace).toBe(true);
    expect(stateResult[5].length).toBe(900);
    expect(stateResult[6].isSpace).toBe(false);
    expect(stateResult[6].isReserved).toBe(true);
    expect(stateResult[6].length).toBe(100);
    expect(stateResult[7].isSpace).toBe(true);
    expect(stateResult[7].length).toBe(1000);
    expect(stateResult[8].isSpace).toBe(false);
    expect(stateResult[8].isReserved).toBe(false);
    expect(stateResult[55].length).toBe(2200);
    expect(stateResult[55].isSpace).toBe(true);
  });

  it('hydrationWithBatchUpdate', () => {
    const data = buildData(100);

    const list = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 2,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getItemLayout: (item, index) => ({
        length: 100,
        index,
      }),
      getContainerLayout: () => ({
        x: 0,
        y: 0,
        width: 375,
        height: 2000,
      }),
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            viewport: 1,
            name: 'imageViewable',
            viewAreaCoveragePercentThreshold: 20,
          },
        },
        {
          viewabilityConfig: {
            name: 'viewable',
            viewAreaCoveragePercentThreshold: 30,
          },
        },
      ],
    });

    expect(list.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });

    list.setData(data);

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 400,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 9,
      bufferedStartIndex: 0,
      bufferedEndIndex: 10,
      isEndReached: true,
      distanceFromEnd: -526,
      data: data.slice(0, 100),
      actionType: 'hydrationWithBatchUpdate',
    });
  });

  it('hydrationWithBatchUpdate - contentLength change will cause different bufferedIndexRange', () => {
    const data = buildData(100);

    const list = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 2,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getItemLayout: (item, index) => ({
        length: 100,
        index,
      }),
      getContainerLayout: () => ({
        x: 0,
        y: 0,
        width: 375,
        height: 2000,
      }),
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            viewport: 1,
            name: 'imageViewable',
            viewAreaCoveragePercentThreshold: 20,
          },
        },
        {
          viewabilityConfig: {
            name: 'viewable',
            viewAreaCoveragePercentThreshold: 30,
          },
        },
      ],
    });

    expect(list.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });

    list.setData(data);

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1000,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 9,
      bufferedStartIndex: 0,
      bufferedEndIndex: 16,
      isEndReached: true,
      distanceFromEnd: 74,
      data: data.slice(0, 100),
      actionType: 'hydrationWithBatchUpdate',
    });
  });

  it('persistanceIndices and stickyIndices', () => {
    const data = buildData(100);

    const listDimensions = new ListDimensions({
      id: 'list_1',
      data,
      stickyHeaderIndices: [0, 1],
      persistanceIndices: [1, 2, 10, 20],
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({
        index,
        length: 100,
      }),
    });

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 990,
      visibleLength: 926,
      contentLength: 10000,
    });

    let stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(39);
    expect(stateResult[0].length).toBe(100);
    expect(stateResult[0].isSpace).toBe(false);
    expect(stateResult[0].isSticky).toBe(true);
    expect(stateResult[0].isReserved).toBe(false);

    expect(stateResult[1].length).toBe(100);
    expect(stateResult[1].isSpace).toBe(false);
    expect(stateResult[1].isSticky).toBe(true);
    expect(stateResult[1].isReserved).toBe(true);

    expect(stateResult[2].length).toBe(100);
    expect(stateResult[2].isSpace).toBe(false);
    expect(stateResult[2].isSticky).toBe(false);
    expect(stateResult[2].isReserved).toBe(true);

    expect(stateResult[10].isSpace).toBe(false);
    expect(stateResult[10].isSticky).toBe(false);
    expect(stateResult[10].isReserved).toBe(true);

    expect(stateResult[38].length).toBe(6200);
    expect(stateResult[38].isSpace).toBe(true);

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 995,
      visibleLength: 926,
      contentLength: 10000,
    });

    expect(stateResult).toBe(listDimensions.stateResult);

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 3009,
      visibleLength: 926,
      contentLength: 10000,
    });

    stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(53);
    expect(stateResult[0].length).toBe(100);
    expect(stateResult[0].isSpace).toBe(false);
    expect(stateResult[1].isSpace).toBe(false);
    expect(stateResult[2].isSpace).toBe(false);
    expect(stateResult[3].isSpace).toBe(true);
    expect(stateResult[3].length).toBe(700);
    expect(stateResult[4].isSpace).toBe(false);
    expect(stateResult[4].isReserved).toBe(true);
    expect(stateResult[14].isSpace).toBe(false);
    expect(stateResult[14].isReserved).toBe(true);
    expect(stateResult[52].length).toBe(4200);
    expect(stateResult[52].isSpace).toBe(true);

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 5009,
      visibleLength: 926,
      contentLength: 10000,
    });

    stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(56);
    expect(stateResult[0].length).toBe(100);
    expect(stateResult[0].isSpace).toBe(false);
    expect(stateResult[1].isSpace).toBe(false);
    expect(stateResult[1].isReserved).toBe(true);
    expect(stateResult[2].isSpace).toBe(false);
    expect(stateResult[2].isReserved).toBe(true);
    expect(stateResult[3].isSpace).toBe(true);
    expect(stateResult[3].length).toBe(700);
    expect(stateResult[4].isSpace).toBe(false);
    expect(stateResult[4].isReserved).toBe(true);
    expect(stateResult[5].isSpace).toBe(true);
    expect(stateResult[5].length).toBe(900);
    expect(stateResult[6].isSpace).toBe(false);
    expect(stateResult[6].isReserved).toBe(true);
    expect(stateResult[6].length).toBe(100);
    expect(stateResult[7].isSpace).toBe(true);
    expect(stateResult[7].length).toBe(1000);
    expect(stateResult[8].isSpace).toBe(false);
    expect(stateResult[8].isReserved).toBe(false);
    expect(stateResult[55].length).toBe(2200);
    expect(stateResult[55].isSpace).toBe(true);
  });
});

describe('viewability', () => {
  it('default viewabilityConfig', () => {
    const data = buildData(100);

    const listDimensions = new ListDimensions({
      id: 'list_1',
      data,
      stickyHeaderIndices: [0, 10],
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({
        index,
        length: 100,
      }),
    });

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 990,
      visibleLength: 926,
      contentLength: 10000,
    });

    const stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(39);
    // expect(stateResult[8].viewable).toBe(false);
    // expect(stateResult[9].viewable).toBe(true);
    // expect(stateResult[19].viewable).toBe(true);
    // expect(stateResult[20].viewable).toBe(false);
  });

  it('imageViewable - viewport: 0, thresholdValue: 0', () => {
    const data = buildData(100);

    const listDimensions = new ListDimensions({
      id: 'list_1',
      data,
      stickyHeaderIndices: [0, 10],
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({
        index,
        length: 100,
      }),
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            name: 'imageViewable',
            viewAreaCoveragePercentThreshold: 0,
          },
        },
        {
          viewabilityConfig: {
            name: 'viewable',
            viewAreaCoveragePercentThreshold: 0,
          },
        },
      ],
    });

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 990,
      visibleLength: 926,
      contentLength: 10000,
    });

    const stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(39);
    // expect(stateResult[8].viewable).toBe(false);
    // expect(stateResult[9].viewable).toBe(true);
    // expect(stateResult[19].viewable).toBe(true);
    // expect(stateResult[20].viewable).toBe(false);
    // expect(stateResult[8].imageViewable).toBe(false);
    // expect(stateResult[9].imageViewable).toBe(true);
    // expect(stateResult[19].imageViewable).toBe(true);
    // expect(stateResult[20].imageViewable).toBe(false);
  });

  it('imageViewable - viewport: 1, thresholdValue: 0', () => {
    const data = buildData(100);

    const listDimensions = new ListDimensions({
      id: 'list_1',
      data,
      stickyHeaderIndices: [0, 10],
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({
        index,
        length: 100,
      }),
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            name: 'imageViewable',
            viewport: 1,
            viewAreaCoveragePercentThreshold: 0,
          },
        },
        {
          viewabilityConfig: {
            name: 'viewable',
            viewAreaCoveragePercentThreshold: 0,
          },
        },
      ],
    });

    // @ts-ignore
    listDimensions.updateScrollMetrics({
      offset: 990,
      visibleLength: 926,
      contentLength: 10000,
    });

    const stateResult = listDimensions.stateResult as SpaceStateResult<any>;

    expect(stateResult.length).toBe(39);
    // expect(stateResult[0].viewable).toBe(false);
    // expect(stateResult[0].imageViewable).toBe(true);
    // expect(stateResult[8].viewable).toBe(false);
    // expect(stateResult[8].imageViewable).toBe(true);
    // expect(stateResult[9].viewable).toBe(true);
    // expect(stateResult[9].imageViewable).toBe(true);
    // expect(stateResult[19].viewable).toBe(true);
    // expect(stateResult[19].imageViewable).toBe(true);
    // expect(stateResult[20].viewable).toBe(false);
    // expect(stateResult[20].imageViewable).toBe(true);
    // expect(stateResult[28].viewable).toBe(false);
    // expect(stateResult[28].imageViewable).toBe(true);
    // expect(stateResult[29].viewable).toBe(false);
    // expect(stateResult[29].imageViewable).toBe(false);
  });
});

describe('setData', () => {
  it('initial', () => {
    const data = buildData(20);
    const recycleList = new ListDimensions({
      data: [],
      id: 'list_group',
      recycleEnabled: true,
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 10,
      windowSize: 5,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
      getItemLayout: (data, index) => ({
        length: 100,
        index,
      }),
    });
    const _intervalTree = recycleList.intervalTree;
    const type = recycleList.setData(data);
    expect(type).toBe(KeysChangedType.Initial);
    // on initial interval tree should not change.
    expect(_intervalTree).toBe(recycleList.intervalTree);
  });

  it('append', () => {
    const data = buildData(20);
    const recycleList = new ListDimensions({
      data,
      id: 'list_group',
      recycleEnabled: true,
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 10,
      windowSize: 5,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
      getItemLayout: (data, index) => ({
        length: 100,
        index,
      }),
      getItemSeparatorLength: () => ({
        length: 20,
      }),
    });

    const _intervalTree = recycleList.intervalTree;
    expect(recycleList.intervalTree.get(19)).toBe(100);
    const newData = [].concat(data, buildData(1, 20));

    const type = recycleList.setData(newData);

    expect(type).toBe(KeysChangedType.Append);
    // on initial interval tree should not change.
    expect(_intervalTree).toBe(recycleList.intervalTree);
    expect(recycleList.intervalTree.get(19)).toBe(120);
    expect(recycleList.intervalTree.get(20)).toBe(100);
  });

  it('append with duplicate key', () => {
    const data = buildData(20);
    const recycleList = new ListDimensions({
      data,
      id: 'list_group',
      recycleEnabled: true,
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 10,
      windowSize: 5,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
      getItemLayout: (data, index) => ({
        length: 100,
        index,
      }),
      getItemSeparatorLength: () => ({
        length: 20,
      }),
    });

    const _intervalTree = recycleList.intervalTree;
    expect(recycleList.intervalTree.get(19)).toBe(100);
    const newData = [].concat(data, buildData(10, 19));

    const type = recycleList.setData(newData);

    expect(type).toBe(KeysChangedType.Append);
    expect(recycleList.getData().length).toBe(29);
    // on initial interval tree should not change.
    expect(_intervalTree).toBe(recycleList.intervalTree);
    expect(recycleList.getKeyIndex('20')).toBe(20);
    expect(recycleList.intervalTree.getHeap()[1]).toBe(3460);

    // expect(recycleList.intervalTree.get(19)).toBe(120);
    // expect(recycleList.getKeyItemLength('20')).toBe(120);
    // expect(recycleList.intervalTree.get(20)).toBe(100);
  });

  it('shuffle', () => {
    const data = buildData(20);
    const recycleList = new ListDimensions({
      data,
      id: 'list_group',
      recycleEnabled: true,
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 10,
      windowSize: 5,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    let _intervalTree = recycleList.intervalTree;
    expect(recycleList.intervalTree.get(19)).toBe(0);
    recycleList.setKeyItemLayout('0', 100);
    recycleList.setKeyItemLayout('1', 80);
    recycleList.setKeyItemLayout('2', 100);
    recycleList.setKeyItemLayout('3', 20);
    recycleList.setKeyItemLayout('4', 100);
    recycleList.setKeyItemLayout('5', 30);
    recycleList.setKeyItemLayout('6', 100);
    recycleList.setKeyItemLayout('7', 200);
    expect(
      recycleList.intervalTree
        .getHeap()
        .slice(
          recycleList.intervalTree.getSize(),
          recycleList.intervalTree.getSize() + 10
        )
    ).toEqual([100, 80, 100, 20, 100, 30, 100, 200, 0, 0]);
    // add
    let _data = data.slice();
    const newData = buildData(1, 20);
    _data.splice(1, 0, newData[0]);
    let type = recycleList.setData(_data);
    expect(type).toBe(KeysChangedType.Add);
    expect(_intervalTree).not.toBe(recycleList.intervalTree);
    _intervalTree = recycleList.intervalTree;
    expect(
      recycleList.intervalTree
        .getHeap()
        .slice(
          recycleList.intervalTree.getSize(),
          recycleList.intervalTree.getSize() + 10
        )
    ).toEqual([100, 0, 80, 100, 20, 100, 30, 100, 200, 0]);

    // remove
    _data = _data.slice();
    _data.splice(3, 1);
    type = recycleList.setData(_data);
    expect(type).toBe(KeysChangedType.Remove);
    expect(_intervalTree).not.toBe(recycleList.intervalTree);
    _intervalTree = recycleList.intervalTree;
    expect(
      recycleList.intervalTree
        .getHeap()
        .slice(
          recycleList.intervalTree.getSize(),
          recycleList.intervalTree.getSize() + 10
        )
    ).toEqual([100, 0, 80, 20, 100, 30, 100, 200, 0, 0]);

    // reorder
    _data = _data.slice();
    const data5 = _data[5];
    _data.splice(5, 1);
    _data.splice(7, 0, data5);
    type = recycleList.setData(_data);
    expect(type).toBe(KeysChangedType.Reorder);
    expect(_intervalTree).not.toBe(recycleList.intervalTree);
    _intervalTree = recycleList.intervalTree;
    expect(
      recycleList.intervalTree
        .getHeap()
        .slice(
          recycleList.intervalTree.getSize(),
          recycleList.intervalTree.getSize() + 10
        )
    ).toEqual([100, 0, 80, 20, 100, 100, 200, 30, 0, 0]);
  });
});

describe('lifecycle', () => {
  it('initialization - empty list', () => {
    const spaceList = new ListDimensions({
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      data: [],
      maxToRenderPerBatch: 7,
      windowSize: 9,
      initialNumToRender: 10,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });
    expect(spaceList.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });
    expect(spaceList.stateResult).toEqual([]);

    const recycleList = new ListDimensions({
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      data: [],
      recycleEnabled: true,
      maxToRenderPerBatch: 7,
      windowSize: 9,
      initialNumToRender: 10,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });
    expect(recycleList.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });
    expect(recycleList.stateResult).toEqual({
      recycleState: [],
      spaceState: [],
    });
  });

  it('initialization - data source', () => {
    const data = buildData(20);
    const spaceList = new ListDimensions({
      data,
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 9,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });
    expect(spaceList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    const spaceListStateResult = spaceList.stateResult as SpaceStateResult<any>;
    // {
    //   viewable: boolean;
    //   imageViewable: boolean;
    // }
    expect(spaceListStateResult.length).toBe(4);
    // expect(spaceListStateResult[0].viewable).toBe(true);
    // expect(spaceListStateResult[1].viewable).toBe(true);
    // expect(spaceListStateResult[2].viewable).toBe(true);
    // expect(spaceListStateResult[3].viewable).toBe(true);

    const recycleList = new ListDimensions({
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      data,
      recycleEnabled: true,
      maxToRenderPerBatch: 7,
      windowSize: 9,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    expect(recycleList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    const recycleListStateResult =
      recycleList.stateResult as RecycleStateResult<any>;

    expect(recycleListStateResult.spaceState.length).toBe(4);
    // expect(recycleListStateResult.spaceState[0].viewable).toBe(true);
    // expect(recycleListStateResult.spaceState[1].viewable).toBe(true);
    // expect(recycleListStateResult.spaceState[2].viewable).toBe(true);
    // expect(recycleListStateResult.spaceState[3].viewable).toBe(true);
  });

  it('initialization - update data source', () => {
    const data = buildData(20);
    const spaceList = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 9,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    expect(spaceList.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });

    spaceList.setData(data);

    expect(spaceList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    const spaceListStateResult = spaceList.stateResult as SpaceStateResult<any>;
    expect(spaceListStateResult.length).toBe(4);
    // expect(spaceListStateResult[0].viewable).toBe(true);
    // expect(spaceListStateResult[1].viewable).toBe(true);
    // expect(spaceListStateResult[2].viewable).toBe(true);
    // expect(spaceListStateResult[3].viewable).toBe(true);

    const recycleList = new ListDimensions({
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      data: [],
      recycleEnabled: true,
      maxToRenderPerBatch: 7,
      windowSize: 5,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    expect(recycleList.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });

    recycleList.setData(data);

    expect(recycleList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    const recycleListStateResult =
      recycleList.stateResult as RecycleStateResult<any>;

    expect(recycleListStateResult.spaceState.length).toBe(4);
    // expect(recycleListStateResult.spaceState[0].viewable).toBe(true);
    // expect(recycleListStateResult.spaceState[1].viewable).toBe(true);
    // expect(recycleListStateResult.spaceState[2].viewable).toBe(true);
    // expect(recycleListStateResult.spaceState[3].viewable).toBe(true);
  });

  it('initialization - update data source (initialNumToRender: 10)', () => {
    const data = buildData(100);
    const spaceList = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 5,
      initialNumToRender: 10,
      onEndReachedThreshold: 2,
      getItemLayout: (item, index) => ({
        length: 100,
        index,
      }),
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    expect(spaceList.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });

    spaceList.setData(data);

    expect(spaceList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 9,
      bufferedStartIndex: 0,
      bufferedEndIndex: 9,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 10),
      actionType: 'initial',
    });

    let spaceListStateResult = spaceList.stateResult as SpaceStateResult<any>;
    expect(spaceListStateResult.length).toBe(10);
    // expect(spaceListStateResult[0].viewable).toBe(true);
    // expect(spaceListStateResult[1].viewable).toBe(true);
    // expect(spaceListStateResult[2].viewable).toBe(true);
    // expect(spaceListStateResult[3].viewable).toBe(true);

    // @ts-ignore
    spaceList.updateScrollMetrics({
      offset: 3009,
      visibleLength: 926,
      contentLength: 10000,
    });

    expect(spaceList.state).toEqual({
      visibleStartIndex: 10,
      visibleEndIndex: 19,
      bufferedStartIndex: 0,
      bufferedEndIndex: 37,
      isEndReached: false,
      distanceFromEnd: 6065,
      data: data.slice(0, 100),
      actionType: 'recalculate',
    });

    expect(spaceList.stateResult[38].key).toBe(buildStateTokenIndexKey(38, 99));
    expect(spaceList.stateResult[38].length).toBe(6200);
    spaceListStateResult = spaceList.stateResult as SpaceStateResult<any>;
    // expect(spaceListStateResult[9].viewable).toBe(false);
    // expect(spaceListStateResult[10].viewable).toBe(true);
    // expect(spaceListStateResult[11].viewable).toBe(true);
    // expect(spaceListStateResult[12].viewable).toBe(true);
    // expect(spaceListStateResult[19].viewable).toBe(true);
    // expect(spaceListStateResult[20].viewable).toBe(false);
  });

  it('initialization - update data source (initialNumToRender: 10) and use viewabilityConfig', () => {
    const data = buildData(100);
    const spaceList = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 5,
      initialNumToRender: 10,
      onEndReachedThreshold: 2,
      getItemLayout: (item, index) => ({
        length: 100,
        index,
      }),
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            viewport: 1,
            name: 'imageViewable',
            viewAreaCoveragePercentThreshold: 20,
          },
        },
        {
          viewabilityConfig: {
            name: 'viewable',
            viewAreaCoveragePercentThreshold: 30,
          },
        },
      ],
    });

    expect(spaceList.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });

    spaceList.setData(data);

    expect(spaceList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 9,
      bufferedStartIndex: 0,
      bufferedEndIndex: 9,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 10),
      actionType: 'initial',
    });

    let spaceListStateResult = spaceList.stateResult as SpaceStateResult<any>;

    expect(spaceListStateResult.length).toBe(10);
    // expect(spaceListStateResult[0].viewable).toBe(true);
    // expect(spaceListStateResult[0].imageViewable).toBe(true);
    // expect(spaceListStateResult[1].viewable).toBe(true);
    // expect(spaceListStateResult[1].imageViewable).toBe(true);
    // expect(spaceListStateResult[2].viewable).toBe(true);
    // expect(spaceListStateResult[2].imageViewable).toBe(true);
    // expect(spaceListStateResult[3].viewable).toBe(true);
    // expect(spaceListStateResult[3].imageViewable).toBe(true);
    // expect(spaceListStateResult[9].viewable).toBe(true);
    // expect(spaceListStateResult[9].imageViewable).toBe(true);

    // @ts-ignore
    spaceList.updateScrollMetrics({
      offset: 3009,
      visibleLength: 926,
      contentLength: 10000,
    });

    expect(spaceList.state).toEqual({
      visibleStartIndex: 10,
      visibleEndIndex: 19,
      bufferedStartIndex: 0,
      bufferedEndIndex: 37,
      isEndReached: false,
      distanceFromEnd: 6065,
      data: data.slice(0, 100),
      actionType: 'recalculate',
    });

    expect(spaceList.stateResult[38].key).toBe(buildStateTokenIndexKey(38, 99));
    expect(spaceList.stateResult[38].length).toBe(6200);
    spaceListStateResult = spaceList.stateResult as SpaceStateResult<any>;

    // expect(spaceListStateResult[0].viewable).toBe(false);
    // // (2100 - (3009 - 926)) / 926 = 0.018
    // expect(spaceListStateResult[0].imageViewable).toBe(false);
    // expect(spaceListStateResult[1].viewable).toBe(false);
    // // (3009 - 926) < 2100 < (3009 + 926) entirely
    // expect(spaceListStateResult[1].imageViewable).toBe(true);
    // expect(spaceListStateResult[9].viewable).toBe(false);
    // expect(spaceListStateResult[9].imageViewable).toBe(true);
    // // (3100 - 3009) / 925 = 0.098
    // expect(spaceListStateResult[10].viewable).toBe(false);
    // expect(spaceListStateResult[10].imageViewable).toBe(true);
    // expect(spaceListStateResult[11].viewable).toBe(true);
    // expect(spaceListStateResult[11].imageViewable).toBe(true);
    // expect(spaceListStateResult[12].viewable).toBe(true);
    // expect(spaceListStateResult[12].imageViewable).toBe(true);
    // expect(spaceListStateResult[19].viewable).toBe(false);
    // expect(spaceListStateResult[19].imageViewable).toBe(true);
    // expect(spaceListStateResult[20].viewable).toBe(false);
    // expect(spaceListStateResult[20].imageViewable).toBe(true);
    // expect(spaceListStateResult[27].viewable).toBe(false);
    // // top: 2000 + 2700, bottom: 2000 + 2800; viewHeight = 3009 + 2 * 926 = 4861
    // expect(spaceListStateResult[27].imageViewable).toBe(true);
    // expect(spaceListStateResult[28].viewable).toBe(false);
    // // top: 2000 + 2800, bottom: 2000 + 2900; viewHeight = 3009 + 2 * 926 = 4861
    // // 61 / 926 = 0.0658
    // expect(spaceListStateResult[28].imageViewable).toBe(false);
  });

  // it('initialization - update data source (initialNumToRender: 10 and container offset: 2000 ) and use viewabilityConfig', () => {
  //   const data = buildData(100);
  //   const recycleList = new ListDimensions({
  //     data: [],
  //     id: 'list_group',
  //     recycleEnabled: true,
  //     keyExtractor: defaultKeyExtractor,
  //     maxToRenderPerBatch: 7,
  //     windowSize: 5,
  //     initialNumToRender: 10,
  //     onEndReachedThreshold: 2,
  //     getItemLayout: (item, index) => ({
  //       length: 100,
  //       index,
  //     }),
  //     getContainerLayout: () => ({
  //       x: 0,
  //       y: 2000,
  //       width: 375,
  //       height: 2000,
  //     }),
  //     viewabilityConfigCallbackPairs: [
  //       {
  //         viewabilityConfig: {
  //           viewport: 1,
  //           name: 'imageViewable',
  //           viewAreaCoveragePercentThreshold: 0,
  //         },
  //       },
  //       {
  //         viewabilityConfig: {
  //           name: 'viewable',
  //           viewAreaCoveragePercentThreshold: 0,
  //         },
  //       },
  //     ],
  //   });

  //   expect(recycleList.state).toEqual({
  //     visibleStartIndex: -1,
  //     visibleEndIndex: -1,
  //     bufferedStartIndex: -1,
  //     bufferedEndIndex: -1,
  //     isEndReached: false,
  //     distanceFromEnd: 0,
  //     data: [],
  //     actionType: 'initial',
  //   });

  //   recycleList.setData(data);

  //   expect(recycleList.state).toEqual({
  //     visibleStartIndex: 0,
  //     visibleEndIndex: 9,
  //     bufferedStartIndex: 0,
  //     bufferedEndIndex: 9,
  //     isEndReached: false,
  //     distanceFromEnd: 0,
  //     data: data.slice(0, 10),
  //     actionType: 'initial',
  //   });

  //   let recycleListStateResult =
  //     recycleList.stateResult as RecycleStateResult<any>;

  //   expect(recycleListStateResult.spaceState.length).toBe(10);
  //   expect(recycleListStateResult.recycleState.length).toBe(2);

  //   // expect(recycleListStateResult.spaceState.map((v) => v.viewable)).toEqual([
  //   //   true,
  //   //   true,
  //   //   true,
  //   //   true,
  //   //   true,
  //   //   true,
  //   //   true,
  //   //   true,
  //   //   true,
  //   //   true,
  //   // ]);
  //   // expect(
  //   //   recycleListStateResult.spaceState.map((v) => v.imageViewable)
  //   // ).toEqual([true, true, true, true, true, true, true, true, true, true]);

  //   // @ts-ignore
  //   recycleList.updateScrollMetrics({
  //     offset: 0,
  //     visibleLength: 926,
  //     contentLength: 1000,
  //   });

  //   expect(recycleList.state).toEqual({
  //     visibleStartIndex: -1,
  //     visibleEndIndex: -1,
  //     bufferedStartIndex: 0,
  //     bufferedEndIndex: 14,
  //     isEndReached: true,
  //     distanceFromEnd: 74,
  //     data: data.slice(0, 100),
  //     actionType: 'hydrationWithBatchUpdate',
  //   });

  //   recycleListStateResult = recycleList.stateResult as RecycleStateResult<any>;

  //   expect(recycleListStateResult.spaceState.length).toBe(11);
  //   expect(recycleListStateResult.spaceState[10].key).toBe(
  //     buildStateTokenIndexKey(10, 99)
  //   );
  //   expect(recycleListStateResult.spaceState[10].length).toBe(9000);

  //   expect(recycleListStateResult.recycleState.length).toBe(2);

  //   // @ts-ignore
  //   recycleList.updateScrollMetrics({
  //     offset: 0,
  //     visibleLength: 926,
  //     contentLength: 1200,
  //   });

  //   expect(recycleList.state).toEqual({
  //     visibleStartIndex: -1,
  //     visibleEndIndex: -1,
  //     bufferedStartIndex: 0,
  //     bufferedEndIndex: 14,
  //     isEndReached: true,
  //     distanceFromEnd: 74,
  //     data: data.slice(0, 100),
  //     actionType: 'hydrationWithBatchUpdate',
  //   });

  //   recycleListStateResult = recycleList.stateResult as RecycleStateResult<any>;

  //   expect(recycleListStateResult.recycleState.length).toBe(2);

  //   expect(recycleListStateResult.recycleState.map((v) => v.item.key)).toEqual([
  //     10, 11,
  //   ]);
  //   expect(recycleListStateResult.recycleState.map((v) => v.key)).toEqual([
  //     'recycle_0',
  //     'recycle_1',
  //     // 'recycle_2',
  //     // 'recycle_3',
  //   ]);
  //   // expect(recycleListStateResult.recycleState.map((v) => v.viewable)).toEqual(
  //   //   []
  //   // );
  //   // expect(
  //   //   recycleListStateResult.recycleState.map((v) => v.imageViewable)
  //   // ).toEqual([]);

  //   // @ts-ignore
  //   recycleList.updateScrollMetrics({
  //     offset: 3000,
  //     visibleLength: 926,
  //     contentLength: 4500,
  //   });

  //   recycleListStateResult = recycleList.stateResult as RecycleStateResult<any>;

  //   expect(recycleList.state).toEqual({
  //     isEndReached: true,
  //     distanceFromEnd: 574,
  //     actionType: 'hydrationWithBatchUpdate',
  //     visibleStartIndex: 9,
  //     visibleEndIndex: 19,
  //     bufferedStartIndex: 0,
  //     bufferedEndIndex: 44,
  //     data,
  //   });

  //   expect(recycleListStateResult.recycleState.map((v) => v.item.key)).toEqual([
  //     10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  //   ]);

  //   // @ts-ignore
  //   recycleList.updateScrollMetrics({
  //     offset: 2700,
  //     visibleLength: 926,
  //     contentLength: 4500,
  //   });

  //   recycleListStateResult = recycleList.stateResult as RecycleStateResult<any>;

  //   expect(recycleList.state).toEqual({
  //     isEndReached: true,
  //     distanceFromEnd: 874,
  //     actionType: 'hydrationWithBatchUpdate',
  //     visibleStartIndex: 6,
  //     visibleEndIndex: 16,
  //     bufferedStartIndex: 0,
  //     bufferedEndIndex: 44,
  //     data,
  //   });

  //   expect(recycleListStateResult.recycleState.map((v) => v.item.key)).toEqual([
  //     10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  //   ]);

  //   expect(recycleListStateResult.recycleState.map((v) => v.offset)).toEqual([
  //     1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100,
  //   ]);

  //   expect(recycleListStateResult.recycleState.map((v) => v.key)).toEqual([
  //     'recycle_0',
  //     'recycle_1',
  //     'recycle_2',
  //     'recycle_3',
  //     'recycle_4',
  //     'recycle_5',
  //     'recycle_6',
  //     'recycle_7',
  //     'recycle_8',
  //     'recycle_9',
  //     'recycle_10',
  //     'recycle_11',
  //   ]);

  //   // @ts-ignore
  //   recycleList.updateScrollMetrics({
  //     offset: 3500,
  //     visibleLength: 926,
  //     contentLength: 4500,
  //   });

  //   expect(recycleList.state).toEqual({
  //     isEndReached: true,
  //     distanceFromEnd: 74,
  //     actionType: 'hydrationWithBatchUpdate',
  //     visibleStartIndex: 14,
  //     visibleEndIndex: 24,
  //     bufferedStartIndex: 0,
  //     bufferedEndIndex: 49,
  //     data,
  //   });

  //   expect(
  //     (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
  //       (v) => v.item.key
  //     )
  //   ).toEqual([
  //     // 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  //     24, 25, 26, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  //     // 24, 25, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26,
  //   ]);
  //   expect(
  //     (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
  //       (v) => v.offset
  //     )
  //   ).toEqual([
  //     // 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100,
  //     2400, 2500, 2600, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100,
  //     2200, 2300,
  //   ]);

  //   expect(
  //     (recycleList.stateResult as RecycleStateResult<any>).spaceState.length
  //   ).toBe(11);
  //   expect(
  //     (recycleList.stateResult as RecycleStateResult<any>).spaceState.map(
  //       (v) => v.key
  //     )
  //   ).toEqual([
  //     '0',
  //     '1',
  //     '2',
  //     '3',
  //     '4',
  //     '5',
  //     '6',
  //     '7',
  //     '8',
  //     '9',
  //     'space_10_99',
  //   ]);
  //   expect(
  //     (recycleList.stateResult as RecycleStateResult<any>).spaceState.map(
  //       (v) => v.length
  //     )
  //   ).toEqual([100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 9000]);

  //   // @ts-ignore
  //   recycleList.updateScrollMetrics({
  //     offset: 6000,
  //     visibleLength: 926,
  //     contentLength: 4500,
  //   });

  //   expect(
  //     (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
  //       (v) => v.item.key
  //     )
  //   ).toEqual([50, 51, 26, 39, 40, 41, 42, 43, 44, 45, 46, 47, 37, 38]);
  //   expect(
  //     (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
  //       (v) => v.offset
  //     )
  //   ).toEqual([
  //     5000, 5100, 2600, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600, 4700,
  //     3700, 3800,
  //   ]);

  //   // @ts-ignore
  //   recycleList.updateScrollMetrics({
  //     offset: 5400,
  //     visibleLength: 926,
  //     contentLength: 4500,
  //     velocity: -0.5,
  //   });

  //   expect(
  //     (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
  //       (v) => v.item.key
  //     )
  //   ).toEqual([34, 33, 26, 39, 40, 41, 42, 43, 44, 45, 36, 35, 37, 38]);
  //   expect(
  //     (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
  //       (v) => v.offset
  //     )
  //   ).toEqual([
  //     3400, 3300, 2600, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 3600, 3500,
  //     3700, 3800,
  //   ]);
  // });
});

describe('data update', () => {
  beforeEach(() => {
    // tell vitest we use mocked time
    vi.useFakeTimers();
  });
  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers();
  });
  it('insert a data item', () => {
    const data = buildData(20);
    const recycleList = new ListDimensions({
      data: [],
      id: 'list_group',
      recycleEnabled: true,
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 10,
      windowSize: 5,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
      getItemLayout: (data, index) => ({
        length: 100,
        index,
      }),
    });
    recycleList.setData(data);

    expect(recycleList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    // @ts-ignore
    recycleList.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 0,
    });

    let recycleListStateResult =
      recycleList.stateResult as RecycleStateResult<any>;

    // offset should be recalculate
    expect(recycleListStateResult.recycleState[0].offset).toBe(400);
    // the forth as first item in recycleState
    expect(recycleListStateResult.recycleState[0].targetKey).toBe('4');

    const _data = data.slice();
    const newData = buildData(1, 20);
    _data.splice(1, 0, newData[0]);
    recycleList.setData(_data);
    vi.runAllTimers();

    recycleListStateResult = recycleList.stateResult as RecycleStateResult<any>;
    // offset should be recalculate
    expect(recycleListStateResult.recycleState[0].offset).toBe(400);
    // the third as first item in recycleState
    expect(recycleListStateResult.recycleState[0].targetKey).toBe('3');
  });

  it('insert a data item with dynamic layout', () => {
    const data = buildData(20);
    const recycleList = new ListDimensions({
      data: [],
      id: 'list_group',
      recycleEnabled: true,
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 10,
      windowSize: 5,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });
    recycleList.setData(data);

    expect(recycleList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    recycleList.setKeyItemLayout('0', 100);
    recycleList.setKeyItemLayout('1', 80);
    recycleList.setKeyItemLayout('2', 100);
    recycleList.setKeyItemLayout('3', 20);

    // @ts-ignore
    recycleList.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 0,
    });

    recycleList.setKeyItemLayout('4', 100);
    recycleList.setKeyItemLayout('5', 30);
    recycleList.setKeyItemLayout('6', 100);
    recycleList.setKeyItemLayout('7', 200);
    recycleList.setKeyItemLayout('8', 100);
    recycleList.setKeyItemLayout('9', 100);
    recycleList.setKeyItemLayout('10', 100);
    recycleList.setKeyItemLayout('11', 100);
    recycleList.setKeyItemLayout('12', 100);
    recycleList.setKeyItemLayout('13', 100);

    let recycleListStateResult =
      recycleList.stateResult as RecycleStateResult<any>;

    // offset should be recalculate
    expect(recycleListStateResult.recycleState[0].offset).toBe(300);
    // the forth as first item in recycleState
    expect(recycleListStateResult.recycleState[0].targetKey).toBe('4');

    const _data = data.slice();
    const newData = buildData(1, 20);
    _data.splice(1, 0, newData[0]);
    recycleList.setData(_data);
    vi.runAllTimers();

    recycleListStateResult = recycleList.stateResult as RecycleStateResult<any>;

    // offset should be recalculate
    expect(recycleListStateResult.recycleState[0].offset).toBe(280);
    // the third as first item in recycleState
    expect(recycleListStateResult.recycleState[0].targetKey).toBe('3');
  });

  it('delete a data item (without layout): setData will trigger state update', () => {
    const data = buildData(20);
    const spaceList = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 10,
      windowSize: 5,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });
    spaceList.setData(data);

    expect(spaceList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    // @ts-ignore
    spaceList.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 0,
    });

    expect(spaceList.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: 0,
      bufferedEndIndex: 9,
      isEndReached: true,
      distanceFromEnd: -926,
      data: data.slice(0, 10),
      actionType: 'hydrationWithBatchUpdate',
    });

    const _data = data.slice();
    _data.splice(1, 1);

    spaceList.setData(_data);
    vi.runAllTimers();

    expect(spaceList.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: 0,
      bufferedEndIndex: 9,
      isEndReached: true,
      distanceFromEnd: -926,
      data: [].concat(data[0], data.slice(2, 11)),
      actionType: 'hydrationWithBatchUpdate',
    });
  });

  it('delete a data item (with layout): setData will trigger state update', () => {
    const data = buildData(20);
    const spaceList = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 10,
      windowSize: 5,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getItemLayout: (data, index) => ({
        length: 100,
        index,
      }),
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });
    spaceList.setData(data);

    expect(spaceList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    // @ts-ignore
    spaceList.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 0,
    });

    expect(spaceList.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: 0,
      bufferedEndIndex: 9,
      isEndReached: true,
      distanceFromEnd: -926,
      data: data.slice(),
      actionType: 'hydrationWithBatchUpdate',
    });

    const _data = data.slice();
    _data.splice(1, 1);

    spaceList.setData(_data);
    vi.runAllTimers();

    // data should be updated
    expect(spaceList.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: 0,
      bufferedEndIndex: 9,
      isEndReached: true,
      distanceFromEnd: -926,
      data: [].concat(data[0], data.slice(2)),
      actionType: 'hydrationWithBatchUpdate',
    });
  });
});

describe('updateScrollMetrics', () => {
  it('setData will trigger updateScrollMetrics', () => {
    const data = buildData(100);

    const list = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 2,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 0,
        width: 375,
        height: 2000,
      }),
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            viewport: 1,
            name: 'imageViewable',
            viewAreaCoveragePercentThreshold: 20,
          },
        },
        {
          viewabilityConfig: {
            name: 'viewable',
            viewAreaCoveragePercentThreshold: 30,
          },
        },
      ],
    });

    expect(list.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });

    list.setData(data);

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });
  });

  it('setKeyItemLayout will not trigger updateScrollMetrics', () => {
    const data = buildData(100);

    const list = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 2,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 0,
        width: 375,
        height: 2000,
      }),
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            viewport: 1,
            name: 'imageViewable',
            viewAreaCoveragePercentThreshold: 20,
          },
        },
        {
          viewabilityConfig: {
            name: 'viewable',
            viewAreaCoveragePercentThreshold: 30,
          },
        },
      ],
    });

    expect(list.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });

    list.setData(data);

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    list.setKeyItemLayout('3', 100);

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1000,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 7,
      isEndReached: true,
      distanceFromEnd: 74,
      data: data.slice(0, 8),
      actionType: 'hydrationWithBatchUpdate',
    });
  });

  it('If offset, visibleLength, contentLength not change, updateScrollMetrics will use `state` directly', () => {
    const data = buildData(100);

    const list = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 2,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 0,
        width: 375,
        height: 2000,
      }),
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            viewport: 1,
            name: 'imageViewable',
            viewAreaCoveragePercentThreshold: 20,
          },
        },
        {
          viewabilityConfig: {
            name: 'viewable',
            viewAreaCoveragePercentThreshold: 30,
          },
        },
      ],
    });

    expect(list.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });

    list.setData(data);

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    list.setKeyItemLayout('3', 100);

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1000,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 7,
      isEndReached: true,
      distanceFromEnd: 74,
      data: data.slice(0, 8),
      actionType: 'hydrationWithBatchUpdate',
    });

    list.setKeyItemLayout('4', 100);

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1000,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 7,
      isEndReached: true,
      distanceFromEnd: 74,
      data: data.slice(0, 8),
      actionType: 'hydrationWithBatchUpdate',
    });

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1001,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 4,
      bufferedStartIndex: 0,
      bufferedEndIndex: 8,
      isEndReached: true,
      distanceFromEnd: 75,
      data: data.slice(0, 9),
      actionType: 'hydrationWithBatchUpdate',
    });
  });

  it('Usage of `_offsetTriggerCachedState`, ', () => {
    const data = buildData(100);

    const list = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 2,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 0,
        width: 375,
        height: 2000,
      }),
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            viewport: 1,
            name: 'imageViewable',
            viewAreaCoveragePercentThreshold: 20,
          },
        },
        {
          viewabilityConfig: {
            name: 'viewable',
            viewAreaCoveragePercentThreshold: 30,
          },
        },
      ],
    });

    expect(list.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });

    list.setData(data);

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    list.setKeyItemLayout('3', 100);

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1000,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 7,
      isEndReached: true,
      distanceFromEnd: 74,
      data: data.slice(0, 8),
      actionType: 'hydrationWithBatchUpdate',
    });

    // to simulate _offsetTriggerCachedState not set, update scrollMetrics only
    // @ts-ignore
    list.scrollMetrics = {
      offset: 1,
      visibleLength: 926,
      contentLength: 1000,
    };

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 1,
      visibleLength: 926,
      contentLength: 1000,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 3,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 10,
      isEndReached: true,
      distanceFromEnd: 73,
      data: data.slice(0, 11),
      actionType: 'hydrationWithBatchUpdate',
    });
  });
});
