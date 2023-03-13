import ListDimensions from '../ListDimensions';
import Batchinator from '../batcher/Batchinator';
import { defaultKeyExtractor } from '../exportedUtils';
import { KeysChangedType } from '../types';
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
  it('constructor', () => {
    const listDimensions = new ListDimensions({
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      data: buildData(20),
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

    expect(listDimensions.maxToRenderPerBatch).toBe(7);
    expect(listDimensions.windowSize).toBe(9);
    expect(listDimensions.initialNumToRender).toBe(20);
    expect(listDimensions.onEndReachedThreshold).toBe(300);
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
