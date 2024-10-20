import Batchinator from '@x-oasis/batchinator';
import defaultBooleanValue from '@x-oasis/default-boolean-value';

import {
  isEmpty,
  DISPATCH_METRICS_THRESHOLD,
  ON_END_REACHED_THRESHOLD,
  STILLNESS_THRESHOLD,
} from '../common';
import {
  ListBaseDimensionsProps,
  OnEndReached,
  ScrollMetrics,
  ItemLayout,
  StateListener,
  ListBaseDimensionsStore,
  GenericItemT,
  IndexInfo,
  IndexToOffsetMap,
} from '../types';
import ListSpyUtils from '../utils/ListSpyUtils';
import OnEndReachedHelper from '../viewable/OnEndReachedHelper';
import EnabledSelector from '../utils/EnabledSelector';
import StillnessHelper from '../utils/StillnessHelper';
import ViewabilityConfigTuples from '../viewable/ViewabilityConfigTuples';
import ItemMeta from '../ItemMeta';
import BaseLayout from '../BaseLayout';
import StateHub from './StateHub';
import { ReducerResult } from '../state/types';

/**
 * item should be first class data model; item's value reference change will
 * cause recalculation of item key. However, if key is not changed, its itemMeta
 * will not change.
 */
abstract class BaseImpl<
  ItemT extends GenericItemT = GenericItemT
