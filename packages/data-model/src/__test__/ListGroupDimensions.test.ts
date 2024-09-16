import ListGroupDimensions from '../ListGroupDimensions';
import Batchinator from '@x-oasis/batchinator';
import { defaultKeyExtractor } from '../exportedUtils';
import { describe, expect, it, test, vi, afterEach } from 'vitest';
import { DEFAULT_DIMENSION_ITEM_APPROXIMATE_LENGTH } from '../common'

vi.useFakeTimers();

const buildData = (count: number) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index,
  }));

afterEach(() => {
  vi.clearAllMocks();
});

vi.spyOn(Batchinator.prototype, 'schedule').mockImplementation(function (
  ...args
) {
  // eslint-disable-next-line prefer-spread
  this._callback.apply(this, args);
});

// const startInspection = ListGroupDimensions.prototype.startInspection;
// // https://jestjs.io/docs/es6-class-mocks#mocking-a-specific-method-of-a-class
// vi.spyOn(ListGroupDimensions.prototype, 'startInspection').mockImplementation(
//   function (...args) {
//     startInspection.call(this);
//   }
// );

describe('basic', () => {
  // beforeEach(() => {
  //   vi.spyOn(global, 'requestIdleCallback').mockImplementation(cb => cb());
  // });
  // https://jestjs.io/docs/es6-class-mocks#mocking-a-specific-method-of-a-class
  it('constructor', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 7,
      windowSize: 9,
      initialNumToRender: 20,
      onEndReachedThreshold: 300,
      horizontal: true,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    expect(listGroupDimensions.maxToRenderPerBatch).toBe(7);
    expect(listGroupDimensions.windowSize).toBe(9);
    expect(listGroupDimensions.initialNumToRender).toBe(20);
    expect(listGroupDimensions.onEndReachedThreshold).toBe(300);
    expect(listGroupDimensions.horizontal).toBe(true);
  });

  it('register list and verify indexKeys (add, remove, update)', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
    });

    listGroupDimensions.registerItem('banner');
    listGroupDimensions.registerList('list_1', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
    });
    const { remover: removeList2 } = listGroupDimensions.registerList(
      'list_2',
      {
        data: buildData(5),
        keyExtractor: defaultKeyExtractor,
      }
    );
    listGroupDimensions.registerList('list_3', {
      data: buildData(13),
      keyExtractor: defaultKeyExtractor,
    });
    const { remover: removeBanner2 } =
      listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
    });

    expect(listGroupDimensions.indexKeys).toEqual([
      'banner',
      'list_1',
      'list_2',
      'list_3',
      'banner2',
      'list_4',
    ]);

    removeList2();

    expect(listGroupDimensions.indexKeys).toEqual([
      'banner',
      'list_1',
      'list_3',
      'banner2',
      'list_4',
    ]);

    removeBanner2();
    expect(listGroupDimensions.indexKeys).toEqual([
      'banner',
      'list_1',
      'list_3',
      'list_4',
    ]);
  });

  it('getIndexKey', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
    });
    listGroupDimensions.registerItem('banner');
    listGroupDimensions.registerList('list_1', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerList('list_2', {
      data: buildData(5),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerList('list_3', {
      data: buildData(13),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
    });

    expect(listGroupDimensions.getIndexKey(0, 'banner')).toBe('banner');
    expect(listGroupDimensions.getIndexKey(1, 'banner')).toBe('banner');
    expect(listGroupDimensions.getIndexKey(2, 'list_2')).toBe('2');
  });

  it('getKeyIndex', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
    });
    listGroupDimensions.registerItem('banner');
    listGroupDimensions.registerList('list_1', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerList('list_2', {
      data: buildData(5),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerList('list_3', {
      data: buildData(13),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
    });

    expect(listGroupDimensions.getKeyIndex('banner', 'banner')).toBe(0);
    expect(listGroupDimensions.getKeyIndex('1', 'list_1')).toBe(1);
    expect(listGroupDimensions.getKeyIndex('3', 'list_2')).toBe(3);
  });

  it('getFinalIndex', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
    });
    const { remover: removeBanner } =
      listGroupDimensions.registerItem('banner');
    listGroupDimensions.registerList('list_1', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerList('list_2', {
      data: buildData(5),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerList('list_3', {
      data: buildData(13),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
    });

    expect(listGroupDimensions.getFinalIndex('banner', 'banner')).toBe(0);
    expect(listGroupDimensions.getFinalIndex('1', 'list_1')).toBe(2);
    expect(listGroupDimensions.getFinalIndex('3', 'list_2')).toBe(14);
    expect(listGroupDimensions.getFinalIndex('7', 'list_2')).toBe(-1);
    expect(listGroupDimensions.getFinalIndex('11', 'list_3')).toBe(27);
    expect(listGroupDimensions.getFinalIndex('banner2', 'banner2')).toBe(29);
    expect(listGroupDimensions.getFinalIndex('11', 'list_4')).toBe(41);

    removeBanner();
    expect(listGroupDimensions.getFinalIndex('banner', 'banner')).toBe(-1);
    expect(listGroupDimensions.getFinalIndex('1', 'list_1')).toBe(1);
    expect(listGroupDimensions.getFinalIndex('3', 'list_2')).toBe(13);
    expect(listGroupDimensions.getFinalIndex('7', 'list_2')).toBe(-1);
    expect(listGroupDimensions.getFinalIndex('11', 'list_3')).toBe(26);
    expect(listGroupDimensions.getFinalIndex('banner2', 'banner2')).toBe(28);
    expect(listGroupDimensions.getFinalIndex('11', 'list_4')).toBe(40);
  });

  it('findPosition', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
    });

    const { remover: removeBanner } =
      listGroupDimensions.registerItem('banner');
    listGroupDimensions.registerList('list_1', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerList('list_2', {
      data: buildData(5),
      keyExtractor: defaultKeyExtractor,
    });
    const { remover: removeList3 } = listGroupDimensions.registerList(
      'list_3',
      {
        data: buildData(13),
        keyExtractor: defaultKeyExtractor,
      }
    );
    listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
    });

    expect(listGroupDimensions.findPosition(0)).toEqual({
      index: 0,
      dimensionKey: 'banner',
    });
    expect(listGroupDimensions.findPosition(1)).toEqual({
      index: 0,
      dimensionKey: 'list_1',
    });
    expect(listGroupDimensions.findPosition(10)).toEqual({
      index: 9,
      dimensionKey: 'list_1',
    });
    expect(listGroupDimensions.findPosition(11)).toEqual({
      index: 0,
      dimensionKey: 'list_2',
    });
    expect(listGroupDimensions.findPosition(15)).toEqual({
      index: 4,
      dimensionKey: 'list_2',
    });
    expect(listGroupDimensions.findPosition(16)).toEqual({
      index: 0,
      dimensionKey: 'list_3',
    });
    expect(listGroupDimensions.findPosition(28)).toEqual({
      index: 12,
      dimensionKey: 'list_3',
    });
    expect(listGroupDimensions.findPosition(29)).toEqual({
      index: 0,
      dimensionKey: 'banner2',
    });
    expect(listGroupDimensions.findPosition(30)).toEqual({
      index: 0,
      dimensionKey: 'list_4',
    });
    expect(listGroupDimensions.findPosition(49)).toEqual({
      index: 19,
      dimensionKey: 'list_4',
    });

    removeBanner();
    expect(listGroupDimensions.findPosition(0)).toEqual({
      index: 0,
      dimensionKey: 'list_1',
    });
    expect(listGroupDimensions.findPosition(9)).toEqual({
      index: 9,
      dimensionKey: 'list_1',
    });
    expect(listGroupDimensions.findPosition(10)).toEqual({
      index: 0,
      dimensionKey: 'list_2',
    });
    expect(listGroupDimensions.findPosition(14)).toEqual({
      index: 4,
      dimensionKey: 'list_2',
    });
    expect(listGroupDimensions.findPosition(15)).toEqual({
      index: 0,
      dimensionKey: 'list_3',
    });
    expect(listGroupDimensions.findPosition(27)).toEqual({
      index: 12,
      dimensionKey: 'list_3',
    });
    expect(listGroupDimensions.findPosition(28)).toEqual({
      index: 0,
      dimensionKey: 'banner2',
    });
    expect(listGroupDimensions.findPosition(29)).toEqual({
      index: 0,
      dimensionKey: 'list_4',
    });
    expect(listGroupDimensions.findPosition(48)).toEqual({
      index: 19,
      dimensionKey: 'list_4',
    });

    removeList3();
    expect(listGroupDimensions.findPosition(15)).toEqual({
      index: 0,
      dimensionKey: 'banner2',
    });
    expect(listGroupDimensions.findPosition(16)).toEqual({
      index: 0,
      dimensionKey: 'list_4',
    });
    expect(listGroupDimensions.findPosition(35)).toEqual({
      index: 19,
      dimensionKey: 'list_4',
    });

    listGroupDimensions.setListData('list_1', buildData(12));
    listGroupDimensions.setListData('list_2', buildData(8));
    expect(listGroupDimensions.findPosition(0)).toEqual({
      index: 0,
      dimensionKey: 'list_1',
    });
    expect(listGroupDimensions.findPosition(11)).toEqual({
      index: 11,
      dimensionKey: 'list_1',
    });
    expect(listGroupDimensions.findPosition(12)).toEqual({
      index: 0,
      dimensionKey: 'list_2',
    });
    expect(listGroupDimensions.findPosition(19)).toEqual({
      index: 7,
      dimensionKey: 'list_2',
    });
  });

  it('findListRange', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
    });

    listGroupDimensions.registerItem('banner');
    listGroupDimensions.registerList('list_1', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerList('list_2', {
      data: buildData(5),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerList('list_3', {
      data: buildData(13),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
    });

    let listRange = [];

    // Dimension
    listRange = listGroupDimensions.findListRange(0, 0);
    expect(listRange).toEqual([
      {
        listKey: 'banner',
        isDimension: true,
      },
    ]);

    // Dimension and list
    listRange = listGroupDimensions.findListRange(0, 5);
    expect(listRange).toEqual([
      {
        listKey: 'banner',
        isDimension: true,
      },
      {
        listKey: 'list_1',
        isDimension: false,
        value: {
          startIndex: 0,
          endIndex: 4,
          data: buildData(10).slice(0, 5),
        },
      },
    ]);

    // in list
    listRange = listGroupDimensions.findListRange(3, 7);
    expect(listRange).toEqual([
      {
        listKey: 'list_1',
        isDimension: false,
        value: {
          startIndex: 2,
          endIndex: 6,
          data: buildData(10).slice(0, 7),
        },
      },
    ]);

    // in list, list, list, dimension
    listRange = listGroupDimensions.findListRange(3, 29);
    expect(listRange).toEqual([
      {
        listKey: 'list_1',
        isDimension: false,
        value: {
          startIndex: 2,
          endIndex: 9,
          data: buildData(10).slice(0, 10),
        },
      },
      {
        listKey: 'list_2',
        isDimension: false,
        value: {
          startIndex: 0,
          endIndex: 4,
          data: buildData(5).slice(0, 5),
        },
      },
      {
        listKey: 'list_3',
        isDimension: false,
        value: {
          startIndex: 0,
          endIndex: 12,
          data: buildData(13).slice(0, 13),
        },
      },
      {
        listKey: 'banner2',
        isDimension: true,
      },
    ]);

    // in list, list, list, dimension, list
    listRange = listGroupDimensions.findListRange(3, 33);
    expect(listRange).toEqual([
      {
        listKey: 'list_1',
        isDimension: false,
        value: {
          startIndex: 2,
          endIndex: 9,
          data: buildData(10).slice(0, 10),
        },
      },
      {
        listKey: 'list_2',
        isDimension: false,
        value: {
          startIndex: 0,
          endIndex: 4,
          data: buildData(5).slice(0, 5),
        },
      },
      {
        listKey: 'list_3',
        isDimension: false,
        value: {
          startIndex: 0,
          endIndex: 12,
          data: buildData(13).slice(0, 13),
        },
      },
      {
        listKey: 'banner2',
        isDimension: true,
      },
      {
        listKey: 'list_4',
        isDimension: false,
        value: {
          startIndex: 0,
          endIndex: 3,
          data: buildData(20).slice(0, 4),
        },
      },
    ]);
  });

  it('getItemLayout', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
    });

    listGroupDimensions.registerItem('banner');
    listGroupDimensions.registerList('list_1', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 100, index }),
    });
    listGroupDimensions.registerList('list_2', {
      data: buildData(5),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 20, index }),
    });
    listGroupDimensions.registerList('list_3', {
      data: buildData(13),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 500, index }),
    });
    listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 150, index }),
    });

    listGroupDimensions.setKeyItemLayout('banner', 'banner', 80);

    expect(listGroupDimensions.getIntervalTree().sumUntil(1)).toBe(80);
    expect(listGroupDimensions.getIntervalTree().sumUntil(2)).toBe(1080);
    expect(listGroupDimensions.getIntervalTree().sumUntil(11)).toBe(10680 + DEFAULT_DIMENSION_ITEM_APPROXIMATE_LENGTH);
  });
});

