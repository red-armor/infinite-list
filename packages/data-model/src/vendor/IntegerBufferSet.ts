// import invariant from 'invariant';
import Heap from '@x-oasis/heap';

type HeapItem = {
  position: number;
  value: number;
};

const defaultUseMinValueFn = (options: {
  safeRange: {
    lowValue: number;
    highValue: number;
  };
  bufferSetRange: {
    maxValue: number;
    minValue: number;
  };
  currentIndex: number;
}) => {
  const { safeRange, bufferSetRange } = options;
  const { lowValue, highValue } = safeRange;
  const { maxValue, minValue } = bufferSetRange;
  return lowValue - minValue > maxValue - highValue;
};

// Data structure that allows to store values and assign positions to them
// in a way to minimize changing positions of stored values when new ones are
// added or when some values are replaced. Stored elements are alwasy assigned
// a consecutive set of positoins startin from 0 up to count of elements less 1
// Following actions can be executed
// * get position assigned to given value (null if value is not stored)
// * create new entry for new value and get assigned position back
// * replace value that is furthest from specified value range with new value
//   and get it's position back
// All operations take amortized log(n) time where n is number of elements in
// the set.
class IntegerBufferSet {
  private _size: number;
  private _valueToPositionMap: {
    [key: string]: number;
  };
  private _smallValues: Heap<HeapItem>;
  private _largeValues: Heap<HeapItem>;
  private _vacantPositions: Array<number>;

  constructor() {
    this._valueToPositionMap = {};
    this._size = 0;
    this._smallValues = new Heap([], this._smallerComparator);
    this._largeValues = new Heap([], this._greaterComparator);

    this.getNewPositionForValue = this.getNewPositionForValue.bind(this);
    this.getValuePosition = this.getValuePosition.bind(this);
    this.getSize = this.getSize.bind(this);
    this.replaceFurthestValuePosition =
      this.replaceFurthestValuePosition.bind(this);

    this._vacantPositions = [];
  }

  getSize() {
    return this._size;
  }

  get indices() {
    const indices = [];
    for (const key in this._valueToPositionMap) {
      const value = this._valueToPositionMap[key];
      indices[value] = key;
    }
    return indices;
  }

  getValuePosition(value: number): null | number {
    if (this._valueToPositionMap[value] === undefined) {
      return null;
    }
    return this._valueToPositionMap[value];
  }

  getNewPositionForValue(value: number) {
    if (this._valueToPositionMap[value] !== undefined) {
      console.warn(
        "Shouldn't try to find new position for value already stored in BufferSet"
      );
    }
    // invariant(
    //   this._valueToPositionMap[value] === undefined,
    //   "Shouldn't try to find new position for value already stored in BufferSet"
    // );
    const newPosition = this._size;
    this._size++;
    this._pushToHeaps(newPosition, value);
    this._valueToPositionMap[value] = newPosition;
    return newPosition;
  }

  getMinValue() {
    return this._smallValues.peek()?.value;
  }

  getMaxValue() {
    return this._largeValues.peek()?.value;
  }

  setPositionValue(position: number, value: number) {
    const originalPosition = this._valueToPositionMap[value];
    if (originalPosition !== undefined) {
      const index = this._vacantPositions.findIndex(
        (v) => v === originalPosition
      );
      if (index === -1) this._vacantPositions.push(originalPosition);
      delete this._valueToPositionMap[value];
      this._valueToPositionMap[value] = position;
    }
  }

