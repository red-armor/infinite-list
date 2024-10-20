import Batchinator from '@x-oasis/batchinator';
import isClamped from '@x-oasis/is-clamped';
import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';
import Dimension from './Dimension';
import ItemMeta from './ItemMeta';
import ItemsDimensions from './ItemsDimensions';
import ListDimensionsModel from './ListDimensionsModel';
import {
  ListGroupIndexInfo,
  ItemLayout,
  KeysChangedType,
  ListGroupDimensionsProps,
  ListRangeResult,
  OnEndReached,
  ScrollMetrics,
  KeyToOnEndReachedMap,
  RegisteredListProps,
  RegisteredDimensionProps,
  DimensionsIndexRange,
  GenericItemT,
  ListGroupChildDimensions,
  IndexToOffsetMap,
} from './types';
import BaseImpl from './strategies/BaseImpl';
import Inspector from './Inspector';
import { info } from './utils/logger';
import defaultBooleanValue from '@x-oasis/default-boolean-value';
import createStore from './state/createStore';

// TODO: indexRange should be another intervalTree
/**
 * ListGroupDimensions has two kinds of data model
 * - normal list: group of same item.
 * - singleton item: abstraction of specified item.
 *
 * ListGroup is just like a router.
 */
class ListGroupDimensions<
  ItemT extends GenericItemT = GenericItemT
