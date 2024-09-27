import SortedItems from '../SortedItems';
import SelectValue from '@x-oasis/select-value';
import ItemMeta from '../ItemMeta';
import Batchinator from '@x-oasis/batchinator';
import { vi, describe, expect, it } from 'vitest';

vi.useFakeTimers();

vi.spyOn(Batchinator.prototype, 'schedule').mockImplementation(function (
  ...args
) {
  // eslint-disable-next-line prefer-spread
  this._callback.apply(this, args);
});

const createSortedItems = () => {
  const selectValue = new SelectValue({ horizontal: false });
  return new SortedItems({ selectValue });
};

const getKeys = (items: Array<ItemMeta>) => {
  return items.map((item) => item.getKey());
};

describe('basic', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['requestIdleCallback'] });
  });
  it('basic 1', () => {
    const sortedItems = createSortedItems();
    const item1 = new ItemMeta({
      key: 'item1',
      layout: { x: 0, y: 100, width: 20, height: 100 },
    });
    const item2 = new ItemMeta({
      key: 'item2',
      layout: { x: 0, y: 300, width: 20, height: 100 },
    });
    const item3 = new ItemMeta({
      key: 'item3',
      layout: { x: 0, y: 400, width: 20, height: 100 },
    });
    const item4 = new ItemMeta({
      key: 'item4',
      layout: { x: 0, y: 700, width: 20, height: 100 },
    });
    sortedItems.add(item1);
    sortedItems.add(item2);
    sortedItems.add(item3);
    sortedItems.add(item4);

    const minOffset = 150;
    const maxOffset = 701;

    const headValues = sortedItems.getHeadValues({
      minOffset,
      maxOffset,
    });
    expect(headValues.length).toBe(4);
    expect(getKeys(headValues)).toEqual(['item1', 'item2', 'item3', 'item4']);
  });

  it('basic 2', () => {
    const sortedItems = createSortedItems();
    const item1 = new ItemMeta({
      key: 'item1',
      layout: { x: 0, y: 100, width: 20, height: 100 },
    });
    const item2 = new ItemMeta({
      key: 'item2',
      layout: { x: 0, y: 300, width: 20, height: 100 },
    });
    const item3 = new ItemMeta({
      key: 'item3',
      layout: { x: 0, y: 400, width: 20, height: 100 },
    });
    const item4 = new ItemMeta({
      key: 'item4',
      layout: { x: 0, y: 700, width: 20, height: 100 },
    });
    sortedItems.add(item1);
    sortedItems.add(item2);
    sortedItems.add(item3);
    sortedItems.add(item4);

    const minOffset = 150;
    const maxOffset = 700;

    const headValues = sortedItems.getHeadValues({
      minOffset,
      maxOffset,
    });
    expect(headValues.length).toBe(3);
    expect(getKeys(headValues)).toEqual(['item1', 'item2', 'item3']);
  });

  it('basic 4', () => {
    const sortedItems = createSortedItems();
    const item1 = new ItemMeta({
      key: 'item1',
      layout: { x: 0, y: 100, width: 20, height: 100 },
    });
    const item2 = new ItemMeta({
      key: 'item2',
      layout: { x: 0, y: 300, width: 20, height: 100 },
    });
    const item3 = new ItemMeta({
      key: 'item3',
      layout: { x: 0, y: 400, width: 20, height: 100 },
    });
    const item4 = new ItemMeta({
      key: 'item4',
      layout: { x: 0, y: 700, width: 20, height: 100 },
    });
    sortedItems.add(item1);
    sortedItems.add(item2);
    sortedItems.add(item3);
    sortedItems.add(item4);

    const minOffset = 110;
    const maxOffset = 115;

    const headValues = sortedItems.getHeadValues({
      minOffset,
      maxOffset,
    });
    expect(headValues.length).toBe(1);
    expect(getKeys(headValues)).toEqual(['item1']);
  });
});

