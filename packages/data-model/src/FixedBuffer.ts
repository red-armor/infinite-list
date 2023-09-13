import IntegerBufferSet from '@x-oasis/integer-buffer-set';
import { SafeRange } from './types';

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

  startIndex: number;
  endIndex: number;
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
  private _indices: Array<number> = [];

  constructor(props: FixedBufferProps) {
    const { size, thresholdIndexValue } = props;
    this._size = props.size;
    this._thresholdIndexValue = props.thresholdIndexValue;
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

  place(index: number, safeRange: SafeRange) {
    const position = this.getPosition(
      index,
      safeRange.startIndex,
      safeRange.endIndex
    );
    if (position !== null) return (this._indices[position] = index);

    return false;
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
