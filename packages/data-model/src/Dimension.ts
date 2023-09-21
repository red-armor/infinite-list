import ItemMeta from './ItemMeta';
import ListGroupDimensions from './ListGroupDimensions';
import { INVALID_LENGTH } from './common';
import layoutEqual from '@x-oasis/layout-equal';
import SelectValue, {
  selectHorizontalValue,
  selectVerticalValue,
} from '@x-oasis/select-value';
import { DimensionProps, IndexInfo, ItemLayout } from './types';

/**
 * Abstraction of singleton item, It is used in ListGroup Condition.
 */
class Dimension {
  public id: string;
  private _layout: ItemLayout;
  private _meta: ItemMeta;
  readonly _selectValue: SelectValue;
  readonly _listGroupDimension: ListGroupDimensions;
  readonly _initialStartIndex: number;
  readonly _ignoredToPerBatch: boolean;
  private _offsetInListGroup: number;
  private _canIUseRIC: boolean;
  private _data: Array<any>;
  private _recyclerType: string;

  constructor(props: DimensionProps) {
    const {
      horizontal,
      id,
      recyclerType,
      canIUseRIC,
      listGroupDimension,
      initialStartIndex,
      ignoredToPerBatch,
    } = props;

    this._data = [
      {
        key: id,
      },
    ];
    this._recyclerType = recyclerType;

    this._selectValue = horizontal
      ? selectHorizontalValue
      : selectVerticalValue;
    this.id = id;
    this._listGroupDimension = listGroupDimension;
    this._initialStartIndex = initialStartIndex;
    this._ignoredToPerBatch = !!ignoredToPerBatch;
    this._canIUseRIC = canIUseRIC;
    this._meta = new ItemMeta({
      key: this.id,
      isListItem: false,
      owner: this,
      recyclerType: this._recyclerType,
      canIUseRIC: this._canIUseRIC,
      ignoredToPerBatch: this._ignoredToPerBatch,
    });
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

  hasKey(key: string) {
    return this.id === key;
  }

  getReflowItemsLength() {
    const meta = this.getMeta();
    const layout = meta.getLayout();
    return layout ? 1 : 0;
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
    return this._listGroupDimension.resolveConfigTuplesDefaultState();
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
    if (this._listGroupDimension) {
      const index = this._listGroupDimension.getDimensionStartIndex(this.id);
      if (index !== -1) info.indexInGroup = index;
    }

    return info;
  }

  /**
   *
   * @param layout container layout
   */
  setLayout(layout: ItemLayout) {
    this._layout = layout;
  }

  /**
   *
   * @returns get list dimensions' container layout
   */
  getLayout() {
    return this._layout;
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

  restart() {}

  setItemLayout(layout: ItemLayout | number, updateIntervalTree?: boolean) {
    const meta = this.getMeta();
    const _update =
      typeof updateIntervalTree === 'boolean' ? updateIntervalTree : true;
    // const finalIndex = this._listGroupDimension.getDimensionStartIndex(this.id);

    if (typeof layout === 'number') {
      const length = layout;
      if (this._selectValue.selectLength(meta.getLayout() || {}) !== length) {
        this._selectValue.setLength(meta.ensureLayout(), length);

        if (_update) {
          if (this._listGroupDimension) {
            this._listGroupDimension.recalculateDimensionsIntervalTreeBatchinator.schedule();
          }
          return true;
        }
      }
    }

    if (!layoutEqual(meta.getLayout(), layout as ItemLayout)) {
      meta.setLayout(layout as ItemLayout);
      const length = this._selectValue.selectLength(layout as ItemLayout);
      if (_update) {
        if (this._listGroupDimension) {
          this._listGroupDimension.recalculateDimensionsIntervalTreeBatchinator.schedule();
        }
        return true;
      }
    }

    return false;
  }

  ensureKeyMeta() {
    if (this._meta) return this._meta;
    this._meta = new ItemMeta({
      key: this.id,
      owner: this,
      recyclerType: this._recyclerType,
      canIUseRIC: this._canIUseRIC,
    });
    return this._meta;
  }

  getSelectValue() {
    return this._selectValue;
  }
}

export default Dimension;