describe('merge', () => {
  it('basic head', () => {
    const sortedItems = createSortedItems();
    const item1 = new ItemMeta({
      key: 'item1',
      layout: { x: 0, y: 100, width: 20, height: 100 },
    });
    const item2 = new ItemMeta({
      key: 'item2',
      layout: { x: 0, y: 300, width: 20, height: 100 },
    });
    const item3 = new ItemMeta({
      key: 'item3',
      layout: { x: 0, y: 400, width: 20, height: 100 },
    });
    const item4 = new ItemMeta({
      key: 'item4',
      layout: { x: 0, y: 700, width: 20, height: 100 },
    });
    sortedItems.add(item1);
    sortedItems.add(item2);
    sortedItems.add(item3);
    sortedItems.add(item4);

    const minOffset = 701;
    const maxOffset = 800;

    const headValues = sortedItems.getHeadValues({
      minOffset,
      maxOffset,
    });
    expect(headValues.length).toBe(0);
  });

  it('basic tail', () => {
    const sortedItems = createSortedItems();
    const item1 = new ItemMeta({
      key: 'item1',
      layout: { x: 0, y: 100, width: 20, height: 100 },
    });
    const item2 = new ItemMeta({
      key: 'item2',
      layout: { x: 0, y: 300, width: 20, height: 100 },
    });
    const item3 = new ItemMeta({
      key: 'item3',
      layout: { x: 0, y: 400, width: 20, height: 100 },
    });
    const item4 = new ItemMeta({
      key: 'item4',
      layout: { x: 0, y: 700, width: 20, height: 100 },
    });
    sortedItems.add(item1);
    sortedItems.add(item2);
    sortedItems.add(item3);
    sortedItems.add(item4);

    const minOffset = 701;
    const maxOffset = 800;

    const tailValues = sortedItems.getTailValues({
      minOffset,
      maxOffset,
    });
    expect(tailValues.length).toBe(1);
    expect(getKeys(tailValues)).toEqual(['item4']);
  });
});

describe('test `greatestLowerBound`', () => {
  it('return 0, if less than min value', () => {
    const sortedItems = createSortedItems();
    const item1 = new ItemMeta({
      key: 'item1',
      layout: { x: 0, y: 100, width: 20, height: 100 },
    });
    const item2 = new ItemMeta({
      key: 'item2',
      layout: { x: 0, y: 300, width: 20, height: 100 },
    });
    const item3 = new ItemMeta({
      key: 'item3',
      layout: { x: 0, y: 400, width: 20, height: 100 },
    });
    const item4 = new ItemMeta({
      key: 'item4',
      layout: { x: 0, y: 700, width: 20, height: 100 },
    });
    sortedItems.add(item1);
    sortedItems.add(item2);
    sortedItems.add(item3);
    sortedItems.add(item4);

    const index = sortedItems.greatestLowerBound({
      value: 50,
      getValue: (item) =>
        sortedItems.selectValue.selectOffset(item.getLayout()),
      data: sortedItems.getHeadItems(),
    });

    expect(index).toBe(0);
  });

  it('return data.length , if greater than max value', () => {
    const sortedItems = createSortedItems();
    const item1 = new ItemMeta({
      key: 'item1',
      layout: { x: 0, y: 100, width: 20, height: 100 },
    });
    const item2 = new ItemMeta({
      key: 'item2',
      layout: { x: 0, y: 300, width: 20, height: 100 },
    });
    const item3 = new ItemMeta({
      key: 'item3',
      layout: { x: 0, y: 400, width: 20, height: 100 },
    });
    const item4 = new ItemMeta({
      key: 'item4',
      layout: { x: 0, y: 700, width: 20, height: 100 },
    });
    sortedItems.add(item1);
    sortedItems.add(item2);
    sortedItems.add(item3);
    sortedItems.add(item4);

    const index = sortedItems.greatestLowerBound({
      value: 701,
      getValue: (item) =>
        sortedItems.selectValue.selectOffset(item.getLayout()),
      data: sortedItems.getHeadItems(),
    });

    expect(index).toBe(4);
  });
});