> extends BaseLayout {
  private _dispatchMetricsBatchinator: Batchinator;

  private _onEndReachedThreshold: number;

  private _stateHub: StateHub<ItemT>;

  private _store: ListBaseDimensionsStore<ReducerResult>;

  readonly onEndReachedHelper: OnEndReachedHelper;

  public _scrollMetrics?: ScrollMetrics;

  private _selector = new EnabledSelector({
    onEnabled: this.onEnableDispatchScrollMetrics.bind(this),
  });

  private _stillnessHelper: StillnessHelper;

  _configTuple: ViewabilityConfigTuples<ItemT>;

  constructor(props: ListBaseDimensionsProps) {
    super(props);
    const {
      store,

      viewabilityConfig,
      onViewableItemsChanged,
      viewabilityConfigCallbackPairs,

      dispatchMetricsThreshold = DISPATCH_METRICS_THRESHOLD,

      stillnessThreshold = STILLNESS_THRESHOLD,

      onEndReached,
      onEndReachedThreshold = ON_END_REACHED_THRESHOLD,
      onEndReachedTimeoutThreshold,
      distanceFromEndThresholdValue,
      onEndReachedHandlerTimeoutThreshold,

      maxCountOfHandleOnEndReachedAfterStillness,
    } = props;
    this._store = store;
    this._stateHub = new StateHub<ItemT>({
      listContainer: this,
      recyclerTypes: props.recyclerTypes,
      // recycleEnabled,
      onRecyclerProcess: props.onRecyclerProcess,
      recyclerBufferSize: props.recyclerBufferSize,
      recyclerReservedBufferPerBatch: props.recyclerReservedBufferPerBatch,
    });

    this._onEndReachedThreshold = onEndReachedThreshold;
    this.stillnessHandler = this.stillnessHandler.bind(this);

    this.onEndReachedHelper = new OnEndReachedHelper({
      id: this.id,
      onEndReached,
      onEndReachedThreshold,
      onEndReachedTimeoutThreshold,
      distanceFromEndThresholdValue,
      onEndReachedHandlerTimeoutThreshold,
      maxCountOfHandleOnEndReachedAfterStillness,
    });

    this._configTuple = new ViewabilityConfigTuples<ItemT>({
      viewabilityConfig,
      onViewableItemsChanged,
      viewabilityConfigCallbackPairs,
      isListItem: true,
    });

    this._stillnessHelper = new StillnessHelper({
      stillnessThreshold,
      handler: this.stillnessHandler,
    });

    this._dispatchMetricsBatchinator = new Batchinator(
      this.dispatchMetrics.bind(this),
      dispatchMetricsThreshold
    );
  }

  get length() {
    return this._data.length;
  }

  get store() {
    return this._store;
  }

  get selector() {
    return this._selector;
  }

  get onEndReachedThreshold() {
    return this.onEndReachedHelper?.onEndReachedThreshold;
  }

  setScrollMetrics(scrollMetrics: ScrollMetrics) {
    this._scrollMetrics = scrollMetrics;
    if (!this._scrollMetrics && scrollMetrics) {
      this.attemptToHandleEndReached();
    }
  }

  get state() {
    return this.store.getState();
  }

  getState() {
    return this.state;
  }

  addOnEndReached(onEndReached: OnEndReached) {
    return this.onEndReachedHelper?.addHandler(onEndReached);
  }

  removeOnEndReached(onEndReached: OnEndReached) {
    this.onEndReachedHelper?.removeHandler(onEndReached);
  }

  addBuffer(type: string) {
    this._stateHub.addBuffer(type);
  }

  getOnEndReachedHelper() {
    return this.onEndReachedHelper;
  }

  /**
   *
   * @returns TODO: temp
   */
  // abstract getContainerOffset(): number

  get _data() {
    return this.getData();
  }

  abstract getData(): any[];
  abstract getDataLength(): number;
  abstract getTotalLength(): number | string;
  abstract getReflowItemsLength(): number;
  abstract getFinalItemKey(item: any): string;
  abstract getFinalIndexItemMeta(
    index: number
  ): ItemMeta<ItemT> | null | undefined;
  abstract getFinalItemMeta(item: any): ItemMeta<ItemT> | null | undefined;
  abstract getFinalIndexItemLength(index: number): number;
  abstract getFinalIndexKeyOffset(index: number, exclusive?: boolean): number;
  abstract getFinalIndexKeyBottomOffset(index: number): number;
  abstract setFinalKeyItemLayout(
    key: string,
    info: ItemLayout | number,
    updateIntervalTree?: boolean
  ): boolean;
  /**
   *
   * @param startIndex
   * @param endIndex
   * @param exclusive
   *
   * on calculate offset, the startIndex offset is get directly from intervalTree.
   * However its consecutive item's offset should make by its itemMeta.isApproximateLayout
   *
   * if itemMeta.isApproximateLayout is true, then its offset should be
   * `itemOffsetBeforeLayoutReady` and its length should not be included in
   * consecutive item's offset sum value
   *
   */
  abstract getFinalIndexRangeOffsetMap(
    startIndex: number,
    endIndex: number,
    exclusive?: boolean
  ): IndexToOffsetMap;
  abstract computeIndexRange(
    minOffset: number,
    maxOffset: number
  ): {
    startIndex: number;
    endIndex: number;
  };
  abstract getFinalKeyIndexInfo(
    itemKey: string,
    groupId?: string
  ): IndexInfo<ItemT> | null;
  abstract onDataSourceChanged(): void;
  abstract onItemLayoutChanged(): void;

  hasUnLayoutItems() {
    return this.getReflowItemsLength() < this._data.length;
  }

  /**
   * trigger on set scrollMetics with valid value
   */
  attemptToHandleEndReached() {
    this.onEndReachedHelper?.attemptToHandleOnEndReachedBatchinator.schedule();
  }

  resetViewableItems() {
    if (this._scrollMetrics) this.dispatchMetrics(this._scrollMetrics);
  }

  getConfigTuple() {
    return this._configTuple;
  }

  resolveConfigTuplesDefaultState(defaultValue?: boolean) {
    return this._configTuple.getDefaultState(defaultValue);
  }

  addStateListener(listener: StateListener<ItemT>) {
    this._stateHub.addStateListener(listener);

    // if (typeof listener === 'function') this.stateListener = listener;
    // return () => {
    //   if (typeof listener === 'function') this.stateListener = undefined;
    // };
  }

  dispatchStoreMetrics(scrollMetrics: ScrollMetrics) {
    const state = this._store.dispatchMetrics({
      // @ts-ignore
      dimension: this,
      scrollMetrics,
    });

    if (isEmpty(state)) return state;
    this._stateHub.setState({ ...state });

    return state;
  }

  dispatchMetrics(scrollMetrics: ScrollMetrics | undefined) {
    if (!scrollMetrics) return;
    const state = this.dispatchStoreMetrics(scrollMetrics);

    const { isEndReached, distanceFromEnd } = state;

    this.onEndReachedHelper?.performEndReached({
      isEndReached,
      distanceFromEnd,
    });
  }

  dispatchScrollMetricsEnabled() {
    return (
      this.selector.getDispatchScrollMetricsEnabledStatus() &&
      ListSpyUtils.selector.getDispatchScrollMetricsEnabledStatus()
    );
  }

  onEnableDispatchScrollMetrics() {
    this.dispatchMetrics(this._scrollMetrics);
  }

  stillnessHandler() {
    this.dispatchMetrics(this._scrollMetrics);
  }

  isStill() {
    return this._stillnessHelper.isStill;
  }

  getStateResult() {
    return this.stateResult;
  }

  get stateResult() {
    return this._stateHub.stateResult;
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
}

export default BaseImpl;
