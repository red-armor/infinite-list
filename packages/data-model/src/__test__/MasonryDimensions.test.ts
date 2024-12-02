import MasonryDimensions from '../masonry/MasonryDimensions';
import Batchinator from '@x-oasis/batchinator';
import { resetContext } from '../ItemMeta';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { MasonryStateResults } from '../types';
const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index + startIndex,
  }));

type DataItem = {
  key: number;
};

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

  it('constructor', () => {
    const initialData = buildData(4);
    const masonryDimensions = new MasonryDimensions({
      data: initialData,
      id: 'masonry',
      keyExtractor: (item) => `${item.key}`,
    });
    const dataModel = masonryDimensions.getDataModel();
    expect(dataModel.getColumn()).toBe(2);
    expect(dataModel.getColumnDataSource()).toEqual([
      [{ key: 0 }, { key: 2 }],
      [{ key: 1 }, { key: 3 }],
    ]);
  });

  it('constructor -- append data', () => {
    const initialData = buildData(4);
    const masonryDimensions = new MasonryDimensions({
      data: initialData,
      id: 'masonry',
      keyExtractor: (item) => `${item.key}`,
    });
    const dataModel = masonryDimensions.getDataModel();
    expect(dataModel.getColumn()).toBe(2);
    expect(dataModel.getColumnDataSource()).toEqual([
      [{ key: 0 }, { key: 2 }],
      [{ key: 1 }, { key: 3 }],
    ]);
    const nextData = buildData(6, 4);
    masonryDimensions.setData(([] as DataItem[]).concat(initialData, nextData));

    expect(dataModel.getColumnDataSource()).toEqual([
      [{ key: 0 }, { key: 2 }, { key: 4 }, { key: 6 }, { key: 8 }],
      [{ key: 1 }, { key: 3 }, { key: 5 }, { key: 7 }, { key: 9 }],
    ]);
  });

  it('constructor -- set new data', () => {
    const initialData = buildData(4);
    const masonryDimensions = new MasonryDimensions({
      data: initialData,
      id: 'masonry',
      keyExtractor: (item) => `${item.key}`,
    });
    const dataModel = masonryDimensions.getDataModel();
    expect(dataModel.getColumn()).toBe(2);
    expect(dataModel.getColumnDataSource()).toEqual([
      [{ key: 0 }, { key: 2 }],
      [{ key: 1 }, { key: 3 }],
    ]);
    const nextData = buildData(6, 4);

    masonryDimensions.setData(nextData);

    expect(dataModel.getColumnDataSource()).toEqual([
      [{ key: 4 }, { key: 6 }, { key: 8 }],
      [{ key: 5 }, { key: 7 }, { key: 9 }],
    ]);
  });

  it('updateScrollMetrics', () => {
    const initialData = buildData(60);
    const masonryDimensions = new MasonryDimensions({
      data: initialData,
      id: 'masonry',
      keyExtractor: (item) => `${item.key}`,
      getContainerLayout: () => ({
        x: 0,
        y: 0,
        width: 375,
        height: 500,
      }),
      initialNumToRender: 4,
    });

    expect(
      masonryDimensions.getDataModel().getColumnDataSource()[0].length
    ).toBe(30);
    expect(
      masonryDimensions.getDataModel().getColumnDataSource()[1].length
    ).toBe(30);

    let stateResult: MasonryStateResults<DataItem> = [];

    masonryDimensions.addStateListener(
      (stateResults: MasonryStateResults<DataItem>) => {
        stateResult = stateResults;
        // const first = stateResults[0][0];
        // console.log('state result - ', stateResult[1][0].recycleState.map(state => state.targetKey));
      }
    );
    // const dataModel = masonryDimensions.getDataModel();
    masonryDimensions.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 3500,
    });

    expect(
      stateResult[0][0].recycleState.map((state) => state.targetKey)
    ).toEqual([
      '8',
      '10',
      '12',
      '14',
      '16',
      '18',
      '20',
      '22',
      '24',
      '26',
      '28',
      '30',
      '32',
      '34',
      '36',
      '38',
      '40',
      '42',
      '44',
      '46',
    ]);
    expect(stateResult[0][0].spaceState.map((state) => state.key)).toEqual([
      '0',
      '2',
      '4',
      '6',
      'space_4_28',
    ]);

    expect(
      stateResult[1][0].recycleState.map((state) => state.targetKey)
    ).toEqual([
      '9',
      '11',
      '13',
      '15',
      '17',
      '19',
      '21',
      '23',
      '25',
      '27',
      '29',
      '31',
      '33',
      '35',
      '37',
      '39',
      '41',
      '43',
      '45',
      '47',
    ]);
    expect(stateResult[1][0].spaceState.map((state) => state.key)).toEqual([
      '1',
      '3',
      '5',
      '7',
      'space_4_28',
    ]);

    masonryDimensions.updateScrollMetrics({
      offset: 400,
      visibleLength: 926,
      contentLength: 3500,
    });

    expect(
      stateResult[0][1].recycleState.map((state) => state.targetKey)
    ).toEqual([
      '8',
      '10',
      '12',
      '14',
      '16',
      '18',
      '20',
      '22',
      '24',
      '26',
      '28',
      '30',
      '32',
      '34',
      '36',
      '38',
      '40',
      '42',
      '44',
      '46',
    ]);
  });
});

describe('operations', () => {
  it('getKeyIndexInfo', () => {
    const initialData = buildData(4);
    const masonryDimensions = new MasonryDimensions({
      data: initialData,
      id: 'masonry',
      keyExtractor: (item) => `${item.key}`,
    });

    expect(masonryDimensions.getFinalKeyIndexInfo('2')).toEqual({
      dimensions: masonryDimensions,
      columnIndex: 0,
      indexInTotal: 2,
      index: 1,
    });
    expect(masonryDimensions.getFinalKeyIndexInfo('1')).toEqual({
      dimensions: masonryDimensions,
      columnIndex: 1,
      indexInTotal: 1,
      index: 0,
    });
  });

  it('should update itemLayout and columnIntervalTree', () => {
    const initialData = buildData(4);
    const masonryDimensions = new MasonryDimensions({
      data: initialData,
      id: 'masonry',
      keyExtractor: (item) => `${item.key}`,
    });
    const dataModel = masonryDimensions.getDataModel();
    expect(dataModel.getKeyItemOffset('0')).toBe(0);
    expect(dataModel.getKeyItemOffset('1')).toBe(0);
    expect(dataModel.getKeyItemOffset('2')).toBe(80);
    expect(dataModel.getKeyItemOffset('3')).toBe(80);

    expect(dataModel.getKeyIndexInColumn('0')).toBe(0);

    masonryDimensions.setFinalKeyItemLayout('0', 200);

    expect(dataModel.getKeyItemOffset('2')).toBe(200);
    expect(dataModel.getKeyItemOffset('3')).toBe(80);
  });
});
