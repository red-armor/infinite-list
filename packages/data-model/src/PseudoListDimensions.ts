import BaseDimensions from './BaseDimensions';
import ItemMeta from './ItemMeta';
import PrefixIntervalTree from '@x-oasis/prefix-interval-tree';
import layoutEqual from '@x-oasis/layout-equal';

import {
  IndexInfo,
  ItemLayout,
  KeysChangedType,
  PseudoListDimensionsProps,
} from './types';

class PseudoListDimensions extends BaseDimensions {
  constructor(props: PseudoListDimensionsProps) {
    super({
      ...props,
      isIntervalTreeItems: true,
    });
    const { indexKeys } = props;
    this.setIndexKeys(indexKeys);
  }

  setIndexKeys(keys: Array<string>) {
    const keysChangedType = this.resolveKeysChangedType(keys);

    switch (keysChangedType) {
      case KeysChangedType.Equal:
        break;
      case KeysChangedType.Append:
        this.append(keys);
        break;
      case KeysChangedType.Add:
      case KeysChangedType.Remove:
      case KeysChangedType.Reorder:
        this.shuffle(keys);
        break;
    }
    this._indexKeys = keys;
  }

  getIndexInfo(key: string): IndexInfo {
    const info = {} as IndexInfo;
    info.index = this._indexKeys.indexOf(key);
    return info;
  }

  createItemMeta(key: string) {
    const meta = ItemMeta.spawn({
      key,
      owner: this,
      separatorLength: 0,
      canIUseRIC: this.canIUseRIC,
      layout: { x: 0, y: 0, height: 0, width: 0 },
    });
    return meta;
  }

  pump(
    _keys: Array<string>,
    baseIndex = 0,
    keyToIndexMap: Map<string, number>,
    keyToIndexArray: Array<string>,
    keyToMetaMap: Map<string, ItemMeta>,
    intervalTree: PrefixIntervalTree
  ) {
    const keys = _keys.slice(baseIndex);
    const len = keys.length;
    for (let index = 0; index < len; index++) {
      const currentIndex = index + baseIndex;
      const itemKey = keys[index];
      const meta = this.getKeyMeta(itemKey) || this.createItemMeta(itemKey);
      const itemLength = this._selectValue.selectLength(meta.getLayout());

      keyToIndexMap.set(itemKey, currentIndex);
      keyToIndexArray[currentIndex] = itemKey;
      keyToMetaMap.set(itemKey, meta);
      intervalTree.set(currentIndex, itemLength);
    }
  }

  append(keys: Array<string>) {
    const baseIndex = this._indexKeys.length;
    this.pump(
      keys,
      baseIndex,
      this._keyToIndexMap,
      this._indexKeys,
      this._keyToMetaMap,
      this.intervalTree
    );
  }

  shuffle(keys: Array<string>) {
    const itemIntervalTree = this.createIntervalTree();
    const keyToIndexMap = new Map();
    const keyToIndexArray: string[] = [];
    const keyToMetaMap = new Map();
    this.pump(
      keys,
      0,
      keyToIndexMap,
      keyToIndexArray,
      keyToMetaMap,
      itemIntervalTree
    );
    this._indexKeys = keyToIndexArray;
    this._keyToIndexMap = keyToIndexMap;
    this._keyToMetaMap = keyToMetaMap;
    this.intervalTree = itemIntervalTree;
  }

  override resolveKeysChangedType(keys: Array<string>) {
    const oldLen = this._indexKeys.length;
    const newLen = keys.length;

    if (oldLen > newLen) return KeysChangedType.Remove;
    for (let index = 0; index < oldLen; index++) {
      const currentKey = this._indexKeys[index];
      const nextKey = keys[index];
      if (currentKey !== nextKey) {
        if (oldLen === newLen) return KeysChangedType.Reorder;
        return KeysChangedType.Add;
      }
    }

    if (oldLen === newLen) return KeysChangedType.Equal;
    return KeysChangedType.Append;
  }

  _setKeyItemLayout(
    key: string,
    info: ItemLayout | number,
    updateIntervalTree?: boolean
  ) {
    const index = this.getKeyIndex(key);
    const meta = this.getKeyMeta(key);
    const _update =
      typeof updateIntervalTree === 'boolean' ? updateIntervalTree : true;

    if (!meta) return false;

    if (typeof info === 'number') {
      const length = this.normalizeLengthNumber(info);
      if (meta && this._selectValue.selectLength(meta.getLayout()) !== length) {
        this._selectValue.setLength(meta.getLayout(), length);
        if (_update) {
          this.setIntervalTreeValue(index, length);
          return true;
        }
      }
      return false;
    }

    const _info = this.normalizeLengthInfo(info);

    if (!layoutEqual(meta.getLayout(), _info as ItemLayout)) {
      const currentLength = this._selectValue.selectLength(
        meta.getLayout() || {}
      );
      const length = this._selectValue.selectLength(
        (_info as ItemLayout) || {}
      );
      meta.setLayout(_info as ItemLayout);

      if (currentLength !== length && _update) {
        this.setIntervalTreeValue(index, length);
        return true;
      }
    }

    return false;
  }

  computeIndexRangeMeta() {
    return [];
  }
}

export default PseudoListDimensions;