> extends BaseImpl<ItemT> {
  private keyToListDimensionsMap = new Map<
    string,
    ListGroupChildDimensions<ItemT>
  >();
  private _keyToOnEndReachedMap: KeyToOnEndReachedMap = new Map();
  private _itemsDimensions: ItemsDimensions;
  private _onUpdateItemLayout?: Function;
  private _onUpdateIntervalTree?: Function;
  private _onItemsCountChangedBatchinator: Batchinator;
  public recalculateDimensionsIntervalTreeBatchinator: Batchinator;
  /**
   * _flattenData could be considered as the final data model after transform
   * 1. dimension
   * 2. normal list
   */
  private _flattenData: Array<ItemT> = [];

  private _recycleEnable: boolean;

  private _dimensionsIntervalTree: PrefixIntervalTree = new PrefixIntervalTree(
    100
  );

  private _reflowItemsLength = 0;
  private _dimensionsIndexRange: DimensionsIndexRange<ItemT>[] = [];

  private _inspector: Inspector<ItemT>;

  /**
   * used with `getItemLayout`, on default if `getItemLayout` is provided, itemMeta's
   * isApproximateLayout should be false if item layout is resolve from `getItemLayout`.
   *
   */
  private _isFixedLength: boolean;

  constructor(props: ListGroupDimensionsProps) {
    super({
      recycleEnabled: true,
      store: createStore(),
      ...props,
    });
    const { id, onUpdateItemLayout, onUpdateIntervalTree } = props;

    this._itemsDimensions = new ItemsDimensions({
      id,
    });
    this._recycleEnable = defaultBooleanValue(props.recycleEnabled, true);
    this._onUpdateIntervalTree = onUpdateIntervalTree;
    this._onUpdateItemLayout = onUpdateItemLayout;
    this._onItemsCountChangedBatchinator = new Batchinator(
      this.onItemsCountChanged.bind(this),
      50
    );

    this._isFixedLength = defaultBooleanValue(props.isFixedLength, true);

    this._inspector = new Inspector({
      owner: this,
      onChange: this.onIndexKeysChanged.bind(this),
    });

    this.recalculateDimensionsIntervalTreeBatchinator = new Batchinator(
      this.recalculateDimensionsIntervalTree.bind(this),
      50
    );
  }

  get inspector() {
    return this._inspector;
  }

  get indexKeys() {
    return this._inspector.indexKeys;
  }

  getDimension(key: string) {
    return this.keyToListDimensionsMap.get(key);
  }

  setDimension(key: string, dimension: ListGroupChildDimensions<ItemT>) {
    return this.keyToListDimensionsMap.set(key, dimension);
  }

  deleteDimension(key: string) {
    return this.keyToListDimensionsMap.delete(key);
  }

  get dimensionsIndexRange() {
    return this._dimensionsIndexRange;
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

  getIntervalTree() {
    return this._dimensionsIntervalTree;
  }

  resetIntervalTree() {
    this._dimensionsIntervalTree = this.createIntervalTree();
    return this._dimensionsIntervalTree;
  }

  getTotalLength() {
    return this._dimensionsIntervalTree.getHeap()[1];
  }

  getDataLength() {
    let len = 0;
    for (let index = 0; index < this.indexKeys.length; index++) {
      const key = this.indexKeys[index];
      const dimensions = this.getDimension(key);
      len += dimensions?.length || 0;
    }
    return len;
  }

  getFinalIndexItemMeta(index: number) {
    const info = this.getFinalIndexIndexInfo(index);
    if (info) {
      const dimension = info.dimensions;
      return dimension.getIndexItemMeta(info.index);
    }
    return null;
  }

  getFinalItemKey(item: any) {
    const len = this.indexKeys.length;
    for (let index = 0; index < len; index++) {
      const key = this.indexKeys[index];
      const dimension = this.getDimension(key);
      const itemKey = dimension?.getFinalItemKey(item);
      if (itemKey) return itemKey;
    }
    return '';
  }

  getFinalItemMeta(item: any) {
    const len = this.indexKeys.length;
    for (let index = 0; index < len; index++) {
      const key = this.indexKeys[index];
      const dimension = this.getDimension(key);
      const itemMeta = dimension?.getFinalItemMeta(item);
      if (itemMeta) return itemMeta;
    }
    return null;
  }

  getFinalIndexKeyOffset(index: number, exclusive?: boolean) {
    const listOffset = exclusive ? 0 : this.getContainerOffset();

    if (typeof index === 'number') {
      const indexInfo = this.getFinalIndexIndexInfo(index);
      if (indexInfo) {
        const { dimensions, index: _index } = indexInfo;
        // _offsetInListGroup should be included. so exclusive should be false on default.
        return listOffset + dimensions.getIndexKeyOffset(_index);
      }
    }
    return 0;
  }

  getFinalIndexKeyBottomOffset(index: number, exclusive?: boolean) {
    const listOffset = exclusive ? 0 : this.getContainerOffset();

    if (typeof index === 'number') {
      const indexInfo = this.getFinalIndexIndexInfo(index);
      if (indexInfo) {
        const { dimensions } = indexInfo;
        const height = dimensions.getTotalLength();
        // _offsetInListGroup should be included. so exclusive should be false on default.
        return (
          listOffset +
          dimensions.getContainerOffset() +
          (typeof height === 'number' ? height : 0)
        );
      }
    }
    return 0;
  }

  getFinalIndexRangeOffsetMap(
    startIndex: number,
    endIndex: number,
    exclusive?: boolean
  ) {
    const indexToOffsetMap: IndexToOffsetMap = {};
    let startOffset = this.getFinalIndexKeyOffset(startIndex, exclusive);
    for (let index = startIndex; index <= endIndex; index++) {
      const itemMeta = this.getFinalIndexItemMeta(index);
      if (!itemMeta) continue;

      indexToOffsetMap[index] = startOffset;

      if (itemMeta?.isApproximateLayout) {
        indexToOffsetMap[index] = this.itemOffsetBeforeLayoutReady;
      } else {
        indexToOffsetMap[index] = startOffset;
        startOffset += itemMeta?.getFinalItemLength();
      }
    }
    return indexToOffsetMap;
  }

  getFinalIndexItemLength(index: number) {
    const itemMeta = this.getFinalIndexItemMeta(index);
    if (itemMeta) return itemMeta.getItemLength();
    return 0;
  }

  getReflowItemsLength() {
    return this._reflowItemsLength;
  }

  override hasUnLayoutItems() {
    const len = this.indexKeys.length;
    for (let index = 0; index < len; index++) {
      const key = this.indexKeys[index];
      const dimensions = this.getDimension(key);
      if (dimensions && dimensions?.hasUnLayoutItems()) {
        return true;
      }
    }

    return false;
  }

  calculateReflowItemsLength() {
    this._reflowItemsLength = this.indexKeys.reduce((acc, cur) => {
      const dimensions = this.getDimension(cur);
      if (dimensions) {
        return acc + dimensions.getReflowItemsLength();
      }
      return acc;
    }, 0);
  }

  getKeyIndex(key: string, listKey: string) {
    const listIndex = this.indexKeys.findIndex(
      (indexKey) => indexKey === listKey
    );

    if (listIndex !== -1) {
      const listDimensions = this.getDimension(listKey);
      if (listDimensions) {
        return listDimensions instanceof ListDimensionsModel
          ? listDimensions.getKeyIndex(key)
          : 0;
      }
    }

    return -1;
  }

  getIndexKey(index: number, listKey: string) {
    const listIndex = this.indexKeys.findIndex(
      (indexKey) => indexKey === listKey
    );

    if (listIndex !== -1) {
      const dimensions = this.getDimension(listKey);
      if (dimensions instanceof ListDimensionsModel)
        return dimensions.getIndexKey(index);
      else if (dimensions instanceof Dimension) return dimensions.getKey();
    }

    return null;
  }

  getFinalIndexIndexInfo(idx: number): ListGroupIndexInfo<ItemT> | null {
    const len = this._dimensionsIndexRange.length;
    for (let index = 0; index < len; index++) {
      const info = this._dimensionsIndexRange[index];
      const { startIndex, endIndex, dimensions, startIndexInRecycler } = info;

      if (startIndex <= idx && idx < endIndex)
        return {
          dimensions,
          index: idx - startIndex,
          indexInGroup: idx,
          indexInRecycler: startIndexInRecycler + idx - startIndex,
        };
    }

    return null;
  }

  getFinalKeyIndexInfo(
    itemKey: string,
    listKey: string
  ): ListGroupIndexInfo<ItemT> | null {
    const dimensions = this.getDimension(listKey);
    if (dimensions) {
      const info = this.dimensionsIndexRange.find(
        (d) => d.dimensions === dimensions
      );
      if (info) {
        const { startIndex, dimensions, startIndexInRecycler } = info;
        const indexInDimensions = dimensions.getKeyIndex(itemKey);
        return {
          dimensions,
          index: indexInDimensions,
          indexInRecycler: startIndexInRecycler + indexInDimensions,
          indexInGroup: startIndex + indexInDimensions,
        };
      }
    }

    return null;
  }

  /**
   *
   * @param key: string, itemKey
   * @param listKey: string, the container key
   * @returns number,
   *
   * TODO: basic item may have error???
   */
  getFinalIndex(key: string, listKey: string) {
    let indexInList = 0;
    const dimensions = this.getDimension(listKey);
    if (!dimensions) return -1;
    if (dimensions instanceof ListDimensionsModel) {
      indexInList = dimensions.getKeyIndex(key);
      if (indexInList === -1) return -1;
    } else if (dimensions instanceof Dimension) {
      indexInList = 0;
    }

    const dimensionsStartIndex = this.getDimensionStartIndex(listKey);

    if (dimensionsStartIndex !== -1) return dimensionsStartIndex + indexInList;
    return -1;
  }

  /**
   *
   * @param listKey dimension key; It could be list key or singleton item key
   * @returns
   */
  getDimensionStartIndex(listKey: string) {
    const _dimensions = this.getDimension(listKey);
    if (_dimensions) {
      const info = this._dimensionsIndexRange.find(
        ({ dimensions }) => dimensions === _dimensions
      );
      if (info) return info.startIndex;
    }

    return -1;
  }

  /**
   *
   * @param listKey dimension key; It could be list key or singleton item key
   * @returns
   */
  getDimensionStartIndexInRecycler(listKey: string) {
    const _dimensions = this.getDimension(listKey);
    if (_dimensions) {
      const info = this._dimensionsIndexRange.find(
        ({ dimensions }) => dimensions === _dimensions
      );
      return info?.startIndex;
    }

    return 0;
  }

  removeListDimensions(listKey: string) {
    const index = this.indexKeys.findIndex((indexKey) => indexKey === listKey);
    if (index !== -1) {
      this._dimensionsIntervalTree.remove(index);
      this.deleteDimension(listKey);
      this.inspector.remove(listKey);
      this.onItemsCountChanged();
    }
  }

  getFinalAnchorKey(dimensionsKey: string) {
    const dimensions = this.getDimension(dimensionsKey);
    if (dimensions) return dimensions.anchorKey;
    return null;
  }

  /**
   *
   * @param listKey add a list listener
   * @param listDimensionsProps to initialize ListDimensions instance
   * @returns listener remover
   */
  registerList(
    listKey: string,
    listDimensionsProps: RegisteredListProps<ItemT>
  ): {
    dimensions: ListDimensionsModel<ItemT>;
    remover: () => void;
  } {
    if (this.getDimension(listKey))
      return {
        dimensions: this.getDimension(listKey) as ListDimensionsModel<ItemT>,
        remover: () => {
          this.removeListDimensions(listKey);
        },
      };
    // should update indexKeys first !!!
    const dimensions = new ListDimensionsModel({
      id: listKey,
      container: this,
      horizontal: this.getHorizontal(),
      isFixedLength: this._isFixedLength,
      manuallyApplyInitialData: true,
      ...listDimensionsProps,
      recycleEnabled: this._recycleEnable,
    });
    this.addBuffer(dimensions.recyclerType);

    this.setDimension(listKey, dimensions);
    this._inspector.push(listKey);

    dimensions.applyInitialData();

    let onEndReachedCleaner;

    if (listDimensionsProps.onEndReached) {
      onEndReachedCleaner = this.addOnEndReached(
        listDimensionsProps.onEndReached
      );
      this._keyToOnEndReachedMap.set(listKey, listDimensionsProps.onEndReached);
    }

    // for performance boost. only reflow data when less than initial number;
    if (this.getData().length < this.initialNumToRender) {
      this.onItemsCountChanged();
    } else {
      this._onItemsCountChangedBatchinator.schedule();
    }

    return {
      dimensions,
      remover: () => {
        this.removeListDimensions(listKey);
        if (onEndReachedCleaner) onEndReachedCleaner();
      },
    };
  }

  onIndexKeysChanged() {
    this.onItemsCountChanged();
  }

  /**
   * should be run immediately...
   *
   * To cache dimension index range, startIndex included, endIndex exclusive.
   * just like [].slice(startIndex, endIndex)
   */
  calculateDimensionsIndexRange() {
    let startIndex = 0;
    const rangeMap: {
      [key: string]: number;
    } = {};
    this._dimensionsIndexRange = this.indexKeys.reduce<
      DimensionsIndexRange<ItemT>[]
    >((acc, key) => {
      const dimensions = this.getDimension(key);
      if (!dimensions) return acc;
      const recyclerType = dimensions.recyclerType;
      if (rangeMap[recyclerType] == null) rangeMap[recyclerType] = 0;

      const endIndex = startIndex + dimensions.length;
      const startIndexInRecycler = rangeMap[recyclerType];
      rangeMap[recyclerType] = startIndexInRecycler + dimensions.length;
      acc.push({
        startIndex,
        endIndex,
        dimensions,
        startIndexInRecycler,
        endIndexInRecycler: rangeMap[recyclerType],
      });
      startIndex = endIndex;
      return acc;
    }, []);
  }

  /**
   * Important!!! : data change should be reflect immediately. but resolve state could
   * be deferred. So this.updateScrollMetrics actually is a batch operation ..
   */
  onItemsCountChanged() {
    this.reflowFlattenData();
    this.calculateDimensionsIndexRange();
    this.calculateReflowItemsLength();
    this.updateChildDimensionsOffsetInContainer();
    this.updateScrollMetrics();
  }

  /**
   * 当item layout发生变化以后，这个时候要将子 dimension的相对高度重新计算一下
   */
  updateChildDimensionsOffsetInContainer() {
    let len = 0;
    this.indexKeys.forEach((key) => {
      const dimension = this.getDimension(key);
      if (dimension) {
        dimension.offsetInListGroup = len;
        const total = dimension.getTotalLength();
        if (typeof total === 'number') len += total;
      }
    });
  }

  onDataSourceChanged() {
    this.updateScrollMetrics(this._scrollMetrics);
  }

  onItemLayoutChanged() {
    this.recalculateDimensionsIntervalTreeBatchinator.schedule();
  }

  recalculateDimensionsIntervalTree() {
    this.indexKeys.forEach((key, index) => {
      const dimensions = this.getDimension(key);
      if (dimensions) {
        const len = dimensions.getTotalLength();
        if (typeof len === 'number')
          this._dimensionsIntervalTree.set(index, len);
      }
    });

    this.updateChildDimensionsOffsetInContainer();
    this.calculateReflowItemsLength();
    this.updateScrollMetrics();
  }

  removeItem(key: string) {
    const index = this._inspector.findIndex(key);
    if (index !== -1) {
      this._dimensionsIntervalTree.remove(index);
      this.deleteDimension(key);
      this._inspector.remove(key);
      this.onItemsCountChanged();
    }
  }

  registerItem(
    key: string,
    dimensionProps: RegisteredDimensionProps<ItemT> = {}
  ): {
    dimensions: Dimension<ItemT>;
    remover: () => void;
  } {
    if (this.getDimension(key))
      return {
        dimensions: this.getDimension(key) as Dimension<ItemT>,
        remover: () => {
          this.removeItem(key);
        },
      };
    const dimensions = new Dimension({
      id: key,
      container: this,
      horizontal: this.horizontal,
      canIUseRIC: this.canIUseRIC,
      isFixedLength: this._isFixedLength,
      ...dimensionProps,
      recycleEnabled: this._recycleEnable,
    });
    this.setDimension(key, dimensions);
    this.addBuffer(dimensions.recyclerType);
    this._inspector.push(key);
    // for performance boost. only reflow data when less than initial number;
    if (this.getData().length < this.initialNumToRender) {
      this.onItemsCountChanged();
    } else {
      this._onItemsCountChangedBatchinator.schedule();
    }
    return {
      dimensions,
      remover: () => {
        this.removeItem(key);
      },
    };
  }

  getData() {
    return this._flattenData;
  }

  reflowFlattenData() {
    this._flattenData = this.indexKeys.reduce<ItemT[]>((acc, key) => {
      const dimension = this.getDimension(key);
      if (dimension) {
        acc = ([] as ItemT[]).concat(acc, dimension.getData());
      }
      return acc;
    }, []);
    return this._flattenData;
  }

  /**
   *
   * @param listKey
   * @param data
   *
   * for child list, the corresponding setData method will not trigger onItemsCountChanged
   * So setListData comes
   */
  setListData(listKey: string, data: Array<any>) {
    const listDimensions = this.getDimension(listKey);
    if (listDimensions) {
      const changedType = (
        listDimensions as ListDimensionsModel<ItemT>
      ).setData(data);

      if (
        [
          KeysChangedType.Add,
          KeysChangedType.Remove,
          KeysChangedType.Append,
        ].indexOf(changedType) !== -1
      ) {
        // 这个得跟removeItem对应都得做个延迟，不然的话会存在一个可能性，比如替换整个list的数据，
        // remove callback一般会慢，如果不做延迟的话，你会发现data可能存在已经unmount的数据
        this.onItemsCountChanged();
        // this._onItemsCountChangedBatchinator.schedule();
      } else if (changedType === KeysChangedType.Reorder) {
        this.reflowFlattenData();
        // 之所以，不能够用缓存；因为现在的判断Reorder只是看key；这个key对应的item其实
        // 并没有看；所以它不是纯粹的shuffle；这个时候item可能发生了变化，所以是不能够用
        // 缓存的。艸，描述错了。。它其实是因为打乱顺序以后，可能indexRange会发生变化；
        this.updateScrollMetrics(this._scrollMetrics, {
          useCache: false,
        });
      }
    }
  }

  setOnEndReached(listKey: string, onEndReached: OnEndReached) {
    const listDimensions = this.getDimension(listKey);
    if (listDimensions) {
      const _handler = this._keyToOnEndReachedMap.get(listKey);
      if (_handler) this.removeOnEndReached(_handler);
      this.addOnEndReached(onEndReached);
    }
  }

  getListData(listKey: string) {
    const listDimensions = this.getDimension(listKey);
    if (listDimensions)
      return (listDimensions as ListDimensionsModel<ItemT>).getData();
    return [];
  }

  getItemKeyDimension(itemKey: string) {
    const len = this.indexKeys.length;
    for (let index = 0; index < len; index++) {
      const key = this.indexKeys[index];
      const dimension = this.getDimension(key);
      // @ts-ignore
      if (dimension.hasKey(itemKey)) {
        return dimension;
      }
    }
    return null;
  }

  getFinalKeyItemOffset(itemKey: string, exclusive?: boolean) {
    const dimension = this.getItemKeyDimension(itemKey);
    if (dimension) {
      const containerOffset = exclusive ? 0 : this.getContainerOffset();
      return (
        (dimension as ListDimensionsModel<ItemT>).getKeyItemOffset(itemKey) +
        containerOffset
      );
    }
    return 0;
  }

  getKeyItemOffset(key: string, listKey: string, exclusive?: boolean) {
    const containerOffset = exclusive ? 0 : this.getContainerOffset();
    const listDimensions = this.getDimension(listKey);
    if (listDimensions) {
      return (
        (listDimensions as ListDimensionsModel<ItemT>).getKeyItemOffset(key) +
        containerOffset
      );
    }
    return null;
  }

  getFinalKeyMeta(itemKey: string) {
    const dimension = this.getItemKeyDimension(itemKey);
    if (dimension instanceof ListDimensionsModel)
      return dimension.getKeyMeta(itemKey);
    else if (dimension instanceof Dimension) return dimension.getMeta();
    return null;
  }

  getKeyMeta(key: string, listKey: string) {
    const dimensions = this.getDimension(listKey);
    if (dimensions instanceof ListDimensionsModel)
      return dimensions.getKeyMeta(key);
    else if (dimensions instanceof Dimension) return dimensions.getMeta();
    return null;
  }

  setFinalKeyMeta(itemKey: string, itemMeta: ItemMeta<ItemT>) {
    const dimensions = this.getItemKeyDimension(itemKey);
    if (dimensions instanceof ListDimensionsModel)
      return dimensions.setKeyMeta(itemKey, itemMeta);
    else if (dimensions instanceof Dimension)
      return dimensions.setMeta(itemMeta);
    return null;
  }

  setKeyMeta(key: string, listKey: string, itemMeta: ItemMeta<ItemT>) {
    const dimensions = this.getDimension(listKey);
    if (dimensions instanceof ListDimensionsModel)
      return dimensions.setKeyMeta(key, itemMeta);
    else if (dimensions instanceof Dimension)
      return dimensions.setMeta(itemMeta);
    return null;
  }

  ensureKeyMeta(key: string, listKey: string) {
    const dimensions = this.getDimension(listKey);
    if (dimensions instanceof ListDimensionsModel)
      return dimensions.ensureKeyMeta(key);
    else if (dimensions instanceof Dimension) return dimensions.ensureKeyMeta();
    return null;
  }

  getKeyItemLayout(key: string, listKey: string) {
    const listDimensions = this.getDimension(listKey);
    if (listDimensions) {
      return (listDimensions as ListDimensionsModel<ItemT>).getKeyItemLayout(
        key
      );
    }

    return null;
  }

  getFinalKeyItemLayout(itemKey: string) {
    const dimensions = this.getItemKeyDimension(itemKey);
    if (dimensions) {
      return (dimensions as ListDimensionsModel<ItemT>).getKeyItemLayout(
        itemKey
      );
    }
    return null;
  }

  getIndexItemLayout(index: number, listKey: string) {
    const key = this.getIndexKey(index, listKey);
    if (key) return this.getKeyItemLayout(key, listKey);
    return null;
  }

  setIndexItemLayout(index: number, listKey: string, layout: ItemLayout) {
    const key = this.getIndexKey(index, listKey);
    if (key) this.setKeyItemLayout(key, listKey, layout);
  }

  setFinalKeyItemLayout(itemKey: string, layout: ItemLayout | number) {
    const dimensions = this.getItemKeyDimension(itemKey);
    if (dimensions) {
      if (dimensions instanceof ListDimensionsModel) {
        return dimensions.setKeyItemLayout(itemKey, layout);
      } else if (dimensions instanceof Dimension) {
        return dimensions.setItemLayout(layout);
      }
    }
    return false;
  }

  setKeyItemLayout(key: string, listKey: string, layout: ItemLayout | number) {
    const dimensions = this.getDimension(listKey);
    if (dimensions) {
      if (dimensions instanceof ListDimensionsModel) {
        dimensions.setKeyItemLayout(key, layout);
      } else if (dimensions instanceof Dimension) {
        dimensions.setItemLayout(layout);
      }
    }
  }

  static createPositionToken() {
    return {
      dimensionKey: '',
      index: -1,
    };
  }

  findPosition(finalIndex: number) {
    const len = this.indexKeys.length;
    let startIndex = 0;
    const positionToken = ListGroupDimensions.createPositionToken();

    for (let index = 0; index < len; index++) {
      const key = this.indexKeys[index];

      const dimension = this.getDimension(key);
      const min = startIndex;
      const max =
        startIndex +
        (dimension instanceof Dimension
          ? 0
          : Math.max((dimension as ListDimensionsModel<ItemT>).length - 1, 0));

      if (isClamped(min, finalIndex, max)) {
        positionToken.dimensionKey = key;
        positionToken.index = finalIndex - startIndex;

        return positionToken;
      }
      startIndex = max + 1;
    }

    return -1;
  }

  /**
   *
   * @param finalStartIndex
   * @param finalEndIndex
   * @returns
   */
  findListRange(finalStartIndex: number, finalEndIndex: number) {
    const startPosition = this.findPosition(finalStartIndex);
    const endPosition = this.findPosition(finalEndIndex);

    if (startPosition === -1 || endPosition === -1) return [];

    const startDimensionIndex = this.indexKeys.findIndex(
      (key) => key === startPosition.dimensionKey
    );
    const endDimensionIndex = this.indexKeys.findIndex(
      (key) => key === endPosition.dimensionKey
    );
    const result: ListRangeResult<ItemT> = [];

    for (let index = startDimensionIndex; index <= endDimensionIndex; index++) {
      const currentValues: ItemMeta<ItemT>[] = [];
      const range = {
        startIndex: -1,
        endIndex: -1,
      };
      const dimensionKey = this.indexKeys[index];
      const dimension = this.getDimension(dimensionKey);

      if (dimension instanceof Dimension) {
        currentValues.push(dimension.getMeta());
        range.startIndex = 0;
        range.endIndex = 0;
        result.push({
          listKey: dimensionKey,
          isDimension: true,
        });
        continue;
      }

      if (!dimension) continue;
      const len = dimension.length;

      // the same list
      if (startDimensionIndex === endDimensionIndex) {
        range.startIndex = startPosition.index;
        range.endIndex = endPosition.index;
      } else if (index === startDimensionIndex) {
        // the begin
        const { index: startIndex } = startPosition;
        range.startIndex = startIndex;
        range.endIndex = len - 1;
      } else if (index === endDimensionIndex) {
        // the tail
        const { index: endIndex } = endPosition;
        range.startIndex = 0;
        range.endIndex = endIndex;
      } else {
        // middle
        range.startIndex = 0;
        range.endIndex = len - 1;
      }

      for (let idx = range.startIndex; idx < range.endIndex + 1; idx++) {
        const meta = dimension?.getIndexItemMeta(idx);
        if (meta) currentValues.push(meta);
      }

      result.push({
        listKey: dimensionKey,
        isDimension: false,
        value: {
          ...range,
          data: this.getListData(dimensionKey).slice(0, range.endIndex + 1),
        },
      });
    }

    return result;
  }

  /**
   *
   * @param minOffset
   * @param maxOffset
   * @returns
   *
   * used in state reducer.
   */
  computeIndexRange(minOffset: number, maxOffset: number) {
    const dimensionResult = this._dimensionsIntervalTree.computeRange(
      minOffset,
      maxOffset
    );

    const { startIndex, endIndex: _endIndex } = dimensionResult;

    info(
      'computeIndexRange ',
      startIndex,
      _endIndex,
      minOffset,
      maxOffset,
      this._dimensionsIntervalTree.getHeap()[1],
      this._dimensionsIntervalTree.getMaxUsefulLength()
    );

    const endIndex = _endIndex - 1;

    if (startIndex === endIndex) {
      const dimensionKey = this.indexKeys[startIndex];
      const dimensionsStartIndex = this.getDimensionStartIndex(dimensionKey);

      const dimensions = this.getDimension(dimensionKey);
      if (dimensions instanceof Dimension) {
        return {
          startIndex: dimensionsStartIndex,
          endIndex: dimensionsStartIndex + 1,
        };
      } else if (dimensions instanceof ListDimensionsModel) {
        const startOffset = this._dimensionsIntervalTree.sumUntil(startIndex);
        const { startIndex: innerStartIndex, endIndex: innerEndIndex } =
          dimensions.computeIndexRange(
            minOffset - startOffset,
            maxOffset - startOffset
          );

        return {
          startIndex: dimensionsStartIndex + innerStartIndex,
          endIndex: dimensionsStartIndex + innerEndIndex,
        };
      }
      return {
        startIndex: -1,
        endIndex: -1,
      };
    }

    const _nextStartIndex = Math.max(0, startIndex);
    const startDimensionsKey = this.indexKeys[_nextStartIndex];
    const startDimensions = this.getDimension(startDimensionsKey);

    let nextStartIndex = startIndex;

    // if it is a item...
    if (startDimensions instanceof Dimension) {
      nextStartIndex = this.getDimensionStartIndex(startDimensionsKey);
    } else if (
      /**
       * if it is a List...
       */
      startDimensions instanceof ListDimensionsModel
    ) {
      const startOffset =
        this._dimensionsIntervalTree.sumUntil(_nextStartIndex);
      const dimensionsStartIndex =
        this.getDimensionStartIndex(startDimensionsKey);

      const index = startDimensions.intervalTree.greatestLowerBound(
        minOffset - startOffset
      );
      nextStartIndex = dimensionsStartIndex + index;
    }

    const _nextEndIndex = Math.max(0, endIndex);
    const endDimensionsKey = this.indexKeys[_nextEndIndex];
    const endDimensions = this.getDimension(endDimensionsKey);

    let nextEndIndex = startIndex;

    if (endDimensions instanceof Dimension) {
      nextEndIndex = this.getDimensionStartIndex(endDimensionsKey) + 1;
    } else if (endDimensions instanceof ListDimensionsModel) {
      const startOffset = this._dimensionsIntervalTree.sumUntil(_nextEndIndex);
      const dimensionsStartIndex =
        this.getDimensionStartIndex(endDimensionsKey);
      const index = endDimensions.intervalTree.leastStrictUpperBound(
        maxOffset - startOffset
      );
      nextEndIndex = dimensionsStartIndex + index;
    }

    info('computedIndexRange ', nextStartIndex, nextEndIndex);

    return {
      startIndex: nextStartIndex,
      endIndex: nextEndIndex,
    };
  }

  computeIndexRangeMeta(props: {
    startIndex: number;
    endIndex: number;
  }): ListRangeResult<ItemT> {
    const { startIndex, endIndex } = props;
    return this.findListRange(startIndex, endIndex);
  }

  onUpdateDimensionItemsMetaChange(
    itemsMeta: Array<ItemMeta>,
    scrollMetrics: ScrollMetrics
  ) {
    this._configTuple.getViewabilityHelpers().forEach((helper) => {
      helper.onUpdateItemsMeta(itemsMeta, scrollMetrics);
    });
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

export default ListGroupDimensions;
