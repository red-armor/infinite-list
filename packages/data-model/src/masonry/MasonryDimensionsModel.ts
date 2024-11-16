import {
  GenericItemT,
  KeysChangedType,
  MasonryDimensionsProps,
} from '../types';
import ListDimensionsModel from '../ListDimensionsModel';
import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';

class MasonryDimensionsModel<
  ItemT extends GenericItemT = GenericItemT
> extends ListDimensionsModel<ItemT> {
  readonly column: number;
  private _columnDataSource: ItemT[][];
  private _columnIntervalTree: PrefixIntervalTree[];

  constructor(props: MasonryDimensionsProps<ItemT>) {
    super(props);
    const { column = 2 } = props;
    const [dataSource, intervalTrees] = this.initColumnValues(column);
    this.column = column;
    this._columnDataSource = dataSource;
    this._columnIntervalTree = intervalTrees;
  }

  getColumn() {
    return this.column;
  }

  initColumnValues(column: number): [ItemT[][], PrefixIntervalTree[]] {
    const dataSource: ItemT[][] = [];
    const intervalTrees: PrefixIntervalTree[] = [];
    for (let idx = 0; idx < column; idx++) {
      dataSource.push([]);
      intervalTrees.push(new PrefixIntervalTree(100));
    }
    return [dataSource, intervalTrees];
  }

  getDataSource(columnIndex: number) {
    return this._columnDataSource[columnIndex];
  }

  getIntervalTree(columnIndex: number) {
    return this._columnIntervalTree[columnIndex];
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
