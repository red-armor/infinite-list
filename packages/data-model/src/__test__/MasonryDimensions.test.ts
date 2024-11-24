import MasonryDimensions from '../masonry/MasonryDimensions';
import Batchinator from '@x-oasis/batchinator';
import { resetContext } from '../ItemMeta';
import { vi, describe, it, beforeEach, expect } from 'vitest';
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
});
