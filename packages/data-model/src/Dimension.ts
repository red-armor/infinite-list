import defaultBooleanValue from '@x-oasis/default-boolean-value';
import isObject from '@x-oasis/is-object';
import ItemMeta from './ItemMeta';
import ListGroupDimensions from './ListGroupDimensions';
import {
  INVALID_LENGTH,
  DEFAULT_DIMENSION_ITEM_APPROXIMATE_LENGTH,
  DEFAULT_RECYCLER_TYPE,
} from './common';
import layoutEqual from '@x-oasis/layout-equal';
import {
  DimensionProps,
  IndexInfo,
  ItemLayout,
  GetDimensionLength,
} from './types';
import BaseContainer from './BaseContainer';

/**
 * Abstraction of singleton item, It is used in ListGroup Condition.
 */
class Dimension extends BaseContainer {
  private _meta: ItemMeta;
  readonly _container: ListGroupDimensions;
  readonly _ignoredToPerBatch: boolean;
  private _offsetInListGroup = 0;
  private _data: Array<any>;
  private _recyclerType: string;
  private _anchorKey: string;
  private _itemApproximateLength: number;
  private _approximateMode: boolean;
  private _getItemLength?: GetDimensionLength;
  private _isFixedLength: boolean;

  constructor(props: DimensionProps) {
    super(props);
    const {
      id,
      recyclerType = DEFAULT_RECYCLER_TYPE,
      container,
      ignoredToPerBatch,
      anchorKey,
      getItemLength,
      isFixedLength = true,
      recycleEnabled,
      useItemApproximateLength,
      itemApproximateLength = DEFAULT_DIMENSION_ITEM_APPROXIMATE_LENGTH,
    } = props;

    this._data = [
      {
        key: id,
      },
    ];
    this._recyclerType = recyclerType;
    this._anchorKey = anchorKey || id;
    this._container = container;
    this._getItemLength = getItemLength;
    this._ignoredToPerBatch = !!ignoredToPerBatch;
    this._approximateMode = recycleEnabled
      ? defaultBooleanValue(
          useItemApproximateLength,
          typeof this._getItemLength !== 'function'
        )
      : false;
    this._itemApproximateLength = itemApproximateLength;
    this._isFixedLength = isFixedLength;

    this._meta = this.createItemMeta();
    this.resolveConfigTuplesDefaultState =
      this.resolveConfigTuplesDefaultState.bind(this);
  }

  getData() {
    return this._data;
  }

  get length() {
    return 1;
  }

  get recyclerType() {
    return this._recyclerType;
  }

  get anchorKey() {
    return this._anchorKey;
  }

  hasKey(key: string) {
    return this.id === key;
  }

  getReflowItemsLength() {
    const meta = this.getMeta();
    const layout = meta.getLayout();
    return layout ? 1 : 0;
  }

  createItemMeta() {
    const meta = ItemMeta.spawn({
      key: this.id,
      isListItem: false,
      owner: this,
      recyclerType: this._recyclerType,
      canIUseRIC: this.canIUseRIC,
      ignoredToPerBatch: this._ignoredToPerBatch,
    });

    if (typeof this._getItemLength === 'function') {
      const length = this._getItemLength();
      // only List with getItemLayout has default layout value
      meta.setLayout({ x: 0, y: 0, height: 0, width: 0 });
      this._selectValue.setLength(meta.getLayout(), length);
      if (this._isFixedLength) meta.isApproximateLayout = false;
      this.triggerOwnerRecalculateLayout();
      return meta;
    }

    if (this._approximateMode && meta.isApproximateLayout) {
      meta.setLayout({ x: 0, y: 0, height: 0, width: 0 });
      this._selectValue.setLength(
        meta.getLayout(),
        this._itemApproximateLength
      );

      this.triggerOwnerRecalculateLayout();

      return meta;
    }

    return meta;
  }

  hasUnLayoutItems() {
    const meta = this.getMeta();
    return !!meta?.getLayout();
  }

  getTotalLength() {
    const meta = this.getMeta();
    const layout = meta.getLayout();
    return layout ? this._selectValue.selectLength(layout) : INVALID_LENGTH;
  }

  getIgnoredToPerBatch() {
    return !!this._ignoredToPerBatch;
  }

  resolveConfigTuplesDefaultState() {
    return this._container.resolveConfigTuplesDefaultState();
  }

  set offsetInListGroup(value: number) {
    this._offsetInListGroup = value;
  }

  getContainerOffset(exclusive?: boolean | number) {
    return exclusive ? 0 : this._offsetInListGroup;
  }

  getIndexKeyOffset(exclusive?: boolean | number) {
    return exclusive ? 0 : this._offsetInListGroup;
  }

  getItemOffset() {
    return this.getContainerOffset();
  }

  getKey() {
    return this.id;
  }

  getKeyIndex() {
    return 0;
  }

  getIndexInfo() {
    const info = {
      index: 0,
    } as IndexInfo;
    if (this._container) {
      const index = this._container.getDimensionStartIndex(this.id);
      if (index !== -1) info.indexInGroup = index;
    }

    return info;
  }

  getFinalItemMeta(item: any) {
    return this.getItemMeta(item);
  }

  getItemMeta(item: any) {
    if (item === this.getData()[0]) return this._meta;
    return null;
  }

  getItemKey(item: any) {
    if (item === this.getData()[0]) return this.getKey();
    return null;
  }

  getFinalItemKey(item: any) {
    return this.getItemKey(item);
  }

  getMeta() {
    return this._meta;
  }

  setMeta(meta: ItemMeta) {
    this._meta = meta;
  }

  getIndexItemMeta() {
    return this._meta;
  }

  setKeyItemLayout(
    key: string,
    layout: ItemLayout | number,
    updateIntervalTree?: boolean
  ) {
    this.setItemLayout(layout, updateIntervalTree);
  }

  triggerOwnerRecalculateLayout() {
    if (this._container) this._container.onItemLayoutChanged();
  }

  setItemLayout(layout: ItemLayout | number, updateIntervalTree?: boolean) {
    const meta = this.getMeta();
    const _update =
      typeof updateIntervalTree === 'boolean' ? updateIntervalTree : true;

    meta.isApproximateLayout = false;

    if (typeof layout === 'number') {
      const length = layout;
      if (this._selectValue.selectLength(meta.getLayout() || {}) !== length) {
        console.log('layout =====', meta.getLayout(), meta.ensureLayout());

        this._selectValue.setLength(meta.ensureLayout(), length);

        if (_update) {
          this.triggerOwnerRecalculateLayout();
          return true;
        }
      }
    }

    if (
      isObject(layout) &&
      !layoutEqual(meta.getLayout(), layout as ItemLayout)
    ) {
      meta.setLayout(layout as ItemLayout);
      if (_update) {
        this.triggerOwnerRecalculateLayout();
        return true;
      }
    }

    return false;
  }

  ensureKeyMeta() {
    if (this._meta) return this._meta;
    this._meta = this.createItemMeta();
    return this._meta;
  }

  getSelectValue() {
    return this._selectValue;
  }
}

export default Dimension;
