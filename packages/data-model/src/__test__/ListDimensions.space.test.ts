import ListDimensions from '../ListDimensions';
import Batchinator from '@x-oasis/batchinator';
import { KeysChangedType, SpaceStateResult } from '../types';
import { defaultKeyExtractor } from '../exportedUtils';
import { vi, describe, it, expect } from 'vitest';
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
      expect(meta.getLayout()).toEqual({
        x: 0,
        y: 0,
        height: 80,
        width: 0,
      });
    });
    expect(listDimensions.getReflowItemsLength()).toBe(10);
  });
});

describe('resolve space state', () => {
  it.only('basic output state', () => {
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

    console.log('state =====', stateResult);

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

    console.log(' stateResult ', stateResult);

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
  });
});
