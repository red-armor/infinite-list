/**
 * to cache key <-> index value
 */
class KeyIndexManager {
  _keyToIndexMap: Map<string, number> = new Map();
  _indexKeys: Array<string> = [];

  getIndexKey(index: number) {
    return this._indexKeys[index];
  }

  getIndexKeysLength() {
    return this._indexKeys.length;
  }

  getKeyIndex(key: string) {
    return this._keyToIndexMap.get(key);
  }

  setKeyToIndexMap(values: Map<string, number>) {
    this._keyToIndexMap = values;
  }

  setIndexKeys(values: string[]) {
    this._indexKeys = values;
  }

  findIndex(key: string) {
    return this._indexKeys.indexOf(key);
  }

  hasKey(key: string) {
    return this._indexKeys.indexOf(key) !== -1;
  }
}

export default KeyIndexManager;
