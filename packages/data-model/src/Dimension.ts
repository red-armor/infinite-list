import ItemMeta from './ItemMeta';
import ListGroupDimensions from './ListGroupDimensions';
import { INVALID_LENGTH, layoutEqual } from './common';
import SelectValue, {
  selectHorizontalValue,
  selectVerticalValue,
} from '@x-oasis/select-value';
import { DimensionProps, IndexInfo, ItemLayout } from './types';

class Dimension {
  public id: string;
  private _layout: ItemLayout;
  private _meta: ItemMeta;
  readonly _selectValue: SelectValue;
  readonly _listGroupDimension: ListGroupDimensions;
  readonly _initialStartIndex: number;
  readonly _ignoredToPerBatch: boolean;
  private _offsetInListGroup: number;
  private _requireRendered: boolean;
  private _onRender: Function;

  constructor(props: DimensionProps) {
    const {
      horizontal,
      id,
      onRender,
      listGroupDimension,
      initialStartIndex,
      ignoredToPerBatch,
    } = props;
    this._selectValue = horizontal
      ? selectHorizontalValue
      : selectVerticalValue;
    this.id = id;
    this._listGroupDimension = listGroupDimension;
    this._initialStartIndex = initialStartIndex;
    this._ignoredToPerBatch = !!ignoredToPerBatch;
    this._meta = new ItemMeta({
      key: this.id,
      isListItem: false,
      owner: this,
    });
    this.resolveConfigTuplesDefaultState =
      this.resolveConfigTuplesDefaultState.bind(this);
    this._requireRendered =
      this._initialStartIndex <= this._listGroupDimension.initialNumToRender;
    this._onRender = onRender;
  }

  get length() {
    return 1;
  }

  render() {
    if (this._requireRendered) return;
    if (typeof this._onRender === 'function') this._onRender();
  }

  onRequireRender(onRender: Function) {
    if (typeof onRender === 'function') this._onRender = onRender;
  }

  getRequireRendered() {
    return this._requireRendered;
  }

  getReflowItemsLength() {
    const meta = this.getMeta();
    const layout = meta.getLayout();
    return layout ? 1 : 0;
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

  getContainerOffset() {
    return (
      this._listGroupDimension.getContainerOffset() + this._offsetInListGroup
    );
  }

  getItemOffset() {
    return this.getContainerOffset();
  }

  getKey() {
    return this.id;
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
      let length = layout;
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
      let length = this._selectValue.selectLength(layout as ItemLayout);
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
    });
    return this._meta;
  }

  getSelectValue() {
    return this._selectValue;
  }
}

export default Dimension;
