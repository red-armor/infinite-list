import ListDimensions from '../ListDimensions';
import Batchinator from '@x-oasis/batchinator';
import {
  KeysChangedType,
  SpaceStateResult,
  RecycleStateResult,
} from '../types';
import { defaultKeyExtractor } from '../exportedUtils';
import { buildStateTokenIndexKey } from '../common';
import { vi, describe, it, expect } from 'vitest';
const buildData = (count: number) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index,
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
    expect(stateResult[21].viewable).toBe(false);
    expect(stateResult[22].viewable).toBe(true);
    expect(stateResult[31].viewable).toBe(true);
    expect(stateResult[32].viewable).toBe(false);
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

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1100,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 9,
      bufferedStartIndex: 0,
      bufferedEndIndex: 17,
      isEndReached: true,
      distanceFromEnd: 174,
      data: data.slice(0, 100),
      actionType: 'hydrationWithBatchUpdate',
    });
    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1200,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 9,
      bufferedStartIndex: 0,
      bufferedEndIndex: 18,
      isEndReached: true,
      distanceFromEnd: 274,
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
    expect(stateResult[8].viewable).toBe(false);
    expect(stateResult[9].viewable).toBe(true);
    expect(stateResult[19].viewable).toBe(true);
    expect(stateResult[20].viewable).toBe(false);
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

    const stateResult = listDimensions.stateResult as SpaceStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;

    expect(stateResult.length).toBe(39);
    expect(stateResult[8].viewable).toBe(false);
    expect(stateResult[9].viewable).toBe(true);
    expect(stateResult[19].viewable).toBe(true);
    expect(stateResult[20].viewable).toBe(false);
    expect(stateResult[8].imageViewable).toBe(false);
    expect(stateResult[9].imageViewable).toBe(true);
    expect(stateResult[19].imageViewable).toBe(true);
    expect(stateResult[20].imageViewable).toBe(false);
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

    const stateResult = listDimensions.stateResult as SpaceStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;

    expect(stateResult.length).toBe(39);
    expect(stateResult[0].viewable).toBe(false);
    expect(stateResult[0].imageViewable).toBe(true);
    expect(stateResult[8].viewable).toBe(false);
    expect(stateResult[8].imageViewable).toBe(true);
    expect(stateResult[9].viewable).toBe(true);
    expect(stateResult[9].imageViewable).toBe(true);
    expect(stateResult[19].viewable).toBe(true);
    expect(stateResult[19].imageViewable).toBe(true);
    expect(stateResult[20].viewable).toBe(false);
    expect(stateResult[20].imageViewable).toBe(true);
    expect(stateResult[28].viewable).toBe(false);
    expect(stateResult[28].imageViewable).toBe(true);
    expect(stateResult[29].viewable).toBe(false);
    expect(stateResult[29].imageViewable).toBe(false);
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

    const spaceListStateResult = spaceList.stateResult as SpaceStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;
    expect(spaceListStateResult.length).toBe(4);
    expect(spaceListStateResult[0].viewable).toBe(true);
    expect(spaceListStateResult[1].viewable).toBe(true);
    expect(spaceListStateResult[2].viewable).toBe(true);
    expect(spaceListStateResult[3].viewable).toBe(true);

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
      recycleList.stateResult as RecycleStateResult<
        any,
        {
          viewable: boolean;
          imageViewable: boolean;
        }
      >;

    expect(recycleListStateResult.spaceState.length).toBe(4);
    expect(recycleListStateResult.spaceState[0].viewable).toBe(true);
    expect(recycleListStateResult.spaceState[1].viewable).toBe(true);
    expect(recycleListStateResult.spaceState[2].viewable).toBe(true);
    expect(recycleListStateResult.spaceState[3].viewable).toBe(true);
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

    const spaceListStateResult = spaceList.stateResult as SpaceStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;
    expect(spaceListStateResult.length).toBe(4);
    expect(spaceListStateResult[0].viewable).toBe(true);
    expect(spaceListStateResult[1].viewable).toBe(true);
    expect(spaceListStateResult[2].viewable).toBe(true);
    expect(spaceListStateResult[3].viewable).toBe(true);

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
      recycleList.stateResult as RecycleStateResult<
        any,
        {
          viewable: boolean;
          imageViewable: boolean;
        }
      >;

    expect(recycleListStateResult.spaceState.length).toBe(4);
    expect(recycleListStateResult.spaceState[0].viewable).toBe(true);
    expect(recycleListStateResult.spaceState[1].viewable).toBe(true);
    expect(recycleListStateResult.spaceState[2].viewable).toBe(true);
    expect(recycleListStateResult.spaceState[3].viewable).toBe(true);
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

    let spaceListStateResult = spaceList.stateResult as SpaceStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;
    expect(spaceListStateResult.length).toBe(10);
    expect(spaceListStateResult[0].viewable).toBe(true);
    expect(spaceListStateResult[1].viewable).toBe(true);
    expect(spaceListStateResult[2].viewable).toBe(true);
    expect(spaceListStateResult[3].viewable).toBe(true);

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
    spaceListStateResult = spaceList.stateResult as SpaceStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;
    expect(spaceListStateResult[9].viewable).toBe(false);
    expect(spaceListStateResult[10].viewable).toBe(true);
    expect(spaceListStateResult[11].viewable).toBe(true);
    expect(spaceListStateResult[12].viewable).toBe(true);
    expect(spaceListStateResult[19].viewable).toBe(true);
    expect(spaceListStateResult[20].viewable).toBe(false);
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

    let spaceListStateResult = spaceList.stateResult as SpaceStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;

    expect(spaceListStateResult.length).toBe(10);
    expect(spaceListStateResult[0].viewable).toBe(true);
    expect(spaceListStateResult[0].imageViewable).toBe(true);
    expect(spaceListStateResult[1].viewable).toBe(true);
    expect(spaceListStateResult[1].imageViewable).toBe(true);
    expect(spaceListStateResult[2].viewable).toBe(true);
    expect(spaceListStateResult[2].imageViewable).toBe(true);
    expect(spaceListStateResult[3].viewable).toBe(true);
    expect(spaceListStateResult[3].imageViewable).toBe(true);
    expect(spaceListStateResult[9].viewable).toBe(true);
    expect(spaceListStateResult[9].imageViewable).toBe(true);

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
    spaceListStateResult = spaceList.stateResult as SpaceStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;

    expect(spaceListStateResult[0].viewable).toBe(false);
    // (2100 - (3009 - 926)) / 926 = 0.018
    expect(spaceListStateResult[0].imageViewable).toBe(false);
    expect(spaceListStateResult[1].viewable).toBe(false);
    // (3009 - 926) < 2100 < (3009 + 926) entirely
    expect(spaceListStateResult[1].imageViewable).toBe(true);
    expect(spaceListStateResult[9].viewable).toBe(false);
    expect(spaceListStateResult[9].imageViewable).toBe(true);
    // (3100 - 3009) / 925 = 0.098
    expect(spaceListStateResult[10].viewable).toBe(false);
    expect(spaceListStateResult[10].imageViewable).toBe(true);
    expect(spaceListStateResult[11].viewable).toBe(true);
    expect(spaceListStateResult[11].imageViewable).toBe(true);
    expect(spaceListStateResult[12].viewable).toBe(true);
    expect(spaceListStateResult[12].imageViewable).toBe(true);
    expect(spaceListStateResult[19].viewable).toBe(false);
    expect(spaceListStateResult[19].imageViewable).toBe(true);
    expect(spaceListStateResult[20].viewable).toBe(false);
    expect(spaceListStateResult[20].imageViewable).toBe(true);
    expect(spaceListStateResult[27].viewable).toBe(false);
    // top: 2000 + 2700, bottom: 2000 + 2800; viewHeight = 3009 + 2 * 926 = 4861
    expect(spaceListStateResult[27].imageViewable).toBe(true);
    expect(spaceListStateResult[28].viewable).toBe(false);
    // top: 2000 + 2800, bottom: 2000 + 2900; viewHeight = 3009 + 2 * 926 = 4861
    // 61 / 926 = 0.0658
    expect(spaceListStateResult[28].imageViewable).toBe(false);
  });

  it('initialization - update data source (initialNumToRender: 10) and use viewabilityConfig', () => {
    const data = buildData(100);
    const recycleList = new ListDimensions({
      data: [],
      id: 'list_group',
      recycleEnabled: true,
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
        y: 0,
        width: 375,
        height: 2000,
      }),
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            viewport: 1,
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
      visibleEndIndex: 9,
      bufferedStartIndex: 0,
      bufferedEndIndex: 9,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 10),
      actionType: 'initial',
    });

    let recycleListStateResult = recycleList.stateResult as RecycleStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;

    expect(recycleListStateResult.spaceState.length).toBe(10);
    expect(recycleListStateResult.recycleState.length).toBe(0);

    expect(recycleListStateResult.spaceState.map((v) => v.viewable)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(
      recycleListStateResult.spaceState.map((v) => v.imageViewable)
    ).toEqual([true, true, true, true, true, true, true, true, true, true]);

    // @ts-ignore
    recycleList.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1000,
    });

    expect(recycleList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 9,
      bufferedStartIndex: 0,
      bufferedEndIndex: 16,
      isEndReached: true,
      distanceFromEnd: 74,
      data: data.slice(0, 100),
      actionType: 'hydrationWithBatchUpdate',
    });

    recycleListStateResult = recycleList.stateResult as RecycleStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;

    expect(recycleListStateResult.spaceState.length).toBe(11);
    expect(recycleListStateResult.spaceState[10].key).toBe(
      buildStateTokenIndexKey(10, 99)
    );
    expect(recycleListStateResult.spaceState[10].length).toBe(9000);

    expect(recycleListStateResult.recycleState.length).toBe(2);

    // @ts-ignore
    recycleList.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1200,
    });

    expect(recycleList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 9,
      bufferedStartIndex: 0,
      bufferedEndIndex: 18,
      isEndReached: true,
      distanceFromEnd: 274,
      data: data.slice(0, 100),
      actionType: 'hydrationWithBatchUpdate',
    });

    recycleListStateResult = recycleList.stateResult as RecycleStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;

    expect(recycleListStateResult.recycleState.length).toBe(2);

    expect(recycleListStateResult.recycleState.map((v) => v.item.key)).toEqual([
      10, 11,
    ]);
    expect(recycleListStateResult.recycleState.map((v) => v.key)).toEqual([
      'recycle_0',
      'recycle_1',
    ]);
    expect(recycleListStateResult.recycleState.map((v) => v.viewable)).toEqual([
      false,
      false,
    ]);
    expect(
      recycleListStateResult.recycleState.map((v) => v.imageViewable)
    ).toEqual([true, true]);

    // @ts-ignore
    recycleList.updateScrollMetrics({
      offset: 3000,
      visibleLength: 926,
      contentLength: 4500,
    });

    recycleListStateResult = recycleList.stateResult as RecycleStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;

    expect(recycleList.state).toEqual({
      isEndReached: true,
      distanceFromEnd: 574,
      actionType: 'hydrationWithBatchUpdate',
      visibleStartIndex: 29,
      visibleEndIndex: 39,
      bufferedStartIndex: 11,
      bufferedEndIndex: 51,
      data,
    });
    expect(recycleListStateResult.recycleState.map((v) => v.item.key)).toEqual([
      41, 11, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    ]);

    // @ts-ignore
    recycleList.updateScrollMetrics({
      offset: 2700,
      visibleLength: 926,
      contentLength: 4500,
    });

    recycleListStateResult = recycleList.stateResult as RecycleStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;

    expect(recycleList.state).toEqual({
      isEndReached: true,
      distanceFromEnd: 874,
      actionType: 'hydrationWithBatchUpdate',
      visibleStartIndex: 26,
      visibleEndIndex: 36,
      bufferedStartIndex: 8,
      bufferedEndIndex: 51,
      data,
    });

    expect(recycleListStateResult.recycleState.map((v) => v.item.key)).toEqual([
      27, 26, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 28,
    ]);
    expect(recycleListStateResult.recycleState.map((v) => v.offset)).toEqual([
      2700, 2600, 2900, 3000, 3100, 3200, 3300, 3400, 3500, 3600, 3700, 3800,
      3900, 2800,
    ]);

    expect(recycleListStateResult.recycleState.map((v) => v.key)).toEqual([
      'recycle_0',
      'recycle_1',
      'recycle_2',
      'recycle_3',
      'recycle_4',
      'recycle_5',
      'recycle_6',
      'recycle_7',
      'recycle_8',
      'recycle_9',
      'recycle_10',
      'recycle_11',
      'recycle_12',
      'recycle_13',
    ]);
    expect(recycleListStateResult.recycleState.map((v) => v.viewable)).toEqual([
      true,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      true,
    ]);
    expect(
      recycleListStateResult.recycleState.map((v) => v.imageViewable)
    ).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);

    expect(recycleListStateResult.spaceState.length).toBe(4);
    expect(recycleListStateResult.spaceState.map((v) => v.key)).toEqual([
      'space_0_7',
      '8',
      '9',
      'space_10_99',
    ]);
    expect(recycleListStateResult.spaceState.map((v) => v.length)).toEqual([
      800, 100, 100, 9000,
    ]);

    // @ts-ignore
    recycleList.updateScrollMetrics({
      offset: 5000,
      visibleLength: 926,
      contentLength: 6500,
    });

    recycleListStateResult = recycleList.stateResult as RecycleStateResult<
      any,
      {
        viewable: boolean;
        imageViewable: boolean;
      }
    >;
    expect(recycleList.state).toEqual({
      isEndReached: true,
      distanceFromEnd: 574,
      actionType: 'hydrationWithBatchUpdate',
      visibleStartIndex: 49,
      visibleEndIndex: 59,
      bufferedStartIndex: 31,
      bufferedEndIndex: 71,
      data,
    });

    expect(recycleListStateResult.recycleState.map((v) => v.item.key)).toEqual([
      50, 49, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 39, 51,
    ]);

    expect(recycleListStateResult.recycleState.map((v) => v.offset)).toEqual([
      5000, 4900, 5200, 5300, 5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100,
      3900, 5100,
    ]);

    expect(recycleListStateResult.recycleState.map((v) => v.key)).toEqual([
      'recycle_0',
      'recycle_1',
      'recycle_2',
      'recycle_3',
      'recycle_4',
      'recycle_5',
      'recycle_6',
      'recycle_7',
      'recycle_8',
      'recycle_9',
      'recycle_10',
      'recycle_11',
      'recycle_12',
      'recycle_13',
    ]);
    expect(recycleListStateResult.recycleState.map((v) => v.viewable)).toEqual([
      true,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      true,
    ]);
    expect(
      recycleListStateResult.recycleState.map((v) => v.imageViewable)
    ).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      true,
    ]);
    expect(recycleListStateResult.spaceState.length).toBe(2);
    expect(recycleListStateResult.spaceState.map((v) => v.key)).toEqual([
      'space_0_9',
      'space_10_99',
    ]);
    expect(recycleListStateResult.spaceState.map((v) => v.length)).toEqual([
      1000, 9000,
    ]);
  });
});
