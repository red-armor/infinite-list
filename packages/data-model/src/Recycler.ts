import FixedBuffer from './FixedBuffer';
import ListBaseDimensions from './ListBaseDimensions';
import {
  RECYCLER_BUFFER_SIZE,
  RECYCLER_THRESHOLD_INDEX_VALUE,
  RECYCLER_RESERVED_BUFFER_PER_BATCH,
  RECYCLER_RESERVED_BUFFER_SIZE_RATIO,
} from './common';
import { RecyclerProps } from './types';

class Recycler {
  private _owner: ListBaseDimensions;

  private _queue: Array<FixedBuffer> = [];

  /**
   * start index
   */
  private _thresholdIndexValue = 0;
  private _recyclerReservedBufferPerBatch: number;
  /**
   * buffer size, the oversize node will run into recycle strategy
   */
  private _recyclerBufferSize: number;
  private _recyclerReservedBufferSize: number;

  constructor(props: RecyclerProps) {
    const {
      owner,
      recyclerTypes = [],
      thresholdIndexValue = RECYCLER_THRESHOLD_INDEX_VALUE,
      recyclerBufferSize = RECYCLER_BUFFER_SIZE,
      recyclerReservedBufferPerBatch = RECYCLER_RESERVED_BUFFER_PER_BATCH,
    } = props;

    this._owner = owner;
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

  get recyclerReservedBufferPerBatch() {
    return this._recyclerReservedBufferPerBatch;
  }

  getIndices() {
    return this._queue.reduce((acc, cur) => acc.concat(cur.getIndices()), []);
  }

  addBuffer(type: string) {
    if (!type) return false
    const index = this._queue.findIndex(
      (buffer) => buffer.recyclerType === type
    );
    if (index !== -1) return false;
    const startIndex =
      (this._queue.length - 1) * this._recyclerReservedBufferSize;
    const buffer = new FixedBuffer({
      startIndex,
      recyclerType: type,
      size: this._recyclerBufferSize,
      thresholdIndexValue: this._thresholdIndexValue,
      recyclerReservedBufferSize: this._recyclerReservedBufferSize,
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
        const itemMeta = this._owner.getFinalIndexItemMeta(index);
        if (itemMeta) {
          const recyclerType = itemMeta.recyclerType;
          const buffer = this._queue.find(
            (_buffer) => _buffer.recyclerType === recyclerType
          );
          if (buffer) buffer.place(index, safeRange);
        }
      } else {
        break;
      }

      if (index >= this._thresholdIndexValue) {
        count++;
      }
    }
  }

  getMinValue() {
    let minValue = Number.MAX_SAFE_INTEGER;
    this._queue.forEach(
      (buffer) => {
        const v = buffer.getMinValue()
        if (typeof v === 'number') minValue = Math.min(v, minValue)
      }
    );
    return minValue;
  }

  getMaxValue() {
    let maxValue = 0;
    this._queue.forEach(
      (buffer) => {
        const v = buffer.getMaxValue()
        if (typeof v === 'number') maxValue = Math.max(v, maxValue)
      }
    );
    return maxValue;
  }
}

export default Recycler;
