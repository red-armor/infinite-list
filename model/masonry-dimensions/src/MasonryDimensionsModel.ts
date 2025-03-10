import { ItemLayout } from '@infinite-list/dimensions-model';
import { ListDimensionsModel } from '@infinite-list/dimensions-model';
import { KeyIndexManager } from '@infinite-list/utils';
import defaultValue from '@x-oasis/default-value';
import layoutEqual from '@x-oasis/layout-equal';
import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';
import MasonryDimensionStrategy from './MasonryDimensionStrategy';
import { LAYOUT_EQUAL_CORRECTION_VALUE } from './common';
import { GenericItemT, MasonryDimensionsModelProps } from './types';

/**
 * The key point is how to decorate `columnIntervalTree` and `columnKeyIndexManager`
 * value.
 */
class MasonryDimensionsModel<
  ItemT extends GenericItemT = GenericItemT,
> extends ListDimensionsModel<ItemT> {
  readonly column: number;
  private _columnDataSource: ItemT[][];
  private _columnIntervalTree: PrefixIntervalTree[];
  private _columnKeyIndexManager: KeyIndexManager[];
  private _strategies: MasonryDimensionStrategy<ItemT>[];
  // readonly persistenceIndices: number[];
  // readonly initialNumToRender: number;

  constructor(props: MasonryDimensionsModelProps<ItemT>) {
    super(props);
    const {
      column = 2,
      persistenceIndices = [],
      initialNumToRender = 0,
    } = props;
    const [strategies, dataSource, intervalTrees, keyIndexManagers] =
      this.initColumnValues(column, props);
    this.column = column;
    this._strategies = strategies;
    this.persistenceIndices = persistenceIndices;
    this.initialNumToRender = initialNumToRender;
    this._columnDataSource = dataSource;
    this._columnIntervalTree = intervalTrees;
    this._columnKeyIndexManager = keyIndexManagers;
    this.setData(props.data);
  }

  getColumn() {
    return this.column;
  }

  getColumnDataSource() {
    return this._columnDataSource;
  }

  getStrategies() {
    return this._strategies;
  }

  initColumnValues(
    column: number,
    props: MasonryDimensionsModelProps<ItemT>
  ): [
    MasonryDimensionStrategy<ItemT>[],
    ItemT[][],
    PrefixIntervalTree[],
    KeyIndexManager[],
  ] {
    const dataSource: ItemT[][] = [];
    const intervalTrees: PrefixIntervalTree[] = [];
    const keyIndexManagers: KeyIndexManager[] = [];
    const strategies: MasonryDimensionStrategy<ItemT>[] = [];
    for (let idx = 0; idx < column; idx++) {
      dataSource.push([]);
      intervalTrees.push(new PrefixIntervalTree(100));
      keyIndexManagers.push(new KeyIndexManager());
      strategies.push(
        new MasonryDimensionStrategy({
          columnIndex: idx,
          dataModel: this,
          recycleEnabled: true,
          initialNumToRender: this.initialNumToRender,
          persistenceIndices: this.persistenceIndices,
          ...props,
        })
      );
    }
    return [strategies, dataSource, intervalTrees, keyIndexManagers];
  }

  setDataSource(dataSource: ItemT[][]) {
    dataSource.forEach((data, index) => {
      this._columnDataSource[index] = data;
    });
  }

  getDataSource(columnIndex: number) {
    return this._columnDataSource[columnIndex];
  }

  getColumnIntervalTree(columnIndex: number) {
    return this._columnIntervalTree[columnIndex];
  }

  setColumnIntervalTree(columnIndex: number, intervalTree: PrefixIntervalTree) {
    this._columnIntervalTree[columnIndex] = intervalTree;
  }

  getColumnKeyIndexManager(columnIndex: number) {
    return this._columnKeyIndexManager[columnIndex];
  }

  setColumnKeyIndexManager(
    columnIndex: number,
    keyIndexManager: KeyIndexManager
  ) {
    this._columnKeyIndexManager[columnIndex] = keyIndexManager;
  }

  getColumnIndexItemMeta(columnIndex: number, indexInColumn: number) {
    const keyIndexManager = this._columnKeyIndexManager[columnIndex];
    const itemKey = keyIndexManager.getIndexKey(indexInColumn);
    return this.getKeyMeta(itemKey);
  }

  getColumnStrategy(index: number) {
    return this._strategies[index];
  }

  setMasonryKeyItemLayout(
    itemKey: string,
    layout: ItemLayout | number,
    updateIntervalTree?: boolean
  ) {
    // masonry list interval is no need to update..
    // this.setKeyItemLayout(
    //   itemKey,
    //   layout,
    //   false
    // );

    this.setColumnKeyItemLayout(itemKey, layout, updateIntervalTree);
    return true;
  }

  getColumnIndexKeyOffset(
    columnIndex: number,
    indexInColumn: number,
    exclusive?: boolean
  ) {
    const intervalTree = this._columnIntervalTree[columnIndex];
    const listOffset = exclusive ? 0 : this.getContainerOffset();

    if (typeof indexInColumn === 'number') {
      return (
        listOffset +
        (indexInColumn >= intervalTree.getMaxUsefulLength()
          ? intervalTree.getHeap()[1]
          : intervalTree.sumUntil(indexInColumn))
      );
    }
    return 0;
  }

  // should be overrided, or will cause error
  override getKeyItemOffset(key: string, exclusive?: boolean) {
    const columnIndex = this.getKeyColumnIndex(key);
    const index = this.getKeyIndexInColumn(key);
    const listOffset = exclusive ? 0 : this.getContainerOffset();
    const intervalTree = this.getColumnIntervalTree(columnIndex);

    if (typeof index === 'number') {
      return (
        listOffset +
        (index >= intervalTree.getMaxUsefulLength()
          ? intervalTree.getHeap()[1]
          : intervalTree.sumUntil(index))
      );
    }
    return 0;
  }

  /**
   *
   */
  getKeyColumnIndex(key: string) {
    for (let columnIndex = 0; columnIndex < this.column; columnIndex++) {
      const indexManager = this.getColumnKeyIndexManager(columnIndex);
      if (indexManager.hasKey(key)) {
        return columnIndex;
      }
    }
    return 0;
  }

  /**
   * return index in column; comparing with `getKeyIndex` which will return index in total
   */
  getKeyIndexInColumn(key: string) {
    const columnIndex = this.getKeyColumnIndex(key);
    const keyIndexManager = this.getColumnKeyIndexManager(columnIndex);
    return defaultValue(keyIndexManager.getKeyIndex(key), -1);
  }

  getColumnTotalLength(columnIndex: number) {
    const intervalTree = this._columnIntervalTree[columnIndex];
    return intervalTree.getMaxUsefulLength() ? intervalTree.getHeap()[1] : 0;
  }

  /**
   *
   * @param key string, itemKey
   * @param info
   * @param updateIntervalTree target IntervalTree, now this property is used in
   * MasonryList
   * @returns boolean value, true for updating intervalTree successfully.
   */
  setColumnKeyItemLayout(
    key: string,
    info: ItemLayout | number,
    updateIntervalTree?: boolean
  ) {
    const columnIndex = this.getKeyColumnIndex(key);

    if (columnIndex === -1) {
      return;
    }

    const data = this.getColumnDataSource()[columnIndex];
    const intervalTree = this.getColumnIntervalTree(columnIndex);

    const _update =
      typeof updateIntervalTree === 'boolean' ? updateIntervalTree : true;

    // if (!falsy) {
    //   if (this._parentItemsDimensions)
    //     return this._parentItemsDimensions.setKeyItemLayout(key, info, _update);
    //   return false;
    // }
    const index = this.getKeyIndexInColumn(key);
    // const item = this._data[index];
    const meta = this.getKeyMeta(key);
    // const meta = this.getItemMeta(item, index);

    if (!meta) return false;

    if (typeof info === 'number') {
      let length = this.normalizeLengthNumber(info);
      meta.isApproximateLayout = false;

      if (
        Math.abs(
          length - (this._selectValue.selectLength(meta.getLayout() || {}) || 0)
        ) > LAYOUT_EQUAL_CORRECTION_VALUE
      ) {
        this._selectValue.setLength(meta.ensureLayout(), length);

        // if (index !== this._data.length - 1) {
        if (index !== data.length - 1) {
          meta.setUseSeparatorLength(true);
          // length = meta.getSeparatorLength() + length;
        } else {
          meta.setUseSeparatorLength(false);
        }

        length = meta.getFinalItemLength();

        if (_update) {
          intervalTree.set(index, length);
          // this.setIntervalTreeValue(index, length);

          // TODO: the following is specific logic in MasonryList
          this.triggerOwnerRecalculateLayout();

          return true;
        }
      } else if (meta.isApproximateLayout) {
        // 比如换了一个item的话，不会触发更新
        this.triggerOwnerRecalculateLayout();
      }

      return false;
    }
    const _info = this.normalizeLengthInfo(info);
    const metaLayout = meta.getLayout();

    if (
      !metaLayout ||
      !layoutEqual(metaLayout, _info as ItemLayout, {
        keysToCheck: this.horizontal ? ['width'] : ['height'],
        correctionValue: LAYOUT_EQUAL_CORRECTION_VALUE,
      })
    ) {
      meta.isApproximateLayout = false;
      const currentLength = this._selectValue.selectLength(
        meta.getLayout() || {}
      );
      let length = this._selectValue.selectLength((_info as ItemLayout) || {});
      meta.setLayout(_info as ItemLayout);
      // 只有关心的值发生变化时，才会再次触发setIntervalTreeValue
      if (currentLength !== length && _update) {
        if (index !== data.length - 1) {
          // if (index !== this._data.length - 1) {
          meta.setUseSeparatorLength(true);
          // length = meta.getSeparatorLength() + length;
        } else {
          meta.setUseSeparatorLength(false);
        }

        length = meta.getFinalItemLength();

        intervalTree.set(index, length);

        // TODO: the following is specific logic in MasonryList
        this.triggerOwnerRecalculateLayout();
        // this.setIntervalTreeValue(index, length);
        return true;
      }
    } else if (meta.isApproximateLayout) {
      meta.isApproximateLayout = false;
      // 比如换了一个item的话，不会触发更新
      this.triggerOwnerRecalculateLayout();
    }

    return false;
  }
}

export default MasonryDimensionsModel;
