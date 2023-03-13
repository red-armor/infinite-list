import BaseDimensions from './BaseDimensions';
import ItemMeta from './ItemMeta';
import PrefixIntervalTree from './PrefixIntervalTree';
import layoutEqual from '@x-oasis/layout-equal'

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
    const meta = new ItemMeta({
      key,
      owner: this,
      separatorLength: 0,
      layout: { x: 0, y: 0, height: 0, width: 0 },
    });
    return meta;
  }

  pump(
    keys: Array<string>,
    baseIndex: number = 0,
    keyToIndexMap: Map<string, number>,
    keyToIndexArray: Array<string>,
    keyToMetaMap: Map<string, ItemMeta>,
    intervalTree: PrefixIntervalTree
  ) {
    const len = keys.length;
    for (let index = 0; index < len; index++) {
      const currentIndex = index + baseIndex;
      const itemKey = keys[currentIndex];
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
    const appended = keys.slice(baseIndex);
    this.pump(
      appended,
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
    const keyToIndexArray = [];
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

  resolveKeysChangedType(keys: Array<string>) {
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
      let length = info;
      if (meta && this._selectValue.selectLength(meta.getLayout()) !== length) {
        this._selectValue.setLength(meta.getLayout(), length);
        if (_update) {
          this.setIntervalTreeValue(index, length);
          return true;
        }
      }
    }

    if (!layoutEqual(meta.getLayout(), info as ItemLayout)) {
      meta.setLayout(info as ItemLayout);
      let length = this._selectValue.selectLength(info as ItemLayout);
      if (_update) {
        this.setIntervalTreeValue(index, length);
        return true;
      }
    }

    return false;
  }

  computeIndexRangeMeta(minOffset: number, maxOffset: number) {
    return [];
  }
}

export default PseudoListDimensions;
