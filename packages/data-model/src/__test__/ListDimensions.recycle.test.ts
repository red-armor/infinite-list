import ListDimensions from '../ListDimensions';
import Batchinator from '@x-oasis/batchinator';
import { KeysChangedType, RecycleStateResult } from '../types';
import { defaultKeyExtractor } from '../exportedUtils';
import { resetContext } from '../ItemMeta';
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
  beforeEach(() => {
    resetContext();
  });

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

describe('setData', () => {
  beforeEach(() => {
    resetContext();
  });
  it('initial', () => {
    const data = buildData(20);
    const recycleList = new ListDimensions<{ key: number }>({
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
    const _intervalTree = recycleList.getIntervalTree();
    const type = recycleList.setData(data);
    expect(type).toBe(KeysChangedType.Initial);
    // on initial interval tree should not change.
    expect(_intervalTree).toBe(recycleList.getIntervalTree());
  });

  it('append', () => {
    const data = buildData(20);
    const recycleList = new ListDimensions<{ key: number }>({
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

    const _intervalTree = recycleList.getIntervalTree();
    expect(recycleList.getFinalIndexItemLength(19)).toBe(100);
    const newData = [].concat(data, buildData(1, 20));

    const type = recycleList.setData(newData);

    expect(type).toBe(KeysChangedType.Append);
    // on initial interval tree should not change.
    expect(_intervalTree).toBe(recycleList.getIntervalTree());
    expect(recycleList.getFinalIndexItemLength(19)).toBe(120);
    expect(recycleList.getFinalIndexItemLength(20)).toBe(100);
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

    const _intervalTree = recycleList.getIntervalTree();
    expect(recycleList.getFinalIndexItemLength(19)).toBe(100);
    const newData = [].concat(data, buildData(10, 19));

    const type = recycleList.setData(newData);

    expect(type).toBe(KeysChangedType.Append);
    expect(recycleList.getData().length).toBe(29);
    // on initial interval tree should not change.
    expect(_intervalTree).toBe(recycleList.getIntervalTree());
    expect(recycleList.getKeyIndex('20')).toBe(20);
    expect(recycleList.getIntervalTree().getHeap()[1]).toBe(3460);
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
      useItemApproximateLength: false,
    });

    let _intervalTree = recycleList.getIntervalTree();
    expect(recycleList.getFinalIndexItemLength(19)).toBe(0);
    recycleList.setFinalKeyItemLayout('0', 100);
    recycleList.setFinalKeyItemLayout('1', 80);
    recycleList.setFinalKeyItemLayout('2', 100);
    recycleList.setFinalKeyItemLayout('3', 20);
    recycleList.setFinalKeyItemLayout('4', 100);
    recycleList.setFinalKeyItemLayout('5', 30);
    recycleList.setFinalKeyItemLayout('6', 100);
    recycleList.setFinalKeyItemLayout('7', 200);
    expect(
      recycleList
        .getIntervalTree()
        .getHeap()
        .slice(
          recycleList.getIntervalTree().getSize(),
          recycleList.getIntervalTree().getSize() + 10
        )
    ).toEqual([100, 80, 100, 20, 100, 30, 100, 200, 0, 0]);
    // add
    let _data = data.slice();
    const newData = buildData(1, 20);
    _data.splice(1, 0, newData[0]);
    let type = recycleList.setData(_data);
    expect(type).toBe(KeysChangedType.Add);
    expect(_intervalTree).not.toBe(recycleList.getIntervalTree());
    _intervalTree = recycleList.getIntervalTree();
    expect(
      recycleList
        .getIntervalTree()
        .getHeap()
        .slice(
          recycleList.getIntervalTree().getSize(),
          recycleList.getIntervalTree().getSize() + 10
        )
    ).toEqual([100, 0, 80, 100, 20, 100, 30, 100, 200, 0]);

    // remove
    _data = _data.slice();
    _data.splice(3, 1);
    type = recycleList.setData(_data);
    expect(type).toBe(KeysChangedType.Remove);
    expect(_intervalTree).not.toBe(recycleList.getIntervalTree());
    _intervalTree = recycleList.getIntervalTree();
    expect(
      recycleList
        .getIntervalTree()
        .getHeap()
        .slice(
          recycleList.getIntervalTree().getSize(),
          recycleList.getIntervalTree().getSize() + 10
        )
    ).toEqual([100, 0, 80, 20, 100, 30, 100, 200, 0, 0]);

    // reorder
    _data = _data.slice();
    const data5 = _data[5];
    _data.splice(5, 1);
    _data.splice(7, 0, data5);
    type = recycleList.setData(_data);
    expect(type).toBe(KeysChangedType.Reorder);
    expect(_intervalTree).not.toBe(recycleList.getIntervalTree());
    _intervalTree = recycleList.getIntervalTree();
    expect(
      recycleList
        .getIntervalTree()
        .getHeap()
        .slice(
          recycleList.getIntervalTree().getSize(),
          recycleList.getIntervalTree().getSize() + 10
        )
    ).toEqual([100, 0, 80, 20, 100, 100, 200, 30, 0, 0]);
  });
});

// describe('lifecycle', () => {
//   it('initialization - update data source (initialNumToRender: 10 and container offset: 2000 ) and use viewabilityConfig', () => {
//     const data = buildData(100);
//     const recycleList = new ListDimensions({
//       data: [],
//       id: 'list_group',
//       recycleEnabled: true,
//       keyExtractor: defaultKeyExtractor,
//       maxToRenderPerBatch: 7,
//       windowSize: 5,
//       initialNumToRender: 10,
//       onEndReachedThreshold: 2,
//       getItemLayout: (item, index) => ({
//         length: 100,
//         index,
//       }),
//       getContainerLayout: () => ({
//         x: 0,
//         y: 2000,
//         width: 375,
//         height: 2000,
//       }),
//       viewabilityConfigCallbackPairs: [
//         {
//           viewabilityConfig: {
//             viewport: 1,
//             name: 'imageViewable',
//             viewAreaCoveragePercentThreshold: 0,
//           },
//         },
//         {
//           viewabilityConfig: {
//             name: 'viewable',
//             viewAreaCoveragePercentThreshold: 0,
//           },
//         },
//       ],
//     });

//     expect(recycleList.state).toEqual({
//       visibleStartIndex: -1,
//       visibleEndIndex: -1,
//       bufferedStartIndex: -1,
//       bufferedEndIndex: -1,
//       isEndReached: false,
//       distanceFromEnd: 0,
//       data: [],
//       actionType: 'initial',
//     });

//     recycleList.setData(data);

//     expect(recycleList.state).toEqual({
//       visibleStartIndex: 0,
//       visibleEndIndex: 9,
//       bufferedStartIndex: 0,
//       bufferedEndIndex: 9,
//       isEndReached: false,
//       distanceFromEnd: 0,
//       data: data.slice(0, 10),
//       actionType: 'initial',
//     });

//     let recycleListStateResult =
//       recycleList.stateResult as RecycleStateResult<any>;

//     expect(recycleListStateResult.spaceState.length).toBe(10);
//     expect(recycleListStateResult.recycleState.length).toBe(2);

//     // expect(recycleListStateResult.spaceState.map((v) => v.viewable)).toEqual([
//     //   true,
//     //   true,
//     //   true,
//     //   true,
//     //   true,
//     //   true,
//     //   true,
//     //   true,
//     //   true,
//     //   true,
//     // ]);
//     // expect(
//     //   recycleListStateResult.spaceState.map((v) => v.imageViewable)
//     // ).toEqual([true, true, true, true, true, true, true, true, true, true]);

//     // @ts-ignore
//     recycleList.updateScrollMetrics({
//       offset: 0,
//       visibleLength: 926,
//       contentLength: 1000,
//     });

//     expect(recycleList.state).toEqual({
//       visibleStartIndex: -1,
//       visibleEndIndex: -1,
//       bufferedStartIndex: 0,
//       bufferedEndIndex: 14,
//       isEndReached: true,
//       distanceFromEnd: 74,
//       data: data.slice(0, 100),
//       actionType: 'hydrationWithBatchUpdate',
//     });

//     recycleListStateResult = recycleList.stateResult as RecycleStateResult<any>;

//     expect(recycleListStateResult.spaceState.length).toBe(11);
//     expect(recycleListStateResult.spaceState[10].key).toBe(
//       buildStateTokenIndexKey(10, 99)
//     );
//     expect(recycleListStateResult.spaceState[10].length).toBe(9000);

//     expect(recycleListStateResult.recycleState.length).toBe(2);

//     // @ts-ignore
//     recycleList.updateScrollMetrics({
//       offset: 0,
//       visibleLength: 926,
//       contentLength: 1200,
//     });

//     expect(recycleList.state).toEqual({
//       visibleStartIndex: -1,
//       visibleEndIndex: -1,
//       bufferedStartIndex: 0,
//       bufferedEndIndex: 14,
//       isEndReached: true,
//       distanceFromEnd: 74,
//       data: data.slice(0, 100),
//       actionType: 'hydrationWithBatchUpdate',
//     });

//     recycleListStateResult = recycleList.stateResult as RecycleStateResult<any>;

//     expect(recycleListStateResult.recycleState.length).toBe(2);

//     expect(recycleListStateResult.recycleState.map((v) => v.item.key)).toEqual([
//       10, 11,
//     ]);
//     expect(recycleListStateResult.recycleState.map((v) => v.key)).toEqual([
//       'recycle_0',
//       'recycle_1',
//       // 'recycle_2',
//       // 'recycle_3',
//     ]);
//     // expect(recycleListStateResult.recycleState.map((v) => v.viewable)).toEqual(
//     //   []
//     // );
//     // expect(
//     //   recycleListStateResult.recycleState.map((v) => v.imageViewable)
//     // ).toEqual([]);

//     // @ts-ignore
//     recycleList.updateScrollMetrics({
//       offset: 3000,
//       visibleLength: 926,
//       contentLength: 4500,
//     });

//     recycleListStateResult = recycleList.stateResult as RecycleStateResult<any>;

//     expect(recycleList.state).toEqual({
//       isEndReached: true,
//       distanceFromEnd: 574,
//       actionType: 'hydrationWithBatchUpdate',
//       visibleStartIndex: 9,
//       visibleEndIndex: 19,
//       bufferedStartIndex: 0,
//       bufferedEndIndex: 44,
//       data,
//     });

//     expect(recycleListStateResult.recycleState.map((v) => v.item.key)).toEqual([
//       10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
//     ]);

//     // @ts-ignore
//     recycleList.updateScrollMetrics({
//       offset: 2700,
//       visibleLength: 926,
//       contentLength: 4500,
//     });

//     recycleListStateResult = recycleList.stateResult as RecycleStateResult<any>;

//     expect(recycleList.state).toEqual({
//       isEndReached: true,
//       distanceFromEnd: 874,
//       actionType: 'hydrationWithBatchUpdate',
//       visibleStartIndex: 6,
//       visibleEndIndex: 16,
//       bufferedStartIndex: 0,
//       bufferedEndIndex: 44,
//       data,
//     });

//     expect(recycleListStateResult.recycleState.map((v) => v.item.key)).toEqual([
//       10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
//     ]);

//     expect(recycleListStateResult.recycleState.map((v) => v.offset)).toEqual([
//       1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100,
//     ]);

//     expect(recycleListStateResult.recycleState.map((v) => v.key)).toEqual([
//       'recycle_0',
//       'recycle_1',
//       'recycle_2',
//       'recycle_3',
//       'recycle_4',
//       'recycle_5',
//       'recycle_6',
//       'recycle_7',
//       'recycle_8',
//       'recycle_9',
//       'recycle_10',
//       'recycle_11',
//     ]);

//     // @ts-ignore
//     recycleList.updateScrollMetrics({
//       offset: 3500,
//       visibleLength: 926,
//       contentLength: 4500,
//     });

//     expect(recycleList.state).toEqual({
//       isEndReached: true,
//       distanceFromEnd: 74,
//       actionType: 'hydrationWithBatchUpdate',
//       visibleStartIndex: 14,
//       visibleEndIndex: 24,
//       bufferedStartIndex: 0,
//       bufferedEndIndex: 49,
//       data,
//     });

//     expect(
//       (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
//         (v) => v.item.key
//       )
//     ).toEqual([
//       // 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
//       24, 25, 26, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
//       // 24, 25, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26,
//     ]);
//     expect(
//       (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
//         (v) => v.offset
//       )
//     ).toEqual([
//       // 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100,
//       2400, 2500, 2600, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100,
//       2200, 2300,
//     ]);

//     expect(
//       (recycleList.stateResult as RecycleStateResult<any>).spaceState.length
//     ).toBe(11);
//     expect(
//       (recycleList.stateResult as RecycleStateResult<any>).spaceState.map(
//         (v) => v.key
//       )
//     ).toEqual([
//       '0',
//       '1',
//       '2',
//       '3',
//       '4',
//       '5',
//       '6',
//       '7',
//       '8',
//       '9',
//       'space_10_99',
//     ]);
//     expect(
//       (recycleList.stateResult as RecycleStateResult<any>).spaceState.map(
//         (v) => v.length
//       )
//     ).toEqual([100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 9000]);

//     // @ts-ignore
//     recycleList.updateScrollMetrics({
//       offset: 6000,
//       visibleLength: 926,
//       contentLength: 4500,
//     });

//     expect(
//       (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
//         (v) => v.item.key
//       )
//     ).toEqual([50, 51, 26, 39, 40, 41, 42, 43, 44, 45, 46, 47, 37, 38]);
//     expect(
//       (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
//         (v) => v.offset
//       )
//     ).toEqual([
//       5000, 5100, 2600, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600, 4700,
//       3700, 3800,
//     ]);

//     // @ts-ignore
//     recycleList.updateScrollMetrics({
//       offset: 5400,
//       visibleLength: 926,
//       contentLength: 4500,
//       velocity: -0.5,
//     });

//     expect(
//       (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
//         (v) => v.item.key
//       )
//     ).toEqual([34, 33, 26, 39, 40, 41, 42, 43, 44, 45, 36, 35, 37, 38]);
//     expect(
//       (recycleList.stateResult as RecycleStateResult<any>).recycleState.map(
//         (v) => v.offset
//       )
//     ).toEqual([
//       3400, 3300, 2600, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 3600, 3500,
//       3700, 3800,
//     ]);
//   });
// });

describe('data update', () => {
  beforeEach(() => {
    resetContext();
    // tell vitest we use mocked time
    vi.useFakeTimers();
  });
  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers();
  });
  it('insert a data item', () => {
    const data = buildData(20);
    const recycleList = new ListDimensions<{
      key: number;
    }>({
      data: [],
      id: 'list_group',
      recycleEnabled: true,
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 10,
      windowSize: 5,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,

      recyclerReservedBufferPerBatch: 4,

      onRecyclerProcess: () => true,
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

    recycleList.updateScrollMetrics({
      offset: 2000,
      visibleLength: 926,
      contentLength: 3500,
    });

    expect(recycleList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 10,
      bufferedStartIndex: 0,
      bufferedEndIndex: 10,
      isEndReached: true,
      distanceFromEnd: 574,
      actionType: 'initial',
    });

    let recycleListStateResult =
      recycleList.stateResult as RecycleStateResult<any>;

    // offset should be recalculate
    expect(recycleListStateResult.recycleState[0].offset).toBe(400);
    // the forth as first item in recycleState
    expect(recycleListStateResult.recycleState[0].targetKey).toBe('4');

    expect(
      recycleListStateResult.recycleState.map((item) => ({
        key: item.targetKey,
        offset: item.offset,
      }))
    ).toEqual([
      {
        key: '4',
        offset: 400,
      },
      {
        key: '5',
        offset: 500,
      },
      {
        key: '6',
        offset: 600,
      },
      {
        key: '7',
        offset: 700,
      },
    ]);
    expect(
      recycleListStateResult.spaceState.map((item) => ({
        key: item.key,
      }))
    ).toEqual([
      {
        key: '0',
      },
      {
        key: '1',
      },
      {
        key: '2',
      },
      {
        key: '3',
      },
      {
        key: 'space_4_18',
      },
    ]);

    const _data = data.slice();
    const newData = buildData(1, 20);
    _data.splice(1, 0, newData[0]);
    recycleList.setData(_data);
    vi.runAllTimers();

    recycleListStateResult = recycleList.stateResult;

    // offset should be recalculate
    expect(recycleListStateResult.recycleState[0].offset).toBe(500);
    // the third as first item in recycleState
    expect(recycleListStateResult.recycleState[0].targetKey).toBe('4');

    // the new item should be placed on new position
    expect(recycleListStateResult.recycleState[4].offset).toBe(400);
    expect(recycleListStateResult.recycleState[4].targetKey).toBe('3');

    expect(
      recycleListStateResult.recycleState.map((item) => ({
        key: item.targetKey,
        offset: item.offset,
      }))
    ).toEqual([
      {
        key: '4',
        offset: 500,
      },
      {
        key: '5',
        offset: 600,
      },
      {
        key: '6',
        offset: 700,
      },
      {
        key: '7',
        offset: 800,
      },
      {
        key: '3',
        offset: 400,
      },
    ]);

    expect(
      recycleListStateResult.spaceState.map((item) => ({
        key: item.key,
      }))
    ).toEqual([
      {
        key: '0',
      },
      {
        key: '20',
      },
      {
        key: '1',
      },
      {
        key: '2',
      },
      {
        key: 'space_4_19',
      },
    ]);
  });

  it('insert a data item with dynamic layout', () => {
    const data = buildData(20);
    const recycleList = new ListDimensions<{
      key: number;
    }>({
      data: [],
      id: 'list_group',
      recycleEnabled: true,
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 10,
      windowSize: 5,
      initialNumToRender: 4,
      itemApproximateLength: 80,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });
    recycleList.setData(data);

    recycleList.updateScrollMetrics({
      offset: 2000,
      visibleLength: 926,
      contentLength: 3500,
    });

    expect(recycleList.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 12,
      bufferedStartIndex: 0,
      bufferedEndIndex: 12,
      isEndReached: true,
      distanceFromEnd: 574,
      actionType: 'initial',
    });

    recycleList.setFinalKeyItemLayout('0', 100);
    recycleList.setFinalKeyItemLayout('1', 80);
    recycleList.setFinalKeyItemLayout('2', 100);
    recycleList.setFinalKeyItemLayout('3', 20);

    recycleList.setFinalKeyItemLayout('4', 100);
    recycleList.setFinalKeyItemLayout('5', 30);
    recycleList.setFinalKeyItemLayout('6', 100);
    recycleList.setFinalKeyItemLayout('7', 200);
    recycleList.setFinalKeyItemLayout('8', 100);
    recycleList.setFinalKeyItemLayout('9', 100);
    recycleList.setFinalKeyItemLayout('10', 100);
    recycleList.setFinalKeyItemLayout('11', 100);
    recycleList.setFinalKeyItemLayout('12', 100);
    recycleList.setFinalKeyItemLayout('13', 100);

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

    // offset should be recalculate, approximateItemLength will be included.
    expect(recycleListStateResult.recycleState[0].offset).toBe(380);
    // the third as first item in recycleState
    expect(recycleListStateResult.recycleState[0].targetKey).toBe('4');
  });
});
