import FixedBuffer from './FixedBuffer';
import {
  RECYCLER_BUFFER_SIZE,
  RECYCLER_THRESHOLD_INDEX_VALUE,
  RECYCLER_RESERVED_BUFFER_PER_BATCH,
  RECYCLER_RESERVED_BUFFER_SIZE_RATIO,
} from './common';
import { RecyclerProps } from './types';

class Recycler {
  private _queue: Array<FixedBuffer> = [];
  /**
   * buffer size, the oversize node will run into recycle strategy
   */
  private _size = 10;
  /**
   * start index
   */
  private _thresholdIndexValue = 0;
  private _recyclerReservedBufferPerBatch: number;
  private _recyclerBufferSize: number;
  private _recyclerReservedBufferSize: number;

  private _indices: Array<number> = [];

  constructor(props: RecyclerProps) {
    const {
      recyclerTypes = [],
      thresholdIndexValue = RECYCLER_THRESHOLD_INDEX_VALUE,
      recyclerBufferSize = RECYCLER_BUFFER_SIZE,
      recyclerReservedBufferPerBatch = RECYCLER_RESERVED_BUFFER_PER_BATCH,
    } = props;

    this._recyclerBufferSize = recyclerBufferSize;
    this._thresholdIndexValue = thresholdIndexValue;
    this._recyclerReservedBufferSize = Math.floor(
      recyclerBufferSize * RECYCLER_RESERVED_BUFFER_SIZE_RATIO
    );
    this._recyclerReservedBufferPerBatch = recyclerReservedBufferPerBatch;
    recyclerTypes.forEach((type) => this.addBuffer(type));
  }

  get thresholdIndexValue() {
    return this._thresholdIndexValue;
  }

  getIndices() {
    return this._indices.reduce((acc, cur) => acc.concat(cur), []);
  }

  addBuffer(type: string) {
    const index = this._queue.findIndex(
      (buffer) => buffer.recyclerType === type
    );
    if (index !== -1) return false;
    const startIndex =
      (this._queue.length - 1) * this._recyclerReservedBufferSize;
    const buffer = new FixedBuffer({
      size: this._size,
      thresholdIndexValue: this._thresholdIndexValue,
      recyclerType: type,
      startIndex,
      endIndex: startIndex + this._recyclerReservedBufferSize,
    });
    this._queue.push(buffer);
    return true;
  }

  updateIndices(props: {
    /**
     * index in range should not be recycled
     */
    safeRange: {
      startIndex: number;
      endIndex: number;
    };
    startIndex: number;
    maxCount: number;
    step: number;

    /** the max index value, always be the length of data */
    maxIndex: number;
  }) {
    const {
      startIndex: _startIndex,
      safeRange,
      step,
      maxCount,
      maxIndex,
    } = props;
    const startIndex = Math.max(_startIndex, 0);
    // let finalIndex = startIndex;
    let count = 0;
    if (maxCount < 0) return null;
    for (
      let index = startIndex;
      step > 0 ? index <= maxIndex : index >= 0;
      index += step
    ) {
      // itemLayout should not be a condition, may cause too many unLayout item
      if (count < maxCount) {
        const itemMeta = this.owner.getFinalIndexItemMeta(index);
        const recyclerType = itemMeta.recyclerType;
        const buffer = this._queue.find(
          (_buffer) => _buffer.recyclerType === recyclerType
        );
        if (buffer) buffer.place(index, safeRange);
      } else {
        break;
      }

      if (index >= this._thresholdIndexValue) {
        count++;
      }
    }
    // return finalIndex;
  }

  getMinValue() {
    let minValue = Number.MAX_SAFE_INTEGER;
    this._queue.forEach(
      (buffer) => (minValue = Math.min(buffer.getMinValue(), minValue))
    );
    return minValue;
  }

  getMaxValue() {
    let maxValue = 0;
    this._queue.forEach(
      (buffer) => (maxValue = Math.max(buffer.getMinValue(), maxValue))
    );
    return maxValue;
  }
}

export default Recycler;
