// import invariant from 'invariant';

const parent = (node: number) => Math.floor(node / 2);

const createArray = function (size: number) {
  const xs = [];
  for (let i = size - 1; i >= 0; --i) {
    xs[i] = 0;
  }
  return xs;
};

/**
 * Computes the next power of 2 after or equal to x.
 */
function ceilLog2(x: number) {
  let y = 1;
  while (y < x) {
    y *= 2;
  }

  return y;
}

/**
 * A prefix interval tree stores an numeric array and the partial sums of that
 * array. It is optimized for updating the values of the array without
 * recomputing all of the partial sums.
 *
 *   - O(ln n) update
 *   - O(1) lookup
 *   - O(ln n) compute a partial sum
 *   - O(n) space
 *
 * Note that the sequence of partial sums is one longer than the array, so that
 * the first partial sum is always 0, and the last partial sum is the sum of the
 * entire array.
 */
class PrefixIntervalTree {
  private _size: number;
  /**
   * Half the size of the heap. It is also the number of non-leaf nodes, and the
   * index of the first element in the heap. Always a power of 2.
   */
  private _half: number;
  private _heap: number[];

  private _maxUsefulLength: number;

  private _onUpdateItemLayout: Function;
  private _onUpdateIntervalTree: Function;

  constructor(
    xs: number[] | number,
    opts?: {
      onUpdateItemLayout?: Function;
      onUpdateIntervalTree?: Function;
    }
  ) {
    if (typeof xs === 'number') this.initWithNumber(xs);
    if (Array.isArray(xs)) this.initWithArray(xs);

    const { onUpdateItemLayout, onUpdateIntervalTree } = opts || {};
    this._onUpdateIntervalTree = onUpdateIntervalTree;
    this._onUpdateItemLayout = onUpdateItemLayout;
  }

  initWithNumber(length: number) {
    this._half = ceilLog2(length);
    this._size = this._half;
    this._heap = createArray(2 * this._half);
    this._maxUsefulLength = 0;
  }

  initWithArray(arr: number[]) {
    this._half = ceilLog2(arr.length);
    this._size = this._half;
    this._heap = createArray(2 * this._half);
    // this._maxUsefulLength = arr.length;
    let i;
    for (i = 0; i < this._size; ++i) {
      this._heap[this._half + i] = arr[i];
    }

    for (i = this._half - 1; i > 0; --i) {
      this._heap[i] = this._heap[2 * i] + this._heap[2 * i + 1];
    }
  }

  static uniform(size: number, initialValue: number) {
    const xs = [];
    for (let i = size - 1; i >= 0; --i) {
      xs[i] = initialValue;
    }

    return new PrefixIntervalTree(xs);
  }

  static empty(size: number) {
    return PrefixIntervalTree.uniform(size, 0);
  }

  stretch() {
    const nextHeap = createArray(2 * this._half * 2);
    const nextHeapHalf = this._half * 2;

    // copy old value to new one
    for (let i = 0; i < this._size; i++) {
      nextHeap[nextHeapHalf + i] = this._heap[this._half + i] || 0;
    }

    // sum old value to create new sum value
    for (let i = nextHeapHalf - 1; i > 0; i--) {
      nextHeap[i] = nextHeap[2 * i] + nextHeap[2 * i + 1];
    }

    this._half = nextHeapHalf;
    this._size = nextHeapHalf;
    this._heap = nextHeap;
  }

  remove(index: number) {
    if (index > this._size) return false;
    const nextHeap = createArray(this._half * 2);

    for (let i = 0; i < this._size; i++) {
      let step = 0;
      if (index === i) {
        step = 1;
        continue;
      }
      nextHeap[this._half + i - step] = this._heap[this._half + i] || 0;
    }

    for (let i = this._half - 1; i > 0; i--) {
      nextHeap[i] = nextHeap[2 * i] + nextHeap[2 * i + 1];
    }

    this._heap = nextHeap;

    this._maxUsefulLength = Math.max(0, this._maxUsefulLength - 1);

    return true;
  }

  set(index: number, value: number) {
    // if typeof index === 'undefined', then it will go into looooooooop
    if (typeof index !== 'number') return;
    if (isNaN(index)) {
      console.warn('Passing a NaN value as interval tree index');
      return;
    }

    while (index >= this._half) {
      this.stretch();
    }

    let node = this._half + index;
    this._heap[node] = value;

    node = parent(node);
    for (; node !== 0; node = parent(node)) {
      this._heap[node] = this._heap[2 * node] + this._heap[2 * node + 1];
    }

    if (index + 1 > this._maxUsefulLength) {
      this._maxUsefulLength = index + 1;
    }

    if (typeof this._onUpdateIntervalTree === 'function') {
      this._onUpdateIntervalTree(this._heap);
    }

    if (typeof this._onUpdateItemLayout === 'function') {
      this._onUpdateItemLayout(index, value);
    }
  }

