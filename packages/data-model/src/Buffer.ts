import isClamped from '@x-oasis/is-clamped';

class Buffer {
  private _queue: Array<{
    createdAt: number;
    index: number;
  }>;

  private limit: number;

  constructor() {
    this._queue = [];
    this.limit = 14;
  }

  getPosition(index: number, startIndex: number, endIndex: number) {
    const _i = this._queue.findIndex((v) => v.index === index);
    if (_i !== -1) return _i;

    if (this._queue.length < this.limit) {
      this._queue.push({
        index,
        createdAt: Date.now(),
      });
      return this._queue.length - 1;
    }

    const next = this._queue.slice();
    next.sort((a, b) => a.createdAt - b.createdAt);

    for (let idx = 0; idx < next.length; idx++) {
      const _index = next[idx].index;
      if (isClamped(startIndex, _index, endIndex)) {
        continue;
      }
      const nextIndex = this._queue.findIndex((t) => t === next[idx]);
      this._queue[nextIndex] = {
        index,
        createdAt: Date.now(),
      };
      return nextIndex;
    }

    return -1;
  }

  getIndices() {
    return this._queue.map((v) => v.index);
  }

  getMinValue() {
    const next = this._queue.slice();
    next.sort((a, b) => a.index - b.index);
    if (next.length) return next[0].index;
    return null;
  }

  getMaxValue() {
    const next = this._queue.slice();
    next.sort((a, b) => b.index - a.index);
    if (next.length) return next[0].index;
    return null;
  }
}

export default Buffer;
