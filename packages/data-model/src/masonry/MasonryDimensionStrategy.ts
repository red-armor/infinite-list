import BaseImpl from '../strategies/BaseImpl';
import {
  ItemLayout,
  GenericItemT,
  ScrollMetrics,
  MasonryIndexInfo,
  IndexToOffsetMap,
  MasonryDimensionStrategyProps,
} from '../types';
import MasonryDimensionsModel from './MasonryDimensionsModel';

class MasonryDimensionStrategy<
  ItemT extends GenericItemT = GenericItemT
> extends BaseImpl<ItemT> {
  readonly columnIndex: number;
  readonly _dataModel: MasonryDimensionsModel<ItemT>;

  constructor(props: MasonryDimensionStrategyProps<ItemT>) {
    super(props);
    const { columnIndex, dataModel } = props;
    this.columnIndex = columnIndex;
    this._dataModel = dataModel;
  }

  getData() {
    return this._dataModel.getDataSource(this.columnIndex);
  }

  override getDataLength(): number {
    return this.getData().length;
  }

  getTotalLength() {
    const intervalTree = this._dataModel.getIntervalTree(this.columnIndex);
    return intervalTree?.getMaxUsefulLength() ? intervalTree?.getHeap()[1] : 0;
  }

  getReflowItemsLength() {
    const intervalTree = this._dataModel.getIntervalTree(this.columnIndex);
    return intervalTree?.getMaxUsefulLength() || 0;
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

  getIndexKeyOffset(index: number, exclusive?: boolean) {
    return this._dataModel.getIndexKeyOffset(index, exclusive);
  }

  getFinalIndexKeyOffset(index: number, exclusive?: boolean) {
    return this.getIndexKeyOffset(index, exclusive);
  }

  getFinalIndexKeyBottomOffset(index: number, exclusive?: boolean) {
    const containerOffset = exclusive ? 0 : this.getContainerOffset();
    const height = this.getTotalLength();
    return containerOffset + (typeof height === 'number' ? height : 0);
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

  getFinalKeyIndexInfo(key: string): MasonryIndexInfo<ItemT> {
    return {
      dimensions: this._dataModel,
      index: 0,
      columnIndex: this.columnIndex,
      indexInTotal: this._dataModel.getKeyIndex(key) || 0,
    };
  }

  computeIndexRange(minOffset: number, maxOffset: number) {
    const intervalTree = this._dataModel.getIntervalTree(this.columnIndex);
    return intervalTree.computeRange(minOffset, maxOffset);
  }

  getFinalIndexRangeOffsetMap(
    startIndex: number,
    endIndex: number,
    exclusive?: boolean
  ) {
    const indexToOffsetMap: IndexToOffsetMap = {};
    let startOffset = this.getFinalIndexKeyOffset(startIndex, exclusive);

    for (let index = startIndex; index <= endIndex; index++) {
      const itemMeta = this.getFinalIndexItemMeta(index);

      if (!itemMeta) continue;

      indexToOffsetMap[index] = startOffset;

      if (itemMeta?.isApproximateLayout) {
        indexToOffsetMap[index] = this.itemOffsetBeforeLayoutReady;
      } else {
        indexToOffsetMap[index] = startOffset;
        startOffset += itemMeta?.getFinalItemLength();
      }
    }
    return indexToOffsetMap;
  }

  onDataSourceChanged() {
    this.updateScrollMetrics(this._scrollMetrics);
  }

  onItemLayoutChanged() {
    this.updateScrollMetrics(this._scrollMetrics);
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

export default MasonryDimensionStrategy;
