import BaseLayout from './BaseLayout';
import ItemMeta from './ItemMeta';
import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';
import ViewabilityConfigTuples from './viewable/ViewabilityConfigTuples';
import {
  BaseDimensionsProps,
  BoundInfo,
  BoundInfoType,
  ItemLayout,
  KeysChangedType,
  ScrollMetrics,
} from './deprecate/types';

abstract class BaseDimensions extends BaseLayout {
  _keyToIndexMap: Map<string, number> = new Map();
  _indexKeys: Array<string> = [];
  _keyToMetaMap: Map<string, ItemMeta> = new Map();
  _configTuple: ViewabilityConfigTuples;

  _onUpdateItemLayout?: Function;
  _onUpdateIntervalTree?: Function;

  private _intervalTree: PrefixIntervalTree;

  constructor(props: BaseDimensionsProps) {
    super(props);
    const {
      onUpdateItemLayout,
      onUpdateIntervalTree,
      viewabilityConfig,
      onViewableItemsChanged,
      isIntervalTreeItems,
      viewabilityConfigCallbackPairs,
    } = props;

    this._onUpdateIntervalTree = onUpdateIntervalTree;
    this._onUpdateItemLayout = onUpdateItemLayout;
    this._intervalTree = this.createIntervalTree();
    this._configTuple = new ViewabilityConfigTuples({
      viewabilityConfig,
      onViewableItemsChanged,
      isListItem: isIntervalTreeItems,
      viewabilityConfigCallbackPairs,
    });
  }

  get intervalTree() {
    return this._intervalTree;
  }

  set intervalTree(intervalTree: PrefixIntervalTree) {
    this._intervalTree = intervalTree;
  }

  getKeyIndex(key: string) {
    const index = this._keyToIndexMap.get(key);
    if (index >= 0) return index;
    return -1;
  }

  getIndexKey(index: number) {
    return this._indexKeys[index];
  }

  getIndexKeyOffset(index: number, exclusive?: boolean) {
    const listOffset = exclusive ? 0 : this.getContainerOffset();

    if (typeof index === 'number') {
      return (
        listOffset +
        (index >= this._intervalTree.getMaxUsefulLength()
          ? this.intervalTree.getHeap()[1]
          : this._intervalTree.sumUntil(index))
      );
    }
    return 0;
  }

  /**
   *
   * @param key instance's key
   * @param exclusive default as false, if value is true, container offset
   *                  will not be included on calculating item offset.
   * @returns
   */
  getKeyItemOffset(key: string, exclusive?: boolean) {
    const index = this.getKeyIndex(key);
    return this.getIndexKeyOffset(index, exclusive);
  }

  createIntervalTree() {
    const options = {} as {
      onUpdateItemLayout?: Function;
      onUpdateIntervalTree?: Function;
    };
    if (typeof this._onUpdateItemLayout === 'function')
      options.onUpdateItemLayout = this._onUpdateItemLayout;
    if (typeof this._onUpdateIntervalTree === 'function')
      options.onUpdateIntervalTree = this._onUpdateIntervalTree;
    return new PrefixIntervalTree(100, options);
  }

  resetIntervalTree() {
    this._intervalTree = this.createIntervalTree();
    return this._intervalTree;
  }

  setIntervalTreeValue(index: number, length: number) {
    this._intervalTree.set(index, length);
  }

  _getKeyMeta(key: string) {
    return this._keyToMetaMap.get(key);
  }

  getFinalKeyMeta(key: string) {
    return this.getKeyMeta(key);
  }

  getKeyMeta(key: string) {
    return this._getKeyMeta(key);
  }

  _setKeyMeta(key: string, meta: ItemMeta) {
    return this._keyToMetaMap.set(key, meta);
  }

  setKeyMeta(key: string, meta: ItemMeta) {
    return this._setKeyMeta(key, meta);
  }

