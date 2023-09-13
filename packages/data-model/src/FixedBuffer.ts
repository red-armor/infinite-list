import IntegerBufferSet from '@x-oasis/integer-buffer-set';
import { SafeRange } from './types';
import ListBaseDimensions from './ListBaseDimensions';
import ItemMeta from './ItemMeta';

type FixedBufferProps = {
  /**
   * index which start to replace
   */
  thresholdIndexValue: number;
  /**
   * max size
   */
  size: number;

  recyclerReservedBufferSize: number;

  recyclerType: string;

  startIndex: number;
  endIndex: number;
  owner: ListBaseDimensions;
};

class FixedBuffer {
  private _bufferSet = new IntegerBufferSet();
  /**
   * buffer size, the oversize node will run into recycle strategy
   */
  private _size = 10;
  /**
   * start index
   */
  private _thresholdIndexValue = 0;

  private _owner: ListBaseDimensions;

  private _startIndex: number;
  private _endIndex: number;
  private _recyclerType: string;
  private _indices: Array<number> = [];
  private _recyclerReservedBufferSize: number;

  private _indicesCopy = [];
  private _newIndices = [];
  private _itemMetaIndices = [];
  private _newItemMetaIndices = [];

  constructor(props: FixedBufferProps) {
    const {
      size,
      thresholdIndexValue,
      recyclerReservedBufferSize,
      recyclerType,
      owner,
      startIndex,
    } = props;
    this._size = size;
    this._owner = owner;
    this._startIndex = startIndex;
    this._recyclerType = recyclerType;
    this._thresholdIndexValue = thresholdIndexValue;
    this._recyclerReservedBufferSize = recyclerReservedBufferSize;
  }

  get size() {
    return this._size;
  }

  get thresholdIndexValue() {
    return this._thresholdIndexValue;
  }

  get recyclerType() {
    return this._recyclerType;
  }

  getPosition(rowIndex: number, startIndex: number, endIndex: number) {
    if (rowIndex < 0) return null;
    // 初始化的item不参与absolute替换
    if (rowIndex < this._thresholdIndexValue) return null;
    let position = this._bufferSet.getValuePosition(rowIndex);

    if (position === null && this._bufferSet.getSize() >= this.size) {
      position = this._bufferSet.replaceFurthestValuePosition(
        startIndex,
        endIndex,
        rowIndex,
        (options) => {
          const { bufferSetRange, currentIndex } = options;
          const { maxValue } = bufferSetRange;
          if (currentIndex > maxValue) return true;
          return false;
        }
      );
    }

    if (position === null) {
      position = this._bufferSet.getNewPositionForValue(rowIndex);
    }

    return position;
  }

  start() {
    this._indicesCopy = this._bufferSet.indices.map((i) => parseInt(i));
    this._newItemMetaIndices = new Array(this._recyclerReservedBufferSize);
    this._indices = new Array(this._recyclerReservedBufferSize);
  }

  place(index: number, itemMeta: ItemMeta, safeRange: SafeRange) {
    const idx = this._itemMetaIndices.findIndex((meta) => meta === itemMeta);
    if (idx !== -1) {
      const position = idx;
      this._newItemMetaIndices[position] = itemMeta;
      this._indices[position] = index;
    } else {
      const position = this.getPosition(
        index,
        safeRange.startIndex,
        safeRange.endIndex
      );
      if (position === position) {
        this._newItemMetaIndices[position] = itemMeta;
      }
    }
  }

  getMaxValue() {
    return this._bufferSet.getMaxValue();
  }

  getMinValue() {
    return this._bufferSet.getMinValue();
  }

  getIndices() {
    const arr = [];
    const nextItemMetaIndices = new Array(this._recyclerReservedBufferSize);
    for (let idx = 0; idx < this._recyclerReservedBufferSize; idx++) {
      if (typeof this._newItemMetaIndices[idx] === 'number') {
        // const targetIndex = this._bufferSet.indices[idx]
        const targetIndex = this._indices[idx];
        const itemMeta = this._newItemMetaIndices[idx];
        arr.push({
          itemMeta,
          targetIndex,
          recycleKey: `recycle_${this._startIndex + idx}`,
        });
        nextItemMetaIndices[idx] = itemMeta;
        continue;
      } else if ((this._owner.getData() || [])[this._indicesCopy[idx]]) {
        const targetIndex = this._indicesCopy[idx];
        const data = this._owner.getData() || [];
        const item = data[targetIndex];
        if (item) {
          const itemMeta = this._owner.getFinalItemMeta(item);
          if (itemMeta && itemMeta.recyclerType === this.recyclerType) {
            arr.push({
              itemMeta,
              targetIndex,
              recycleKey: `recycle_${this._startIndex + idx}`,
            });
            nextItemMetaIndices[idx] = itemMeta;
            continue;
          }
        }
      }

      this._itemMetaIndices = nextItemMetaIndices;
      arr.push(null);

      // const targetIndex = parseInt(this._bufferSet.indices[idx])
      // if (targetIndex === targetIndex) {
      //   const data = this._owner.getData() || []
      //   const item = data[targetIndex]
      //   if (item) {
      //     const itemMeta = this._owner.getFinalItemMeta(item);
      //     if (itemMeta && (itemMeta.recyclerType === this.recyclerType)) {
      //       arr.push({
      //         itemMeta,
      //         targetIndex,
      //       })

      //       continue
      //     }
      //   }
      //   // remove target index from position idx
      //   // this._bufferSet.remove(idx)
      // }
    }

    return arr;
  }
}

export default FixedBuffer;