describe('test dimensionsIndexRange', () => {
  it('on initial', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    listGroupDimensions.registerItem('banner');
    listGroupDimensions.registerList('list_1', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 100, index }),
    });
    listGroupDimensions.registerList('list_2', {
      data: buildData(5),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 20, index }),
    });
    listGroupDimensions.registerList('list_3', {
      data: buildData(13),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 500, index }),
    });
    listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 150, index }),
    });

    listGroupDimensions.setKeyItemLayout('banner', 'banner', 80);

    expect(
      listGroupDimensions.dimensionsIndexRange.map((item) => ({
        startIndex: item.startIndex,
        endIndex: item.endIndex,
        dimensionsKey: item.dimensions.id,
      }))
    ).toEqual([
      {
        startIndex: 0,
        endIndex: 1,
        dimensionsKey: 'banner',
      },
      {
        startIndex: 1,
        endIndex: 11,
        dimensionsKey: 'list_1',
      },
      {
        startIndex: 11,
        endIndex: 16,
        dimensionsKey: 'list_2',
      },
      {
        startIndex: 16,
        endIndex: 29,
        dimensionsKey: 'list_3',
      },
      {
        startIndex: 29,
        endIndex: 30,
        dimensionsKey: 'banner2',
      },
      {
        startIndex: 30,
        endIndex: 50,
        dimensionsKey: 'list_4',
      },
    ]);
  });

  it('on delete', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    listGroupDimensions.registerItem('banner');
    listGroupDimensions.registerList('list_1', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 100, index }),
    });
    const { remover: list_2_remover } = listGroupDimensions.registerList(
      'list_2',
      {
        data: buildData(5),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 20, index }),
      }
    );
    const { dimensions: list3Dimensions } = listGroupDimensions.registerList(
      'list_3',
      {
        data: buildData(13),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 500, index }),
      }
    );
    const { remover: banner2_remover } =
      listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 150, index }),
    });

    listGroupDimensions.setKeyItemLayout('banner', 'banner', 80);

    list_2_remover();

    expect(
      listGroupDimensions.dimensionsIndexRange.map((item) => ({
        startIndex: item.startIndex,
        endIndex: item.endIndex,
        dimensionsKey: item.dimensions.id,
      }))
    ).toEqual([
      {
        startIndex: 0,
        endIndex: 1,
        dimensionsKey: 'banner',
      },
      {
        startIndex: 1,
        endIndex: 11,
        dimensionsKey: 'list_1',
      },
      {
        startIndex: 11,
        endIndex: 24,
        dimensionsKey: 'list_3',
      },
      {
        startIndex: 24,
        endIndex: 25,
        dimensionsKey: 'banner2',
      },
      {
        startIndex: 25,
        endIndex: 45,
        dimensionsKey: 'list_4',
      },
    ]);

    banner2_remover();

    expect(
      listGroupDimensions.dimensionsIndexRange.map((item) => ({
        startIndex: item.startIndex,
        endIndex: item.endIndex,
        dimensionsKey: item.dimensions.id,
      }))
    ).toEqual([
      {
        startIndex: 0,
        endIndex: 1,
        dimensionsKey: 'banner',
      },
      {
        startIndex: 1,
        endIndex: 11,
        dimensionsKey: 'list_1',
      },
      {
        startIndex: 11,
        endIndex: 24,
        dimensionsKey: 'list_3',
      },
      {
        startIndex: 24,
        endIndex: 44,
        dimensionsKey: 'list_4',
      },
    ]);

    listGroupDimensions.setListData('list_3', buildData(5))
    // list3Dimensions.setData(buildData(5));

    expect(
      listGroupDimensions.dimensionsIndexRange.map((item) => ({
        startIndex: item.startIndex,
        endIndex: item.endIndex,
        dimensionsKey: item.dimensions.id,
      }))
    ).toEqual([
      {
        startIndex: 0,
        endIndex: 1,
        dimensionsKey: 'banner',
      },
      {
        startIndex: 1,
        endIndex: 11,
        dimensionsKey: 'list_1',
      },
      {
        startIndex: 11,
        endIndex: 16,
        dimensionsKey: 'list_3',
      },
      {
        startIndex: 16,
        endIndex: 36,
        dimensionsKey: 'list_4',
      },
    ]);
  });

  it('getFinalIndexIndexInfo', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    const { dimensions: bannerDimensions } =
      listGroupDimensions.registerItem('banner');
    listGroupDimensions.registerList('list_1', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 100, index }),
    });
    listGroupDimensions.registerList('list_2', {
      data: buildData(5),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 20, index }),
    });
    const { dimensions: list3Dimensions } = listGroupDimensions.registerList(
      'list_3',
      {
        data: buildData(13),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 500, index }),
      }
    );
    const { dimensions: banner2Dimensions } =
      listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 150, index }),
    });

    listGroupDimensions.setKeyItemLayout('banner', 'banner', 80);

    expect(listGroupDimensions.getFinalIndexIndexInfo(0)).toEqual({
      dimensions: bannerDimensions,
      indexInGroup: 0,
      indexInRecycler: 0,
      index: 0,
    });

    expect(listGroupDimensions.getFinalIndexIndexInfo(20)).toEqual({
      dimensions: list3Dimensions,
      index: 4,
      indexInGroup: 20,
      indexInRecycler: 20,
    });
    expect(listGroupDimensions.getFinalIndexIndexInfo(29)).toEqual({
      dimensions: banner2Dimensions,
      index: 0,
      indexInGroup: 29,
      indexInRecycler: 29,
    });
  });

  test('getDimensionStartIndex', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    listGroupDimensions.registerItem('banner');
    listGroupDimensions.registerList('list_1', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 100, index }),
    });
    listGroupDimensions.registerList('list_2', {
      data: buildData(5),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 20, index }),
    });
    listGroupDimensions.registerList('list_3', {
      data: buildData(13),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 500, index }),
    });
    listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 150, index }),
    });

    listGroupDimensions.setKeyItemLayout('banner', 'banner', 80);

    expect(listGroupDimensions.getDimensionStartIndex('banner')).toBe(0);
    expect(listGroupDimensions.getDimensionStartIndex('list_1')).toBe(1);
    expect(listGroupDimensions.getDimensionStartIndex('list_2')).toBe(11);
    expect(listGroupDimensions.getDimensionStartIndex('list_3')).toBe(16);
    expect(listGroupDimensions.getDimensionStartIndex('banner2')).toBe(29);
    expect(listGroupDimensions.getDimensionStartIndex('list_4')).toBe(30);
  });
});

