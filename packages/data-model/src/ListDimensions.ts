import ListBaseDimensions from './ListBaseDimensions';
import ListDimensionsModel from './ListDimensionsModel';
import { IndexInfo, ScrollMetrics } from './types';
import createStore from './state/createStore';
import { ReducerResult } from './state/types'
class ListDimensions<ItemT extends {} = {}> extends ListBaseDimensions<ItemT> {
  private _dataModel: ListDimensionsModel;

  constructor(props) {
    super({
      ...props,
      store: createStore<ReducerResult>(),
    });
    this._dataModel = new ListDimensionsModel(props);
    this.initializeState()
    this.attemptToHandleEndReached()
  }

  getItemMeta(item: ItemT, index: number) {
    return this._dataModel.getItemMeta(item, index);
  }

  getData() {
    return this._dataModel.getData();
  }

  setData(data: Array<ItemT>) {
    this._dataModel.setData(data);
  }

  getDataLength() {
    return this._dataModel.length;
  }

  getTotalLength() {
    return this._dataModel.getTotalLength();
  }
  getReflowItemsLength() {
    return this._dataModel.getReflowItemsLength();
  }

  getFinalItemKey(item: ItemT) {
    return this._dataModel.getFinalItemKey(item);
  }

  getFinalIndexItemMeta(index: number) {
    return this._dataModel.getIndexItemMeta(index);
  }

  getFinalItemMeta(item: ItemT) {
    return this._dataModel.getFinalItemMeta(item);
  }

  getFinalIndexItemLength(index: number) {
    const itemMeta = this.getFinalIndexItemMeta(index);
    if (itemMeta) return itemMeta.getItemLength();
    return 0;
  }

  getFinalIndexKeyOffset(index: number, exclusive?: boolean) {
    return this.getIndexKeyOffset(index, exclusive);
  }

  getFinalIndexKeyBottomOffset(index: number, exclusive?: boolean) {
    const containerOffset = exclusive ? 0 : this.getContainerOffset()
    const height = this.getTotalLength()
    return containerOffset + (typeof height === 'number' ? height : 0)
  }

  getFinalIndexRangeOffsetMap(
    startIndex: number,
    endIndex: number,
    exclusive?: boolean
  ) {
    const indexToOffsetMap = {};
    let startOffset = this.getIndexKeyOffset(startIndex, exclusive);
    for (let index = startIndex; index <= endIndex; index++) {
      indexToOffsetMap[index] = startOffset;
      const item = this._data[index];
      const itemMeta = this.getItemMeta(item, index);
      startOffset +=
        (itemMeta?.getLayout()?.height || 0) +
        (itemMeta?.getSeparatorLength() || 0);
    }
    return indexToOffsetMap;
  }
  computeIndexRange(minOffset: number, maxOffset: number) {
    return this._dataModel.computeIndexRange(minOffset, maxOffset);
  }
  getIndexKeyOffset(index: number, exclusive?: boolean) {
    return this._dataModel.getIndexKeyOffset(index, exclusive);
  }
  getIndexItemMeta(index: number) {
    return this._dataModel.getIndexItemMeta(index);
  }

  onItemLayoutChanged() {
    this.updateScrollMetrics(this._scrollMetrics);
  }

  onDataSourceChanged() {
    this.updateScrollMetrics(this._scrollMetrics);
  }

  getFinalKeyIndexInfo(key: string): IndexInfo {
    return {
      index: this._dataModel.getKeyIndex(key) || 0,
    } as IndexInfo;
  }

  updateScrollMetrics(
    _scrollMetrics?: ScrollMetrics,
    _options?: {
      useCache?: boolean;
      flush?: boolean;
    }
  ) {
    this._scrollMetrics = _scrollMetrics || this._scrollMetrics;
    this._updateScrollMetrics(this._scrollMetrics, _options);
  }
}

export default ListDimensions;
