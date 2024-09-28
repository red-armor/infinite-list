import ListBaseDimensions from './ListBaseDimensions';
import ListDimensionsModel from './ListDimensionsModel';
import createStore from './state/createStore';
import {
  ScrollMetrics,
  ItemLayout,
  ListDimensionsModelProps,
  ListIndexInfo,
} from './types';

class ListDimensions<
  ItemT extends {
    [key: string]: any;
  } = object
> extends ListBaseDimensions<ItemT> {
  private _dataModel: ListDimensionsModel<ItemT>;

  constructor(
    props: Omit<ListDimensionsModelProps<ItemT>, 'container' | 'store'>
  ) {
    super({
      ...props,
      store: createStore(),
    });
    this._dataModel = new ListDimensionsModel<ItemT>({
      recycleEnabled: true,
      ...props,
      container: this,
    });
    // this.initializeStateResult();
    this.attemptToHandleEndReached();
  }

  getKeyIndex(key: string) {
    return this._dataModel.getKeyIndex(key);
  }

  getIndexKey(index: number) {
    return this._dataModel.getIndexKey(index);
  }

  getIntervalTree() {
    return this._dataModel.intervalTree;
  }

  getItemMeta(item: ItemT, index: number) {
    return this._dataModel.getItemMeta(item, index);
  }

  getData() {
    return this._dataModel.getData();
  }

  setData(data: Array<ItemT>) {
    return this._dataModel.setData(data);
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
    return this._dataModel.getFinalItemKey(item) || '';
  }

  getFinalIndexItemMeta(index: number) {
    return this._dataModel.getIndexItemMeta(index);
  }

  getFinalItemMeta(item: ItemT) {
    return this._dataModel.getFinalItemMeta(item);
  }

  getFinalIndexItemLength(index: number) {
    const itemMeta = this.getFinalIndexItemMeta(index);
    if (itemMeta) return itemMeta.getFinalItemLength();
    return 0;
  }

  getFinalIndexKeyOffset(index: number, exclusive?: boolean) {
    return this.getIndexKeyOffset(index, exclusive);
  }

  getFinalIndexKeyBottomOffset(index: number, exclusive?: boolean) {
    const containerOffset = exclusive ? 0 : this.getContainerOffset();
    const height = this.getTotalLength();
    return containerOffset + (typeof height === 'number' ? height : 0);
  }

  getFinalIndexRangeOffsetMap(
    startIndex: number,
    endIndex: number,
    exclusive?: boolean
  ) {
    const indexToOffsetMap: {
      [key: number]: number;
    } = {};
    let startOffset = this.getIndexKeyOffset(startIndex, exclusive);
    for (let index = startIndex; index <= endIndex; index++) {
      indexToOffsetMap[index] = startOffset;
      const item = this._data[index];
      const itemMeta = this.getItemMeta(item, index);

      startOffset += itemMeta?.getFinalItemLength() || 0;
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

  getFinalKeyIndexInfo(key: string): ListIndexInfo<ItemT> {
    return {
      dimensions: this._dataModel,
      index: this._dataModel.getKeyIndex(key) || 0,
    };
  }

  setFinalKeyItemLayout(
    itemKey: string,
    layout: ItemLayout | number,
    updateIntervalTree?: boolean
  ) {
    return this._dataModel.setKeyItemLayout(
      itemKey,
      layout,
      updateIntervalTree
    );
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
