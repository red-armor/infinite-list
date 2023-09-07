import IntegerBufferSet from '@x-oasis/integer-buffer-set';

type FixedBufferProps = {
  /**
   * index which start to replace
   */
  thresholdIndexValue: number;
  /**
   * max size
   */
  size: number;

  recyclerType: string;
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
  private _startIndex: number;
  private _endIndex: number;
  private _recyclerType: string;

  constructor(props: FixedBufferProps) {
    this._size = props.size;
    this._thresholdIndexValue = props.thresholdIndexValue;
  }

  get thresholdIndexValue() {
    return this._thresholdIndexValue
  }

  get recyclerType() {
    return this._recyclerType
  }

  getPosition(rowIndex: number, startIndex: number, endIndex: number) {
    if (rowIndex < 0) return null;
    // 初始化的item不参与absolute替换
    if (rowIndex < this._thresholdIndexValue) return null;
    let position = this._bufferSet.getValuePosition(rowIndex);

    if (position === null && this._bufferSet.getSize() >= this._size) {
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

  updateIndices(
    targetIndices: Array<number>,
    props: {
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
    }
  ) {
    const {
      startIndex: _startIndex,
      safeRange,
      step,
      maxCount,
      maxIndex,
    } = props;
    const startIndex = Math.max(_startIndex, 0);
    let finalIndex = startIndex;
    let count = 0;
    if (maxCount < 0) return finalIndex;
    for (
      let index = startIndex;
      step > 0 ? index <= maxIndex : index >= 0;
      index += step
    ) {
      // itemLayout should not be a condition, may cause too many unLayout item
      if (count < maxCount) {
        const position = this.getPosition(
          index,
          safeRange.startIndex,
          safeRange.endIndex
        );

        finalIndex = index;
        if (position !== null) targetIndices[position] = index;
      } else {
        break;
      }

      if (index >= this._thresholdIndexValue) {
        count++;
      }
    }
    return finalIndex;
  }

  getMaxValue() {
    return this._bufferSet.getMaxValue();
  }

  getMinValue() {
    return this._bufferSet.getMinValue();
  }

  getIndices() {
    return this._bufferSet.indices;
  }
}

export default FixedBuffer;
