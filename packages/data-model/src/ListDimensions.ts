// import BaseLayout from './BaseLayout';
import ListBaseDimensions from './ListBaseDimensions';
import ListDimensionsModel from './ListDimensionsModel';
import { ListProvider, IndexInfo } from './types';
class ListDimensions<ItemT extends {} = {}>
  extends ListBaseDimensions<ItemT>
  implements ListProvider
{
  private _dataModel: ListDimensionsModel;

  constructor(props) {
    super(props);
    this._dataModel = new ListDimensionsModel(props);
  }

  getItemKey() {}

  getKeyItem() {}

  getItemDimension() {}

  getKeyDimension() {}

  getData() {
    return [];
  }
  getDataLength() {
    return 0;
  }
  getTotalLength() {
    return 0;
  }
  getReflowItemsLength() {
    return 0;
  }
  getFinalItemKey() {}
  getFinalIndexItemMeta() {}
  getFinalItemMeta() {}
  getFinalIndexItemLength() {}
  getFinalIndexKeyOffset() {}
  getFinalIndexKeyBottomOffset() {
    return 0;
  }
  getFinalIndexRangeOffsetMap() {}
  computeIndexRange() {}
  getIndexKeyOffset() {
    return 0;
  }
  getIndexItemMeta(idx: number) {
    return null;
  }

  onItemLayoutChanged() {}

  onDataSourceChanged() {}

  getFinalKeyIndexInfo(key: string): IndexInfo {
    return {
      index: this._dataModel.getKeyIndex(key) || 0,
    } as IndexInfo;
  }
}

export default ListDimensions;