  resolveKeysChangedType(
    keys: Array<string>,
    equal?: (index: number) => boolean
  ) {
    const oldLen = this._indexKeys.length;
    const newLen = keys.length;

    if (!oldLen && newLen) return KeysChangedType.Initial;

    if (oldLen > newLen) return KeysChangedType.Remove;
    for (let index = 0; index < oldLen; index++) {
      const currentKey = this._indexKeys[index];
      const nextKey = keys[index];

      if (currentKey !== nextKey || !equal(index)) {
        if (oldLen === newLen) return KeysChangedType.Reorder;
        return KeysChangedType.Add;
      }
    }

    if (oldLen === newLen) return KeysChangedType.Equal;
    return KeysChangedType.Append;
  }

  getKeyItemLayout(key: string): ItemLayout {
    const meta = this.getKeyMeta(key);
    if (meta) {
      return meta.getLayout();
    }
    return null;
  }

  getIndexItemLayout(index: number) {
    const key = this.getIndexKey(index);
    return this.getKeyItemLayout(key);
  }

  getKeyItemLength(key: string) {
    const layout = this.getKeyItemLayout(key);
    return this._selectValue.selectLength(layout);
  }

  getIndexItemLength(index: number) {
    const key = this.getIndexKey(index);
    return this.getKeyItemLength(key);
  }

  setKeyItemLayout(
    key: string,
    layout: ItemLayout | number,
    updateIntervalTree?: boolean
  ) {
    return this._setKeyItemLayout(key, layout, updateIntervalTree);
  }

  setFinalKeyItemLayout(
    key: string,
    layout: ItemLayout | number,
    updateIntervalTree?: boolean
  ) {
    return this._setKeyItemLayout(key, layout, updateIntervalTree);
  }

  setIndexItemLayout(
    index: number,
    layout: ItemLayout,
    updateIntervalTree?: boolean
  ) {
    const key = this.getIndexKey(index);
    return this._setKeyItemLayout(key, layout, updateIntervalTree);
  }

  setKeyItemLength(key: string, length, updateIntervalTree?: boolean) {
    this._setKeyItemLayout(key, length, updateIntervalTree);
  }

  setIndexItemLength(
    index: number,
    length: number,
    updateIntervalTree?: boolean
  ) {
    const key = this.getIndexKey(index);
    this._setKeyItemLayout(key, length, updateIntervalTree);
  }

  /**
   *
   * @param key string, item key to find which one should be update
   * @param info ItemLayout | number, if info is ItemLayout, then update meta.layout,
   *             or update length value of meta.layout
   * @param updateIntervalTree boolean; default as true
   */
  abstract _setKeyItemLayout(
    key: string,
    info: ItemLayout | number,
    updateIntervalTree?: boolean
  ): boolean;

  // abstract computeIndexRangeMeta(
  //   minOffset: number,
  //   maxOffset: number
  // ): Array<ItemMeta>;

  greatestLowerBoundInfo(offset: number, exclusive?: boolean) {
    const info: BoundInfo = {
      type: BoundInfoType.OutOfBoundary,
      index: -1,
    };
    const listOffset = exclusive
      ? 0
      : this._selectValue.selectOffset(this.getContainerLayout());
    if (offset < listOffset) return info;
    const maxValue = this._intervalTree.getMaxValue();
    if (offset > listOffset + maxValue) {
      info.index = -2;
      return info;
    }
    const index = this._intervalTree.greatestLowerBound(offset - listOffset);
    info.index = index;
    info.type = BoundInfoType.Hover;

    return info;
  }

  getConfigTuple() {
    return this._configTuple;
  }

  resolveConfigTuplesDefaultState(defaultValue?: boolean) {
    return this._configTuple.getDefaultState(defaultValue);
  }

  onUpdateItemsMetaChange(
    itemsMeta: Array<ItemMeta>,
    scrollMetrics: ScrollMetrics
  ) {
    this._configTuple.getViewabilityHelpers().forEach((helper) => {
      helper.onUpdateItemsMeta(itemsMeta, scrollMetrics);
    });
  }
}

export default BaseDimensions;
