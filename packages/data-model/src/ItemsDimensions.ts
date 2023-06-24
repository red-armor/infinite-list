import Batchinator from '@x-oasis/batchinator';
import layoutEqual from '@x-oasis/layout-equal';
import BaseDimensions from './BaseDimensions';
import ItemMeta from './ItemMeta';
import SortedItems from './SortedItems';

import {
  IndexInfo,
  ItemLayout,
  ItemsDimensionsProps,
  ScrollMetrics,
} from './types';
import ListSpyUtils from './utils/ListSpyUtils';

class ItemsDimensions extends BaseDimensions {
  private _sortedItems: SortedItems;
  private _scrollMetrics: ScrollMetrics;
  private _dispatchMetricsBatchinator: Batchinator;
  private _onUpdateItemsMetaChangeBatchinator: Batchinator;

  constructor(props: ItemsDimensionsProps) {
    super(props);

    this._sortedItems = new SortedItems({ selectValue: this._selectValue });
    this._dispatchMetricsBatchinator = new Batchinator(
      this.dispatchMetrics.bind(this),
      100
    );
    this._onUpdateItemsMetaChangeBatchinator = new Batchinator(
      this.onUpdateItemsMetaChange.bind(this),
      100
    );
  }

  _setKeyItemLayout(key: string, info: ItemLayout | number) {
    const meta = this.getKeyMeta(key);
    if (!meta) return false;

    if (typeof info === 'number') {
      const length = this.normalizeLengthNumber(info);
      if (this._selectValue.selectLength(meta.getLayout()) !== length) {
        this._selectValue.setLength(meta.getLayout(), length);
        this._sortedItems.add(meta);
        return true;
      }
      return false;
    }

    const _info = this.normalizeLengthInfo(info);

    if (!layoutEqual(meta.getLayout(), _info as ItemLayout)) {
      meta.setLayout(_info as ItemLayout);
      this._sortedItems.add(meta);
      return true;
    }

    return false;
  }

  ensureKeyMeta(key: string) {
    const meta = this.getKeyMeta(key);
    if (!meta) {
      this.setKeyMeta(
        key,
        new ItemMeta({
          key,
          owner: this,
          canIUseRIC: this.canIUseRIC,
        })
      );
    }

    return this.getKeyMeta(key);
  }

  getIndexInfo(): IndexInfo {
    return {
      index: -1,
    };
  }

  computeIndexRangeMeta(minOffset: number, maxOffset: number) {
    const headValues = this._sortedItems.getHeadValues({
      minOffset,
      maxOffset,
    });
    const tailValues = this._sortedItems.getTailValues({
      minOffset,
      maxOffset,
    });

    const values = [];

    const mergedValues = [].concat(headValues, tailValues);
    mergedValues.forEach((value) => {
      const index = values.indexOf(value);
      if (index === -1) values.push(value);
    });
    return values;
  }

  dispatchMetrics(scrollMetrics: ScrollMetrics) {
    const { offset: scrollOffset, visibleLength } = scrollMetrics;
    const minOffset = scrollOffset;
    const maxOffset = scrollOffset + visibleLength;

    const itemsMeta = this.computeIndexRangeMeta(minOffset, maxOffset);

    this._onUpdateItemsMetaChangeBatchinator.schedule(itemsMeta, scrollMetrics);
  }

  updateScrollMetrics(scrollMetrics: ScrollMetrics = this._scrollMetrics) {
    if (!scrollMetrics) return;
    if (
      !this._scrollMetrics ||
      scrollMetrics.contentLength !== this._scrollMetrics.contentLength ||
      scrollMetrics.offset !== this._scrollMetrics.offset ||
      scrollMetrics.visibleLength !== this._scrollMetrics.visibleLength
    ) {
      this._scrollMetrics = scrollMetrics;
      if (ListSpyUtils.selector.getDispatchScrollMetricsEnabledStatus()) {
        this._dispatchMetricsBatchinator.schedule(scrollMetrics);
      }
    }

    this._scrollMetrics = scrollMetrics;
  }
}

export default ItemsDimensions;