  replaceFurthestValuePosition(
    lowValue: number,
    highValue: number,
    newValue: number,
    useMinValueFn: (options: {
      safeRange: {
        lowValue: number;
        highValue: number;
      };
      bufferSetRange: {
        maxValue: number;
        minValue: number;
      };
      currentIndex: number;
    }) => boolean = defaultUseMinValueFn
  ): null | number {
    if (this._valueToPositionMap[newValue] !== undefined) {
      console.warn(
        "Shouldn't try to replace values with value already stored value in " +
          'BufferSet'
      );
    }
    // invariant(
    //   this._valueToPositionMap[newValue] === undefined,
    //   "Shouldn't try to replace values with value already stored value in " +
    //     'BufferSet'
    // );

    this._cleanHeaps();
    if (this._smallValues.empty() || this._largeValues.empty()) {
      // Threre are currently no values stored. We will have to create new
      // position for this value.
      return null;
    }

    if (this._vacantPositions.length) {
      const position = this._vacantPositions.pop();
      this._valueToPositionMap[newValue] = position;
      this._pushToHeaps(position, newValue);
      return position;
    }

    const minValue = this._smallValues.peek()!.value;
    const maxValue = this._largeValues.peek()!.value;
    if (minValue >= lowValue && maxValue <= highValue) {
      // All values currently stored are necessary, we can't reuse any of them.
      return null;
    }

    let valueToReplace;
    if (
      useMinValueFn({
        safeRange: {
          lowValue,
          highValue,
        },
        bufferSetRange: {
          minValue,
          maxValue,
        },
        currentIndex: newValue,
      })
    ) {
      // if (lowValue - minValue > maxValue - highValue) {
      // minValue is further from provided range. We will reuse it's position.
      valueToReplace = minValue;
      this._smallValues.pop();
    } else {
      valueToReplace = maxValue;
      this._largeValues.pop();
    }
    const position = this._valueToPositionMap[valueToReplace];
    delete this._valueToPositionMap[valueToReplace];
    this._valueToPositionMap[newValue] = position;
    this._pushToHeaps(position, newValue);

    const _i = this._vacantPositions.findIndex((v) => v === position);
    if (_i !== -1) this._vacantPositions.splice(_i, 1);

    return position;
  }

  _pushToHeaps(position: number, value: number) {
    const element = {
      position,
      value,
    };
    // We can reuse the same object in both heaps, because we don't mutate them
    this._smallValues.push(element);
    this._largeValues.push(element);
  }

  _cleanHeaps() {
    // We not usually only remove object from one heap while moving value.
    // Here we make sure that there is no stale data on top of heaps.
    this._cleanHeap(this._smallValues);
    this._cleanHeap(this._largeValues);
    const minHeapSize = Math.min(
      this._smallValues.size(),
      this._largeValues.size()
    );
    const maxHeapSize = Math.max(
      this._smallValues.size(),
      this._largeValues.size()
    );
    if (maxHeapSize > 10 * minHeapSize) {
      // There are many old values in one of heaps. We need to get rid of them
      // to not use too avoid memory leaks
      this._recreateHeaps();
    }
  }

  _recreateHeaps() {
    const sourceHeap =
      this._smallValues.size() < this._largeValues.size()
        ? this._smallValues
        : this._largeValues;
    const newSmallValues = new Heap<HeapItem>(
      [], // Initial data in the heap
      this._smallerComparator
    );
    const newLargeValues = new Heap<HeapItem>(
      [], // Initial datat in the heap
      this._greaterComparator
    );
    while (!sourceHeap.empty()) {
      const element = sourceHeap.pop()!;
      // Push all stil valid elements to new heaps
      if (this._valueToPositionMap[element.value] !== undefined) {
        newSmallValues.push(element);
        newLargeValues.push(element);
      }
    }
    this._smallValues = newSmallValues;
    this._largeValues = newLargeValues;
  }

  _cleanHeap(heap: Heap<HeapItem>) {
    while (
      !heap.empty() &&
      this._valueToPositionMap[heap.peek()!.value] === undefined
    ) {
      heap.pop();
    }
  }

  _smallerComparator(lhs: HeapItem, rhs: HeapItem) {
    return lhs.value < rhs.value;
  }

  _greaterComparator(lhs: HeapItem, rhs: HeapItem) {
    return lhs.value > rhs.value;
  }
}

export default IntegerBufferSet;
