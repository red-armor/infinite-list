import type { KeysChangedType } from '@infinite-list/base-dimensions';
import type {
  ItemLayout,
  ListDimensionsModel,
} from '@infinite-list/dimensions-model';
import { OnEndReachedHelper } from '@infinite-list/viewable';
import Batchinator from '@x-oasis/batchinator';
import defaultBooleanValue from '@x-oasis/default-boolean-value';
import MasonryDimensionsModel from './MasonryDimensionsModel';
import { DISPATCH_METRICS_THRESHOLD } from './common';
import type {
  DimensionsModelContainer,
  GenericItemT,
  MasonryDimensionsProps,
  MasonryIndexInfo,
  MasonryStateListener,
  ScrollMetrics,
} from './types';
import { chunkifyDataSource } from './utils';

const DEFAULT_MASONRY_COLUMN = 2;
let count = 0;

/**
 * MasonryDimensions ->  MasonryDimensionsModel -> init data -> get changedType
 *                                                                   ↓
 * chunkify data source <- onListDimensionsModelDataChanged  <- MasonryDimensions
 *           ↓
 * MasonryDimensionsModel -> patch chunk data -> MasonryDimensions -> dispatchMetrics
 *                                                                         ↓
 *                                                                   render view
 */
class MasonryDimensions<ItemT extends GenericItemT = GenericItemT>
  implements DimensionsModelContainer<ItemT>
{
  readonly id: string;
  private _dataModel: MasonryDimensionsModel<ItemT>;
  public _scrollMetrics?: ScrollMetrics;
  public stateListener?: MasonryStateListener<ItemT>;
  private _dispatchMetricsBatchinator: Batchinator;
  readonly onEndReachedHelper: OnEndReachedHelper;

  constructor(props: MasonryDimensionsProps<ItemT>) {
    const {
      onEndReached,
      stateListener,
      persistenceIndices,
      initialNumToRender,
      onEndReachedThreshold,
      onEndReachedTimeoutThreshold,
      distanceFromEndThresholdValue,
      onEndReachedHandlerTimeoutThreshold,
      maxCountOfHandleOnEndReachedAfterStillness,
    } = props;

    this.id = `__masonry_${count++}__`;
    this.stateListener = stateListener;

    this.onEndReachedHelper = new OnEndReachedHelper({
      id: this.id,
      onEndReached,
      onEndReachedThreshold,
      onEndReachedTimeoutThreshold,
      distanceFromEndThresholdValue,
      onEndReachedHandlerTimeoutThreshold,
      maxCountOfHandleOnEndReachedAfterStillness,
    });

    const { dispatchMetricsThreshold = DISPATCH_METRICS_THRESHOLD } = props;

    this._dispatchMetricsBatchinator = new Batchinator(
      this.dispatchMetrics.bind(this),
      dispatchMetricsThreshold
    );

    this._dataModel = new MasonryDimensionsModel({
      column: DEFAULT_MASONRY_COLUMN,
      persistenceIndices,

      container: this,
      recycleEnabled: true,
      manuallyApplyInitialData: true,
      // @ts-ignore [TODO]
      onListDimensionsModelDataChanged:
        this.onListDimensionsModelDataChanged.bind(this),
      ...props,

      initialNumToRender: 0,
    });
  }

  getDataModel() {
    return this._dataModel;
  }

  /**
   * required, to receive item layout from rendering
   * TODO: pay attention !!! on update item layout, the columnInterval tree
   * layout should be updated as well
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
    // return this._dataModel.setKeyItemLayout(
    //   itemKey,
    //   layout,
    //   updateIntervalTree
    // );
  }

  /**
   *
   * @param data revoked on source data changed
   */
  setData(data: ItemT[]) {
    this._dataModel.setData(data);
  }

  onListDimensionsModelDataChanged(props: {
    dataModel: ListDimensionsModel<ItemT>;
    dataChangedType: KeysChangedType;
    data: ItemT[];
    oldData: ItemT[];
  }) {
    const { dataChangedType, data, oldData, dataModel } = props;
    const nextDataModel = dataModel as MasonryDimensionsModel<ItemT>;

    const chunks = chunkifyDataSource<ItemT>({
      data,
      oldData,
      dataChangedType,
      masonryDataModel: nextDataModel,
    });
    nextDataModel.setDataSource(chunks);
  }

  // triggered due to item layout change...
  onItemLayoutChanged() {
    this._dispatchMetricsBatchinator.schedule();
  }

  onDataSourceChanged() {
    this._dispatchMetricsBatchinator.schedule();
  }

  /**
   *
   * @param key
   * @returns
   *
   * TODO: should return valid info, or will cause recycler return empty
   */
  getFinalKeyIndexInfo(key: string): MasonryIndexInfo<ItemT> {
    const indexInTotal = this._dataModel.getKeyIndex(key);
    const columnIndex = this._dataModel.getKeyColumnIndex(key);
    const index = this._dataModel.getKeyIndexInColumn(key);
    return {
      dimensions: this as any,
      columnIndex,
      indexInTotal,
      index,
    };
  }

  onColumnDataChange() {
    this._dispatchMetricsBatchinator.schedule();
  }

  // TODO:
  dispatchMetrics(
    scrollMetrics: ScrollMetrics | undefined = this._scrollMetrics
  ) {
    if (!scrollMetrics) return;

    if (typeof this.stateListener === 'function') {
      const stateResults = this._dataModel.getStrategies().map((strategy) => {
        const stateResult = strategy.dispatchMetrics(scrollMetrics);
        return stateResult;
      });
      this.stateListener(stateResults);
    }
  }

  addStateListener(listener: MasonryStateListener<ItemT>) {
    if (typeof listener === 'function') this.stateListener = listener;
    return () => {
      if (typeof listener === 'function') this.stateListener = undefined;
    };
  }

  setScrollMetrics(scrollMetrics: ScrollMetrics) {
    this._scrollMetrics = scrollMetrics;
    // if (!this._scrollMetrics && scrollMetrics) {
    //   this.attemptToHandleEndReached();
    // }
  }

  dispatchScrollMetricsEnabled() {
    return true;
    // return (
    //   this.selector.getDispatchScrollMetricsEnabledStatus() &&
    //   ListSpyUtils.selector.getDispatchScrollMetricsEnabledStatus()
    // );
  }

  _updateScrollMetrics(
    _scrollMetrics?: ScrollMetrics,
    _options?: {
      useCache?: boolean;
      flush?: boolean;
    }
  ) {
    const scrollMetrics = _scrollMetrics || this._scrollMetrics;
    const flush = defaultBooleanValue(_options?.flush, false);

    if (!scrollMetrics) return;
    if (!this.dispatchScrollMetricsEnabled()) {
      this.setScrollMetrics(scrollMetrics);
      return;
    }

    this.setScrollMetrics(scrollMetrics);

    if (flush) {
      this._dispatchMetricsBatchinator.flush(scrollMetrics);
    } else {
      this._dispatchMetricsBatchinator.schedule(scrollMetrics);
    }

    return;
  }

  /**
   *
   * @param _scrollMetrics
   * @param _options
   *
   * trigger children MasonryDimensionStrategy should run on same pace;
   */
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

export default MasonryDimensions;
