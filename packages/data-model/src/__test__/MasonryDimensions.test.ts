import MasonryDimensions from '../masonry/MasonryDimensions';
import Batchinator from '@x-oasis/batchinator';
import { resetContext } from '../ItemMeta';
import { vi, describe, it, beforeEach, expect } from 'vitest';
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

  it('constructor', () => {
    const masonryDimensions = new MasonryDimensions({
      data: buildData(4),
      id: 'masonry',
      keyExtractor: (item) => `${item.key}`,
    });

    expect(masonryDimensions.getDataModel().getColumn()).toBe(2);
  });
});