describe('initialNumToRender', () => {
  test('updateInitialNumDueToListGroup', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
      initialNumToRender: 10,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    const { dimensions: list_1_dimensions } = listGroupDimensions.registerList(
      'list_1',
      {
        data: buildData(3),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 100, index }),
      }
    );
    const { dimensions: list_2_dimensions } = listGroupDimensions.registerList(
      'list_2',
      {
        data: buildData(5),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 20, index }),
      }
    );
    const { dimensions: list_3_dimensions } = listGroupDimensions.registerList(
      'list_3',
      {
        data: buildData(13),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 500, index }),
      }
    );
    listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 150, index }),
    });

    expect(list_1_dimensions.initialNumToRender).toBe(3);
    expect(list_2_dimensions.initialNumToRender).toBe(5);
    expect(list_3_dimensions.initialNumToRender).toBe(2);
  });

  test('updateInitialNumDueToListGroup - banner occupy position', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
      initialNumToRender: 10,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    listGroupDimensions.registerItem('banner');
    const { dimensions: list_1_dimensions } = listGroupDimensions.registerList(
      'list_1',
      {
        data: buildData(3),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 100, index }),
      }
    );
    const { dimensions: list_2_dimensions } = listGroupDimensions.registerList(
      'list_2',
      {
        data: buildData(5),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 20, index }),
      }
    );
    listGroupDimensions.registerItem('banner2');
    const { dimensions: list_3_dimensions } = listGroupDimensions.registerList(
      'list_3',
      {
        data: buildData(13),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 500, index }),
      }
    );
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 150, index }),
    });

    expect(list_1_dimensions.initialNumToRender).toBe(3);
    expect(list_2_dimensions.initialNumToRender).toBe(5);
    expect(list_3_dimensions.initialNumToRender).toBe(0);
  });
});