  getMaxUsefulLength() {
    return this._maxUsefulLength;
  }

  get(index: number) {
    // invariant(index >= 0 && index < this._size, 'Index out of range %s', index);

    const node = this._half + index;
    return this._heap[node];
  }

  getSize() {
    return this._size;
  }

  getHalf() {
    return this._half;
  }

  getHeap() {
    return this._heap;
  }

  getMaxValue() {
    return this._heap[1];
  }

  /**
   * Returns the sum get(0) + get(1) + ... + get(end - 1).
   */
  sumUntil(end: number) {
    // invariant(end >= 0 && end < this._size + 1, 'Index out of range %s', end);

    if (end === 0) {
      return 0;
    }

    let node = this._half + end - 1;
    let sum = this._heap[node];

    for (; node !== 1; node = parent(node)) {
      if (node % 2 === 1) {
        sum += this._heap[node - 1];
      }
    }

    return sum;
  }

  /**
   * Returns the sum get(0) + get(1) + ... + get(inclusiveEnd).
   */
  sumTo(inclusiveEnd: number) {
    // invariant(
    //   inclusiveEnd >= 0 && inclusiveEnd < this._size,
    //   'Index out of range %s',
    //   inclusiveEnd
    // );
    return this.sumUntil(inclusiveEnd + 1);
  }

  /**
   * Returns the sum get(begin) + get(begin + 1) + ... + get(end - 1).
   */
  sum(begin: number, end: number) {
    // invariant(begin <= end, 'Begin must precede end');
    return this.sumUntil(end) - this.sumUntil(begin);
  }

  /**
   * Returns the smallest i such that 0 <= i <= size and sumUntil(i) <= t, or
   * -1 if no such i exists.
   */
  greatestLowerBound(t: number) {
    if (t < 0) {
      return -1;
    }

    let node = 1;
    if (this._heap[node] < t) {
      // not use this._size；this._size always be a big value
      return Math.max(this._maxUsefulLength - 1, 0);
    }

    // 这种写法的结果就是，如果中间一个item的length为0的话，那么它会一直往右边查；
    // 比如初始化的时候是[0, 0, 0, 0, 0, 0, 0, 0]；
    // 你会发现node最后会是7，this._half为4；最终即使data没有数据，那么它的index算出来的也是
    // 7 - 4 = 3；所以，考虑到会存在一些item length为0的情况，所以，这个其实是比较合理的方式，
    // 拿右边的
    while (node < this._half) {
      const leftSum = this._heap[2 * node];
      if (t < leftSum) {
        node = 2 * node;
      } else {
        node = 2 * node + 1;
        t -= leftSum;
      }
    }
    return Math.min(node - this._half, this._maxUsefulLength - 1);
  }

  /**
   * Returns the smallest i such that 0 <= i <= size and sumUntil(i) < t, or
   * -1 if no such i exists.
   */
  greatestStrictLowerBound(t: number) {
    if (t <= 0) {
      return -1;
    }

    let node = 1;
    if (this._heap[node] < t) {
      return Math.max(this._maxUsefulLength - 1, 0);
    }

    while (node < this._half) {
      const leftSum = this._heap[2 * node];
      if (t <= leftSum) {
        node = 2 * node;
      } else {
        node = 2 * node + 1;
        t -= leftSum;
      }
    }

    return Math.min(node - this._half, this._maxUsefulLength - 1);
  }

  computeRange(minOffset: number, maxOffset: number) {
    if (this.getHeap()[1] < minOffset) {
      return {
        startIndex: this._maxUsefulLength - 1,
        endIndex: this._maxUsefulLength - 1,
      };
    }
    const startIndex = this.leastStrictUpperBound(minOffset);
    // end的话，需要把index + 1，这样才能够把自个也加进去
    const endIndex = Math.min(
      this.greatestStrictLowerBound(maxOffset),
      Math.max(this._maxUsefulLength - 1, 0)
    );

    return {
      startIndex: endIndex >= 0 ? Math.max(startIndex, 0) : -1,
      endIndex,
    };
  }

  /**
   * Returns the smallest i such that 0 <= i <= size and t <= sumUntil(i), or
   * size + 1 if no such i exists.
   */
  leastUpperBound(t: number) {
    return this.greatestLowerBound(t) + 1;
  }

  /**
   * Returns the smallest i such that 0 <= i <= size and t < sumUntil(i), or
   * size + 1 if no such i exists.
   */
  leastStrictUpperBound(t: number) {
    return this.greatestStrictLowerBound(t);
  }
}

export default PrefixIntervalTree;
