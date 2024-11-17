import defaultBooleanValue from '@x-oasis/default-boolean-value';
import {
  GenericItemT,
  MasonryDimensionsProps,
  MasonryStateListener,
  ScrollMetrics,
} from '../types';
import MasonryDimensionsModel from './MasonryDimensionsModel';
import MasonryDimensionStrategy from './MasonryDimensionStrategy';
import Batchinator from '@x-oasis/batchinator';
import { DISPATCH_METRICS_THRESHOLD } from '../common';

const DEFAULT_MASONRY_COLUMN = 2;

class MasonryDimensions<ItemT extends GenericItemT = GenericItemT> {
  private _dataModel: MasonryDimensionsModel<ItemT>;
  private _strategies: MasonryDimensionStrategy<ItemT>[];
  public _scrollMetrics?: ScrollMetrics;
  public stateListener?: MasonryStateListener<ItemT>;
  private _dispatchMetricsBatchinator: Batchinator;

  constructor(props: MasonryDimensionsProps<ItemT>) {
    this._dataModel = new MasonryDimensionsModel({
      column: DEFAULT_MASONRY_COLUMN,
      ...props,
    });

    const { dispatchMetricsThreshold = DISPATCH_METRICS_THRESHOLD } = props;

    this._strategies = Array.from(
      { length: this._dataModel.getColumn() },
      (_, i) => i
    ).map(
      (columnIndex) =>
        new MasonryDimensionStrategy({
          columnIndex,
          dataModel: this._dataModel,
          ...props,
        })
    );

    this._dispatchMetricsBatchinator = new Batchinator(
      this.dispatchMetrics.bind(this),
      dispatchMetricsThreshold
    );
  }

  dispatchMetrics(scrollMetrics: ScrollMetrics | undefined) {
    if (!scrollMetrics) return;
    if (typeof this.stateListener === 'function') {
      const stateResults = this._strategies.map((strategy) =>
        strategy.dispatchMetrics({
          // @ts-ignore
          dimension: this,
          scrollMetrics,
        })
      );
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
