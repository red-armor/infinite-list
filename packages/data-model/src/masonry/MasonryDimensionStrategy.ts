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
import { ReducerResult } from '../state/types';
import createStore from '../state/createStore';

/**
 * a lite ListDimensionsModel version
 */
class MasonryDimensionStrategy<
  ItemT extends GenericItemT = GenericItemT
> extends BaseImpl<ItemT> {
  readonly columnIndex: number;
  readonly _dataModel: MasonryDimensionsModel<ItemT>;

  constructor(props: MasonryDimensionStrategyProps<ItemT>) {
    super({
      ...props,
      store: createStore<ReducerResult>(),
    });
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
    const intervalTree = this._dataModel.getColumnIntervalTree(
      this.columnIndex
    );
    return intervalTree?.getMaxUsefulLength() ? intervalTree?.getHeap()[1] : 0;
  }

  getReflowItemsLength() {
    const intervalTree = this._dataModel.getColumnIntervalTree(
      this.columnIndex
    );
    return intervalTree?.getMaxUsefulLength() || 0;
  }

  getFinalItemKey(item: ItemT) {
    return this._dataModel.getFinalItemKey(item) || '';
  }

  getFinalIndexItemMeta(index: number) {
    return this._dataModel.getColumnIndexItemMeta(this.columnIndex, index);
    // return this._dataModel.getIndexItemMeta(index);
  }

  getFinalItemMeta(item: ItemT) {
    return this._dataModel.getFinalItemMeta(item);
  }

  getFinalIndexItemLength(index: number) {
    const itemMeta = this.getFinalIndexItemMeta(index);
    if (itemMeta) return itemMeta.getFinalItemLength();
    return 0;
  }

  /**
   *
   * @param index
   * @param exclusive
   * @returns
   */
  getIndexKeyOffset(indexInColumn: number, exclusive?: boolean) {
    return this._dataModel.getColumnIndexKeyOffset(
      this.columnIndex,
      indexInColumn,
      exclusive
    );
  }

  getFinalIndexKeyOffset(indexInColumn: number, exclusive?: boolean) {
    return this.getIndexKeyOffset(indexInColumn, exclusive);
  }

  /**
   *
   * @param index
   * @param exclusive
   * @returns
   *
   * include the last item height
   */
  getFinalIndexKeyBottomOffset(index: number, exclusive?: boolean) {
    const containerOffset = exclusive ? 0 : this.getContainerOffset();
    const height = this._dataModel.getColumnTotalLength(this.columnIndex);
    return containerOffset + (typeof height === 'number' ? height : 0);
  }

  /**
   *
   * @param itemKey
   * @param layout
   * @param updateIntervalTree
   * @returns
   *
   */
  setFinalKeyItemLayout(
    itemKey: string,
    layout: ItemLayout | number,
    updateIntervalTree?: boolean
  ) {
    return this._dataModel.setMasonryKeyItemLayout(
      itemKey,
      layout,
      updateIntervalTree
    );
  }

  getFinalKeyIndexInfo(key: string): MasonryIndexInfo<ItemT> {
    return {
      dimensions: this._dataModel,
      index: this._dataModel
        .getColumnKeyIndexManager(this.columnIndex)
        .getKeyIndex(key),
      columnIndex: this.columnIndex,
      indexInTotal: this._dataModel.getKeyIndex(key) || 0,
    };
  }

  computeIndexRange(minOffset: number, maxOffset: number) {
    const intervalTree = this._dataModel.getColumnIntervalTree(
      this.columnIndex
    );
    return intervalTree.computeRange(minOffset, maxOffset);
  }

  getFinalIndexRangeOffsetMap(
    /**
     * startIndex is index in column
     */
    startIndexInColumn: number,
    endIndexInColumn: number,
    exclusive?: boolean
  ) {
    const indexToOffsetMap: IndexToOffsetMap = {};

    let startOffset = this.getFinalIndexKeyOffset(
      startIndexInColumn,
      exclusive
    );

    for (let index = startIndexInColumn; index <= endIndexInColumn; index++) {
      const itemMeta = this.getFinalIndexItemMeta(index);

      if (!itemMeta) continue;

      indexToOffsetMap[index] = startOffset;

      if (itemMeta?.isApproximateLayout) {
        indexToOffsetMap[index] = this.itemOffsetBeforeLayoutReady;
      } else {
        indexToOffsetMap[index] = startOffset;
      }

      startOffset += itemMeta?.getFinalItemLength();
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
