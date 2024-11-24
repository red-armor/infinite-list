import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';
import { GenericItemT, MasonryDimensionsModelProps } from '../types';
import ListDimensionsModel from '../ListDimensionsModel';
import KeyIndexManager from '../utils/KeyIndexManager';
import MasonryDimensionStrategy from './MasonryDimensionStrategy';

/**
 * The key point is how to decorate `columnIntervalTree` and `columnKeyIndexManager`
 * value.
 */
class MasonryDimensionsModel<
  ItemT extends GenericItemT = GenericItemT
> extends ListDimensionsModel<ItemT> {
  readonly column: number;
  private _columnDataSource: ItemT[][];
  private _columnIntervalTree: PrefixIntervalTree[];
  private _columnKeyIndexManager: KeyIndexManager[];
  private _strategies: MasonryDimensionStrategy<ItemT>[];

  constructor(props: MasonryDimensionsModelProps<ItemT>) {
    super(props);
    const { column = 2 } = props;
    const [strategies, dataSource, intervalTrees, keyIndexManagers] =
      this.initColumnValues(column, props);
    this.column = column;
    this._strategies = strategies;
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
    KeyIndexManager[]
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
   * return index in column
   */
  getKeyIndexInColumn(key: string) {
    for (let columnIndex = 0; columnIndex < this.column; columnIndex++) {
      const indexManager = this.getColumnKeyIndexManager(columnIndex);
      const indexInColumn = indexManager.getKeyIndex(key);
      if (typeof indexInColumn === 'number') {
        return indexInColumn;
      }
    }
    return 0;
  }

  getColumnTotalLength(columnIndex: number) {
    const intervalTree = this._columnIntervalTree[columnIndex];
    return intervalTree.getMaxUsefulLength() ? intervalTree.getHeap()[1] : 0;
  }
}

export default MasonryDimensionsModel;
