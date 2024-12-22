import ItemMeta from './ItemMeta';
import SelectValue from '@x-oasis/select-value';

export default class SortedItems {
  readonly selectValue: SelectValue;
  private _items: Array<ItemMeta> = [];
  private _headValues: Array<ItemMeta> = [];
  private _tailValues: Array<ItemMeta> = [];

  constructor(props: { selectValue: SelectValue }) {
    const { selectValue } = props;
    this.selectValue = selectValue;
  }

  has(itemMeta: ItemMeta) {
    const index = this._items.findIndex((i) => i === itemMeta);
    return index !== -1;
  }

  /**
   *
   * @param itemMeta
   * @returns boolean; true measure a new item and sorted. false means update with layout not
   * change.
   */

  add(itemMeta: ItemMeta) {
    const index = this._items.findIndex((v) => v === itemMeta);
    if (index === -1) {
      this._items.push(itemMeta);
      this._headValues.push(itemMeta);
      this._tailValues.push(itemMeta);
    }

    this.sortValues();
    return true;
  }

  sortValues() {
    const { selectOffset, selectLength } = this.selectValue;

    this._headValues.sort((a, b) => {
      const a1 = selectOffset(a.getLayout()!);
      const b1 = selectOffset(b.getLayout()!);
      // 由小到大
      return a1 - b1;
    });

    this._tailValues.sort((a, b) => {
      const a1 = selectOffset(a.getLayout()!) + selectLength(a.getLayout()!);
      const b1 = selectOffset(b.getLayout()!) + selectLength(b.getLayout()!);
      // 由小到大
      return a1 - b1;
    });
  }

  remove(itemMeta: ItemMeta) {
    const index = this._items.findIndex((i) => i === itemMeta);
    if (index !== -1) this._items.splice(index, 1);

    const headValueIndex = this._headValues.findIndex((i) => i === itemMeta);
    if (headValueIndex !== -1) this._headValues.splice(index, 1);

    const tailValueIndex = this._tailValues.findIndex((i) => i === itemMeta);
    if (tailValueIndex !== -1) this._tailValues.splice(index, 1);
  }

  getItems() {
    return this._items;
  }

  getHeadItems() {
    return this._headValues;
  }

  getTailItems() {
    return this._tailValues;
  }

  getSize() {
    return this._items.length;
  }

  getValues(props: { minOffset: number; maxOffset: number }) {
    const { minOffset, maxOffset } = props;
    const headValues = this.getHeadValues({
      minOffset,
      maxOffset,
    });
    const tailValues = this.getTailValues({
      minOffset,
      maxOffset,
    });
    const values: ItemMeta[] = [];

    const mergedValues = ([] as ItemMeta[]).concat(headValues, tailValues);
    mergedValues.forEach((value) => {
      const index = values.indexOf(value);
      if (index === -1) values.push(value);
    });
    return values;
  }

  getHeadValues(props: {
    minOffset: number;
    maxOffset: number;
  }): Array<ItemMeta> {
    const { selectOffset, selectLength } = this.selectValue;
    const { minOffset, maxOffset } = props;
    const getValue = (item: ItemMeta) => selectOffset(item.getLayout()!);
    const data = this._headValues;
    if (!data.length) return [];

    const min = 0;
    const max = data.length - 1;

    const minValue = getValue(data[min]);
    const maxValue = getValue(data[max]);

    if (maxOffset < minValue || minOffset > maxValue) return [];

    let startIndex = this.greatestLowerBound({
      value: minOffset,
      getValue,
      data,
    });
    const endIndex = this.greatestLowerBound({
      value: maxOffset,
      getValue,
      data,
    });

    if (startIndex > 0) {
      const prev = data[startIndex - 1];
      const layout = prev.getLayout();
      if (layout) {
        if (minOffset < selectLength(layout) + selectOffset(layout)) {
          startIndex = startIndex - 1;
        }
      }
    }

    return data.slice(startIndex, endIndex);
  }

  getTailValues(props: {
    minOffset: number;
    maxOffset: number;
  }): Array<ItemMeta> {
    const { selectOffset, selectLength } = this.selectValue;
    const { minOffset, maxOffset } = props;
    const getValue = (item: ItemMeta) =>
      selectOffset(item.getLayout()!) + selectLength(item.getLayout()!);
    const data = this._headValues;
    const len = data.length;
    if (!len) return [];

    const min = 0;
    const max = data.length - 1;

    const minValue = getValue(data[min]);
    const maxValue = getValue(data[max]);

    if (maxOffset < minValue || minOffset > maxValue) return [];

    const startIndex = this.greatestLowerBound({
      value: minOffset,
      getValue,
      data,
    });
    let endIndex = this.greatestLowerBound({
      value: maxOffset,
      getValue,
      data,
    });

    if (endIndex < len) {
      const item = data[endIndex];
      const layout = item?.getLayout();
      // 即使相等也要将最后一个包含进去
      if (layout && maxOffset >= selectOffset(layout)) {
        endIndex = endIndex + 1;
      }
    }

    return data.slice(startIndex, endIndex);
  }

  // https://stackoverflow.com/a/29018745/2006805
  greatestLowerBound(props: {
    value: number;
    getValue: (item: any) => number;
    data: Array<ItemMeta>;
  }) {
    const { value, getValue, data = [] } = props;

    let min = 0;
    let max = data.length - 1;

    while (min <= max) {
      const index = (min + max) >> 1;
      const item = data[index];
      const cmp = value - getValue(item);
      if (cmp > 0) {
        min = index + 1;
      } else if (cmp < 0) {
        max = index - 1;
      } else {
        return index;
      }
    }
    return min;
  }
}
