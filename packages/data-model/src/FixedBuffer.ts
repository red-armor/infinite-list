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
};

class FixedBuffer {
  private _bufferSet = new IntegerBufferSet();
  private _size = 10;
  private _thresholdIndexValue = 0;

  constructor(props: FixedBufferProps) {
    this._size = props.size;
    this._thresholdIndexValue = props.thresholdIndexValue;
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
      safeRange: {
        startIndex: number;
        endIndex: number;
      };
      startIndex: number;
      maxCount: number;
      step: number;
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
}

export default FixedBuffer;
