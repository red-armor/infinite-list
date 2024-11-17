import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';
import {
  GenericItemT,
  KeysChangedType,
  MasonryDimensionsProps,
} from '../types';
import ListDimensionsModel from '../ListDimensionsModel';
import KeyIndexManager from '../utils/KeyIndexManager';

class MasonryDimensionsModel<
  ItemT extends GenericItemT = GenericItemT
> extends ListDimensionsModel<ItemT> {
  readonly column: number;
  private _columnDataSource: ItemT[][];
  private _columnIntervalTree: PrefixIntervalTree[];
  private _columnKeyIndexManager: KeyIndexManager[];

  constructor(props: MasonryDimensionsProps<ItemT>) {
    super(props);
    const { column = 2 } = props;
    const [dataSource, intervalTrees, keyIndexManagers] =
      this.initColumnValues(column);
    this.column = column;
    this._columnDataSource = dataSource;
    this._columnIntervalTree = intervalTrees;
    this._columnKeyIndexManager = keyIndexManagers;
  }

  getColumn() {
    return this.column;
  }

  initColumnValues(
    column: number
  ): [ItemT[][], PrefixIntervalTree[], KeyIndexManager[]] {
    const dataSource: ItemT[][] = [];
    const intervalTrees: PrefixIntervalTree[] = [];
    const keyIndexManagers: KeyIndexManager[] = [];
    for (let idx = 0; idx < column; idx++) {
      dataSource.push([]);
      intervalTrees.push(new PrefixIntervalTree(100));
      keyIndexManagers.push(new KeyIndexManager());
    }
    return [dataSource, intervalTrees, keyIndexManagers];
  }

  getDataSource(columnIndex: number) {
    return this._columnDataSource[columnIndex];
  }

  getIntervalTree(columnIndex: number) {
    return this._columnIntervalTree[columnIndex];
  }

  getKeyIndexManager(columnIndex: number) {
    return this._columnKeyIndexManager[columnIndex];
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

  getColumnTotalLength(columnIndex: number) {
    const intervalTree = this._columnIntervalTree[columnIndex];
    return intervalTree.getMaxUsefulLength() ? intervalTree.getHeap()[1] : 0;
  }

  override handleDataChange(
    dataChangedType: KeysChangedType,
    data: ItemT[]
  ): void {
    switch (dataChangedType) {
      case KeysChangedType.Equal:
        break;
      case KeysChangedType.Append:
        this.updateTheLastItemIntervalValue();
        this.append(data);
        break;
      case KeysChangedType.Initial:
        this.append(data);
        break;
      case KeysChangedType.Add:
      case KeysChangedType.Remove:
      case KeysChangedType.Reorder:
        this.shuffle(data);
        break;
    }
  }
}

export default MasonryDimensionsModel;