describe('persistanceIndices', () => {
  test('updatePersistanceIndicesDueToListGroup', () => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
      persistanceIndices: [1, 2, 7, 10, 20],
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    const { dimensions: list_1_dimensions } = listGroupDimensions.registerList(
      'list_1',
      {
        data: buildData(3),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 100, index }),
      }
    );
    const { dimensions: list_2_dimensions } = listGroupDimensions.registerList(
      'list_2',
      {
        data: buildData(5),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 20, index }),
      }
    );
    const { dimensions: list_3_dimensions } = listGroupDimensions.registerList(
      'list_3',
      {
        data: buildData(13),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 500, index }),
      }
    );
    listGroupDimensions.registerItem('banner2');
    listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 150, index }),
    });

    expect(list_1_dimensions.persistanceIndices).toEqual([1, 2]);
    expect(list_2_dimensions.persistanceIndices).toEqual([4]);
    expect(list_3_dimensions.persistanceIndices).toEqual([2, 12]);
  });
});

describe('heartBeat', () => {
  const buildListGroup = (props = {}) => {
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
      ...props,
    });

    const {
      dimensions: list_1_dimensions,
      remover: list_1_dimensions_remover,
    } = listGroupDimensions.registerList('list_1', {
      data: buildData(3),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 100, index }),
    });
    const {
      dimensions: list_2_dimensions,
      remover: list_2_dimensions_remover,
    } = listGroupDimensions.registerList('list_2', {
      data: buildData(5),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 20, index }),
    });
    const {
      dimensions: list_3_dimensions,
      remover: list_3_dimensions_remover,
    } = listGroupDimensions.registerList('list_3', {
      data: buildData(13),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 500, index }),
    });
    const {
      dimensions: banner2_dimensions,
      remover: banner2_dimensions_remover,
    } = listGroupDimensions.registerItem('banner2');
    const {
      dimensions: list_4_dimensions,
      remover: list_4_dimensions_remover,
    } = listGroupDimensions.registerList('list_4', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 150, index }),
    });

    return {
      listGroupDimensions,
      list_1_dimensions,
      list_2_dimensions,
      list_3_dimensions,
      banner2_dimensions,
      list_4_dimensions,
      list_1_dimensions_remover,
      list_2_dimensions_remover,
      list_3_dimensions_remover,
      banner2_dimensions_remover,
      list_4_dimensions_remover,
    };
  };

  it('start inspection', () => {
    const { listGroupDimensions } = buildListGroup();
    expect(listGroupDimensions.indexKeys).toEqual([
      'list_1',
      'list_2',
      'list_3',
      'banner2',
      'list_4',
    ]);
    listGroupDimensions.inspector.startInspection();
    const { heartBeat } = listGroupDimensions.inspector.getAPI();
    const inspectingTime = Date.now() + 1;
    heartBeat({ listKey: 'list_1', inspectingTime });
    heartBeat({ listKey: 'banner2', inspectingTime });
    heartBeat({ listKey: 'list_2', inspectingTime });
    heartBeat({ listKey: 'list_3', inspectingTime });
    heartBeat({ listKey: 'list_4', inspectingTime });
    expect(listGroupDimensions.indexKeys).toEqual([
      'list_1',
      'banner2',
      'list_2',
      'list_3',
      'list_4',
    ]);
  });

  it('registerList should trigger startInspection', () => {
    const { listGroupDimensions } = buildListGroup();
    expect(listGroupDimensions.indexKeys).toEqual([
      'list_1',
      'list_2',
      'list_3',
      'banner2',
      'list_4',
    ]);

    expect(ListGroupDimensions.prototype.startInspection).toHaveBeenCalledTimes(
      5
    );

    listGroupDimensions.registerList('list_5', {
      data: buildData(10),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 500, index }),
    });

    expect(ListGroupDimensions.prototype.startInspection).toHaveBeenCalledTimes(
      6
    );

    expect(listGroupDimensions.indexKeys).toEqual([
      'list_1',
      'list_2',
      'list_3',
      'banner2',
      'list_4',
      'list_5',
    ]);
  });

  it('removeList should not trigger startInspection', () => {
    const { listGroupDimensions, list_2_dimensions_remover } = buildListGroup();
    expect(listGroupDimensions.indexKeys).toEqual([
      'list_1',
      'list_2',
      'list_3',
      'banner2',
      'list_4',
    ]);
    expect(ListGroupDimensions.prototype.startInspection).toHaveBeenCalledTimes(
      5
    );
    list_2_dimensions_remover();
    expect(ListGroupDimensions.prototype.startInspection).toHaveBeenCalledTimes(
      5
    );
    expect(listGroupDimensions.indexKeys).toEqual([
      'list_1',
      // 'list_2',
      'list_3',
      'banner2',
      'list_4',
    ]);
  });

  it('removeItem should not trigger startInspection', () => {
    const { listGroupDimensions, banner2_dimensions_remover } =
      buildListGroup();
    expect(listGroupDimensions.indexKeys).toEqual([
      'list_1',
      'list_2',
      'list_3',
      'banner2',
      'list_4',
    ]);
    expect(ListGroupDimensions.prototype.startInspection).toHaveBeenCalledTimes(
      5
    );
    banner2_dimensions_remover();
    expect(ListGroupDimensions.prototype.startInspection).toHaveBeenCalledTimes(
      5
    );
    expect(listGroupDimensions.indexKeys).toEqual([
      'list_1',
      'list_2',
      'list_3',
      'list_4',
    ]);
  });

  it('update persistanceIndices after inspection', () => {
    const {
      listGroupDimensions,
      list_1_dimensions,
      list_2_dimensions,
      list_3_dimensions,
      list_4_dimensions,
    } = buildListGroup({
      id: 'list_group',
      maxToRenderPerBatch: 10,
      persistanceIndices: [1, 2, 7, 10, 20],
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    expect(list_1_dimensions.persistanceIndices).toEqual([1, 2]);
    expect(list_2_dimensions.persistanceIndices).toEqual([4]);
    expect(list_3_dimensions.persistanceIndices).toEqual([2, 12]);

    const { heartBeat } = listGroupDimensions.getInspectAPI();
    const inspectingTime = Date.now() + 1;
    heartBeat({ listKey: 'list_1', inspectingTime });
    heartBeat({ listKey: 'banner2', inspectingTime });
    heartBeat({ listKey: 'list_4', inspectingTime });
    heartBeat({ listKey: 'list_3', inspectingTime });
    heartBeat({ listKey: 'list_2', inspectingTime });
    expect(list_1_dimensions.persistanceIndices).toEqual([1, 2]);
    expect(list_2_dimensions.persistanceIndices).toEqual([]);
    expect(list_3_dimensions.persistanceIndices).toEqual([]);
    expect(list_4_dimensions.persistanceIndices).toEqual([3, 6, 16]);
  });
});
