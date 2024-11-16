import {
  GenericItemT,
  KeysChangedType,
  MasonryDimensionsProps,
} from '../types';
import ListDimensionsModel from '../ListDimensionsModel';

class DndDimensionsModel<
  ItemT extends GenericItemT = GenericItemT
> extends ListDimensionsModel<ItemT> {
  private _columnDataSource: ItemT[][];

  constructor(props: MasonryDimensionsProps<ItemT>) {
    super(props);
    const { column = 2 } = props;
    this._columnDataSource = this.initColumnDataSource(column);
  }

  initColumnDataSource(column: number) {
    const result: ItemT[][] = [];
    for (let idx = 0; idx < column; idx++) {
      result.push([]);
    }
    return result;
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

export default DndDimensionsModel;
