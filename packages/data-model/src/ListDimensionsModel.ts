import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';
import layoutEqual from '@x-oasis/layout-equal';
import defaultBooleanValue from '@x-oasis/default-boolean-value';
import BaseDimensions from './BaseDimensions';
import ItemMeta from './ItemMeta';
import {
  DEFAULT_ITEM_APPROXIMATE_LENGTH,
  DEFAULT_RECYCLER_TYPE,
  LAYOUT_EQUAL_CORRECTION_VALUE,
} from './common';

import {
  GetItemLayout,
  GetItemSeparatorLength,
  IndexInfo,
  ItemLayout,
  KeyExtractor,
  KeysChangedType,
  ListDimensionsModelProps,
  ListDimensionsModelContainer,
  FillingMode,
  GenericItemT,
} from './types';

class ListDimensionsModel<
  ItemT extends GenericItemT = GenericItemT
> extends BaseDimensions<ItemT> {
  private _data: Array<ItemT> = [];
  private _initialData: Array<ItemT> = [];

  private _keyExtractor: KeyExtractor<ItemT>;
  private _getItemLayout?: GetItemLayout<ItemT>;
  private _getItemSeparatorLength?: GetItemSeparatorLength<ItemT>;

  private _itemToKeyMap: WeakMap<ItemT, string> = new WeakMap();

  private _container: ListDimensionsModelContainer<ItemT>;
  private _offsetInListGroup: number;
  private _anchorKey: string;

  private _itemApproximateLength: number;
  private _approximateMode: boolean;
  private _recyclerType: string;
  private _isFixedLength: boolean;

  constructor(props: Omit<ListDimensionsModelProps<ItemT>, 'store'>) {
    // constructor(props: ListDimensionsModelProps<ItemT>) {
    super({
      ...props,
      isIntervalTreeItems: true,
    });
    const {
      recyclerType = DEFAULT_RECYCLER_TYPE,
      recycleEnabled,
      data = [],
      anchorKey,
      keyExtractor,
      getItemLayout,
      container,
      isFixedLength = true,
      getItemSeparatorLength,
      useItemApproximateLength,
      manuallyApplyInitialData = false,
      itemApproximateLength = DEFAULT_ITEM_APPROXIMATE_LENGTH,
    } = props;

    this._anchorKey = anchorKey || this.id;
    this._keyExtractor = keyExtractor;
    this._recyclerType = recyclerType;
    this._itemApproximateLength = itemApproximateLength || 0;
    this._getItemLayout = getItemLayout;
    this._isFixedLength = isFixedLength;

    // `_approximateMode` is enabled on default
    this._approximateMode = recycleEnabled
      ? defaultBooleanValue(
          useItemApproximateLength,
          typeof this._getItemLayout !== 'function'
        )
      : false;

    this._getItemSeparatorLength = getItemSeparatorLength;
    this._container = container;
    this._offsetInListGroup = 0;
    this._initialData = data;

    if (!manuallyApplyInitialData) {
      this.applyInitialData();
    }
  }

  get recyclerType() {
    return this._recyclerType;
  }

  get length() {
    return this._data.length;
  }

  set offsetInListGroup(offset: number) {
    this._offsetInListGroup = offset;
  }

  get anchorKey() {
    return this._anchorKey;
  }

  applyInitialData() {
    this.setData(this._initialData);
  }

  override getContainerOffset(): number {
    // 临时方案，只有当是listGroup时才会设置这个值
    if (this._offsetInListGroup) {
      return this._offsetInListGroup;
    }
    const layout = this.getContainerLayout();
    if (!layout) return 0;
    return this._selectValue.selectOffset(layout);
  }

  getData() {
    return this._data;
  }

  getTotalLength() {
    return this.intervalTree.getMaxUsefulLength()
      ? this.intervalTree.getHeap()[1]
      : // : INVALID_LENGTH;
        0;
  }

  getReflowItemsLength() {
    return this.intervalTree.getMaxUsefulLength();
  }

  getIndexItemMeta(index: number) {
    const item = this._data[index];
    return this.getItemMeta(item, index);
  }

  override getKeyMeta(key: string) {
    const meta = this._getKeyMeta(key);
    return meta;
  }

  override getFinalKeyMeta(key: string) {
    return this.getKeyMeta(key);
  }

  getFinalItemMeta(item: ItemT) {
    const key = this.getFinalItemKey(item);
    if (key) return this.getKeyMeta(key);
    return null;
  }

  getItemMeta(item: ItemT, index: number) {
    const key = this.getItemKey(item, index);
    if (key) return this.getKeyMeta(key);
    return null;
  }

  /**
   * Basically, List item meta should be created first or has some error condition
   * @param key ItemMeta key
   * @returns ItemMeta
   */
  ensureKeyMeta(key: string) {
    let meta = this.getKeyMeta(key);
    if (meta) return meta;
    const index = this.getKeyIndex(key);

    meta = this.createItemMeta(key, this.getData(), index);

    const data = this.getData();
    const len = data.length;

    if (meta.getLayout()) {
      // 最后一个不包含separatorLength
      if (index === len - 1) {
        meta.setUseSeparatorLength(true);
      } else {
        meta.setUseSeparatorLength(false);
      }

      const length = meta.getFinalItemLength();
      // const itemLength = this._selectValue.selectLength(meta.getLayout());
      // const separatorLength = meta.getSeparatorLength();

      // // 最后一个不包含separatorLength
      // const length =
      //   index === len - 1 ? itemLength : itemLength + separatorLength;
      this.intervalTree.set(index, length);
    }

    this.setKeyMeta(key, meta);

    return meta;
  }

  setItemMeta(item: ItemT, index: number, meta: ItemMeta<ItemT>) {
    const key = this.getItemKey(item, index);
    if (key) {
      this.setKeyMeta(key, meta);
    }
  }

  getItemKey(item: ItemT, index: number) {
    const cachedKey = this._itemToKeyMap.get(item);
    if (cachedKey) return cachedKey;
    if (!item) return null;
    return this._keyExtractor(item, index);
  }

  getFinalItemKey(item: ItemT) {
    const cachedKey = this._itemToKeyMap.get(item);
    if (cachedKey) return cachedKey;
    return null;
  }

  hasUnLayoutItems() {
    return this.getReflowItemsLength() < this._data.length;
  }

  // the hook method to trigger ListDimensions or ListGroupDimension recalculate
  // after item layout updated.
  triggerOwnerRecalculateLayout() {
    if (this._container) this._container.onItemLayoutChanged();
  }

  _recycleEnabled() {
    if (this.fillingMode !== FillingMode.RECYCLE) return false;
    return this.getReflowItemsLength() >= this.initialNumToRender;
  }

  // 一旦当前的length 发生了变化，判断一下自己总的高度是否变化，如果
  // 变了，那么就去更新
  /**
   * In RN, layout change will not trigger `updateScrollMetrics`, because it's replaced with
   * onContentSizeChanged.
   */
  override setIntervalTreeValue(index: number, length: number) {
    this.intervalTree.set(index, length);
    this.triggerOwnerRecalculateLayout();
  }

  applyIntervalTreeUpdate(intervalTree: PrefixIntervalTree) {
    intervalTree.applyUpdate();
    this.triggerOwnerRecalculateLayout();
  }

  // replaceIntervalTree(intervalTree: PrefixIntervalTree) {
  //   const oldLength = this.intervalTree.getHeap()[1];
  //   this.intervalTree = intervalTree;
  //   const nextLength = intervalTree.getHeap()[1];

  //   if (oldLength !== nextLength) {
  //     this.triggerOwnerRecalculateLayout();
  //   }
  // }

  createItemMeta(key: string, data: Array<ItemT>, index: number) {
    const isInitialItem = index < this.initialNumToRender;

    const meta = ItemMeta.spawn({
      key,
      owner: this,
      isListItem: true,
      isInitialItem,
      recyclerType: this._recyclerType,
      canIUseRIC: this.canIUseRIC,
    });

    if (typeof this._getItemLayout === 'function') {
      const { length } = this._getItemLayout(data, index);
      // only List with getItemLayout has default layout value
      meta.setLayout({ x: 0, y: 0, height: 0, width: 0 });
      this._selectValue.setLength(meta.getLayout()!, length);
      if (this._isFixedLength) meta.isApproximateLayout = false;
    }

    if (typeof this._getItemSeparatorLength === 'function') {
      const { length } = this._getItemSeparatorLength(data, index);
      meta.setSeparatorLength(length);
    }

    if (
      this._approximateMode &&
      meta.isApproximateLayout &&
      !meta.getLayout()
    ) {
      meta.setLayout({ x: 0, y: 0, height: 0, width: 0 });
      this._selectValue.setLength(
        meta.getLayout()!,
        this._itemApproximateLength
      );

      return meta;
    }

    return meta;
  }

  hasKey(key: string) {
    return this._indexKeys.indexOf(key) !== -1;
  }

  performKeyOperationGuard(key: string) {
    if (this._indexKeys.indexOf(key) !== -1) return true;
    return false;
  }

  /**
   * Data change will trigger `state` update for one times.
   */
  setData(data: Array<ItemT>) {
    const changedType = this._setData(data);

    if (changedType === KeysChangedType.Equal) return KeysChangedType.Equal;

    // 如果没有值，这个时候要触发一次触底
    if (!data.length && this.initialNumToRender) {
      this._container.onEndReachedHelper.attemptToHandleOnEndReachedBatchinator.schedule();
    }

    this._container.onDataSourceChanged();

    return changedType;
  }

  _setData(_data: Array<ItemT>) {
    if (_data === this._data) return KeysChangedType.Equal;
    const keyToIndexMap: Map<string, number> = new Map();
    const keyToIndexArray: Array<string> = [];
    const itemToKeyMap: WeakMap<ItemT, string> = new WeakMap();
    const itemToDimensionMap: WeakMap<
      ItemT,
      BaseDimensions<ItemT>
    > = new WeakMap();
    let duplicateKeyCount = 0;
    // TODO: optimization
    const data = _data.filter((item, index) => {
      const itemKey = this.getItemKey(item, index);
      const _index = keyToIndexArray.findIndex((key) => key === itemKey);
      if (_index === -1 && itemKey) {
        keyToIndexMap.set(itemKey, index - duplicateKeyCount);
        keyToIndexArray.push(itemKey);
        itemToKeyMap.set(item, itemKey);
        itemToDimensionMap.set(item, this);
        return true;
      }
      duplicateKeyCount += 1;

      return false;
    });

    const dataChangedType = this.resolveKeysChangedType(
      keyToIndexArray,
      (index: number) => this._data[index] === data[index]
    );

    switch (dataChangedType) {
      case KeysChangedType.Equal:
        break;
      case KeysChangedType.Append:
        this.updateTheLastItemIntervalValue();
        this.append(data);
        break;
      case KeysChangedType.Initial:
        this.append(data);
        break;
      case KeysChangedType.Add:
      case KeysChangedType.Remove:
      case KeysChangedType.Reorder:
        this.shuffle(data);
        break;
    }

    this._data = data;

    this._keyToIndexMap = keyToIndexMap;
    this._indexKeys = keyToIndexArray;
    this._itemToKeyMap = itemToKeyMap;
    return dataChangedType;
  }

  /**
   * 当追加data的时候，假如说有separator存在的话，本来最后一个的item，不再是最后一个了；
   * 这个时候其实要加上separatorLength的
   * @returns void
   */
  updateTheLastItemIntervalValue() {
    const len = this._data.length;
    const index = len - 1;
    const item = this._data[index];

    if (!item) return;

    const meta = this.getItemMeta(item, index);
    const layout = meta?.getLayout();

    if (meta && layout) {
      meta.setUseSeparatorLength(true);
      // const separatorLength = meta.getSeparatorLength();
      // const length = this._selectValue.selectLength(layout) + separatorLength;
      const length = meta.getFinalItemLength();
      this.setIntervalTreeValue(index, length);
    }
  }

  getIndexInfo(key: string): IndexInfo<ItemT> | null {
    const info = {} as IndexInfo;
    info.index = this._indexKeys.indexOf(key);

    return this._container.getFinalKeyIndexInfo(key, this.id);
  }

  computeIndexRange(minOffset: number, maxOffset: number) {
    const result = this.intervalTree.computeRange(minOffset, maxOffset);

    console.log(
      'computeIndexRange result ',
      this.intervalTree.getHeap()[1],
      result
    );

    return result;
  }

  pump(
    _data: Array<ItemT>,
    baseIndex = 0,
    keyToMetaMap: Map<string, ItemMeta<ItemT>>,
    intervalTree: PrefixIntervalTree
  ) {
    const data = _data.slice(baseIndex);
    const len = data.length;

    for (let index = 0; index < len; index++) {
      const item = data[index];
      const currentIndex = index + baseIndex;
      const itemKey = this.getItemKey(item, currentIndex);
      if (!itemKey) continue;
      const meta =
        this.getKeyMeta(itemKey) ||
        this.createItemMeta(itemKey, _data, currentIndex);

      if (meta.getLayout()) {
        // const itemLength = this._selectValue.selectLength(meta.getLayout());
        // 最后一个不包含separatorLength
        if (index === len - 1) {
          meta.setUseSeparatorLength(false);
        } else {
          meta.setUseSeparatorLength(true);
        }

        const length = meta.getFinalItemLength();

        // const separatorLength = meta.getSeparatorLength();

        // const length =
        //   index === len - 1 ? itemLength : itemLength + separatorLength;
        intervalTree.drySet(currentIndex, length);
      }

      // TODO=======
      // this.setKeyMeta(itemKey, meta);
      keyToMetaMap.set(itemKey, meta);
    }

    this.applyIntervalTreeUpdate(intervalTree);
  }

  append(data: Array<ItemT>) {
    const baseIndex = this._indexKeys.length;
    this.pump(data, baseIndex, this._keyToMetaMap, this.intervalTree);

    // after set interval tree. should then trigger a update..
    // this.triggerOwnerRecalculateLayout();
  }

  shuffle(data: Array<ItemT>) {
    const oldLength = this.intervalTree.getHeap()[1];
    this.intervalTree = this.createIntervalTree();
    // const itemIntervalTree = this.createIntervalTree();
    const keyToMetaMap = new Map();
    this.pump(data, 0, keyToMetaMap, this.intervalTree);
    // this.replaceIntervalTree(itemIntervalTree);
    this._keyToMetaMap = keyToMetaMap;
    const nextLength = this.intervalTree.getHeap()[1];

    if (oldLength !== nextLength) {
      this.triggerOwnerRecalculateLayout();
    }
  }

  /**
   *
   * @param key string, itemKey
   * @param info
   * @param updateIntervalTree target IntervalTree
   * @returns boolean value, true for updating intervalTree successfully.
   */
  _setKeyItemLayout(
    key: string,
    info: ItemLayout | number,
    updateIntervalTree?: boolean
  ) {
    // const falsy = this.performKeyOperationGuard(key);
    const _update =
      typeof updateIntervalTree === 'boolean' ? updateIntervalTree : true;

    // if (!falsy) {
    //   if (this._parentItemsDimensions)
    //     return this._parentItemsDimensions.setKeyItemLayout(key, info, _update);
    //   return false;
    // }
    const index = this.getKeyIndex(key);
    // const item = this._data[index];
    const meta = this.getKeyMeta(key);
    // const meta = this.getItemMeta(item, index);

    if (!meta) return false;

    if (typeof info === 'number') {
      let length = this.normalizeLengthNumber(info);
      if (
        Math.abs(
          length - (this._selectValue.selectLength(meta.getLayout() || {}) || 0)
        ) > LAYOUT_EQUAL_CORRECTION_VALUE
      ) {
        this._selectValue.setLength(meta.ensureLayout(), length);

        if (index !== this._data.length - 1) {
          meta.setUseSeparatorLength(true);
          // length = meta.getSeparatorLength() + length;
        } else {
          meta.setUseSeparatorLength(false);
        }

        length = meta.getFinalItemLength();

        if (_update) {
          this.setIntervalTreeValue(index, length);
          return true;
        }
      } else if (meta.isApproximateLayout) {
        // 比如换了一个item的话，不会触发更新
        this.triggerOwnerRecalculateLayout();
      }

      meta.isApproximateLayout = false;
      return false;
    }
    const _info = this.normalizeLengthInfo(info);
    const metaLayout = meta.getLayout();

    if (
      !metaLayout ||
      !layoutEqual(metaLayout, _info as ItemLayout, {
        keysToCheck: this.horizontal ? ['width'] : ['height'],
        correctionValue: LAYOUT_EQUAL_CORRECTION_VALUE,
      })
    ) {
      meta.isApproximateLayout = false;
      const currentLength = this._selectValue.selectLength(
        meta.getLayout() || {}
      );
      let length = this._selectValue.selectLength((_info as ItemLayout) || {});
      meta.setLayout(_info as ItemLayout);
      // 只有关心的值发生变化时，才会再次触发setIntervalTreeValue
      if (currentLength !== length && _update) {
        if (index !== this._data.length - 1) {
          meta.setUseSeparatorLength(true);
          // length = meta.getSeparatorLength() + length;
        } else {
          meta.setUseSeparatorLength(false);
        }

        length = meta.getFinalItemLength();

        this.setIntervalTreeValue(index, length);
        return true;
      }
    } else if (meta.isApproximateLayout) {
      meta.isApproximateLayout = false;
      // 比如换了一个item的话，不会触发更新
      this.triggerOwnerRecalculateLayout();
    }

    return false;
  }
}

export default ListDimensionsModel;
