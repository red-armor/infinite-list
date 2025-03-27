import { Container } from '@infinite-list/container';

import {
  INITIAL_NUM_TO_RENDER,
  ITEM_OFFSET_BEFORE_LAYOUT_READY,
  LENGTH_PRECISION,
  MAX_TO_RENDER_PER_BATCH,
  RECYCLER_RESERVED_BUFFER_PER_BATCH,
  WINDOW_SIZE,
} from './common';
import type { BaseLayoutProps, ItemLayout } from './types';
import { FillingMode } from './types';

abstract class BaseLayout extends Container {
  readonly _windowSize: number;
  readonly _maxToRenderPerBatch: number;
  private _initialNumToRender: number;
  private _persistenceIndices: number[] = [];
  private _stickyHeaderIndices: number[] = [];
  private _reservedIndices: number[] = [];
  private _recycleThreshold: number;
  readonly _fillingMode: FillingMode;
  readonly _lengthPrecision: number;
  private _recycleBufferedCount: number;
  private _itemOffsetBeforeLayoutReady: number;

  constructor(props: BaseLayoutProps) {
    super(props);
    const {
      recycleThreshold,
      persistenceIndices = [],
      recycleEnabled = false,
      stickyHeaderIndices = [],
      windowSize = WINDOW_SIZE,
      lengthPrecision = LENGTH_PRECISION,
      recycleBufferedCount = RECYCLER_RESERVED_BUFFER_PER_BATCH,
      maxToRenderPerBatch = MAX_TO_RENDER_PER_BATCH,
      initialNumToRender = INITIAL_NUM_TO_RENDER,
      itemOffsetBeforeLayoutReady = ITEM_OFFSET_BEFORE_LAYOUT_READY,
    } = props;

    this._windowSize = windowSize;
    this._fillingMode = recycleEnabled
      ? FillingMode.RECYCLE
      : FillingMode.SPACE;
    this._recycleThreshold = recycleEnabled
      ? recycleThreshold || maxToRenderPerBatch * 2
      : 0;

    // recycleBufferedCount should greater than 0.
    this._recycleBufferedCount = Math.max(recycleBufferedCount, 1);
    this._stickyHeaderIndices = stickyHeaderIndices;
    this._maxToRenderPerBatch = maxToRenderPerBatch;
    this._initialNumToRender = initialNumToRender;
    this.persistenceIndices = persistenceIndices;
    this.stickyHeaderIndices = stickyHeaderIndices;
    this._lengthPrecision = lengthPrecision;
    this._itemOffsetBeforeLayoutReady = itemOffsetBeforeLayoutReady;
  }

  get initialNumToRender() {
    return this._initialNumToRender;
  }

  set initialNumToRender(num: number) {
    this._initialNumToRender = num;
  }

  get reservedIndices() {
    return this._reservedIndices;
  }

  get recycleBufferedCount() {
    return this._recycleBufferedCount;
  }

  get itemOffsetBeforeLayoutReady() {
    return this._itemOffsetBeforeLayoutReady;
  }

  updateReservedIndices() {
    const indices = new Set(
      ([] as number[]).concat(this.persistenceIndices, this.stickyHeaderIndices)
    );
    this._reservedIndices = Array.from(indices).sort((a, b) => a - b);
  }

  get persistenceIndices() {
    return this._persistenceIndices;
  }

  set persistenceIndices(indices: Array<number>) {
    this._persistenceIndices = indices.sort((a, b) => a - b);
    this.updateReservedIndices();
  }

  get stickyHeaderIndices() {
    return this._stickyHeaderIndices;
  }

  set stickyHeaderIndices(indices: Array<number>) {
    this._stickyHeaderIndices = indices.sort((a, b) => a - b);
    this.updateReservedIndices();
  }

  get recycleThreshold() {
    return this._recycleThreshold;
  }

  get windowSize() {
    return this._windowSize;
  }

  get maxToRenderPerBatch() {
    return this._maxToRenderPerBatch;
  }

  get fillingMode() {
    return this._fillingMode;
  }

  /**
   *
   * @returns 3 -> 1, 4 -> 2, 5 -> 2, 6 -> 3
   */
  getBufferSize() {
    const size = Math.floor((this._windowSize - 1) / 2);
    return Math.max(size, 1);
  }

  /**
   *
   * @param minOffset
   * @param maxOffset
   * @param exclusive
   */
  resolveOffsetRange(
    minOffset: number,
    maxOffset: number,
    exclusive?: boolean
  ) {
    const containerOffset = this.getContainerOffset();

    if (!exclusive) return { minOffset, maxOffset };
    if (containerOffset > maxOffset) {
      return {
        minOffset: minOffset - containerOffset,
        maxOffset: maxOffset - containerOffset,
      };
    }

    return {
      minOffset: Math.max(minOffset - containerOffset, 0),
      maxOffset: Math.max(maxOffset - containerOffset, 0),
    };
  }

  normalizeLengthNumber(length: number) {
    return +length.toFixed(this._lengthPrecision);
  }

  normalizeLengthInfo(info: ItemLayout) {
    const { width, height, ...rest } = info;
    return {
      width: this.normalizeLengthNumber(width),
      height: this.normalizeLengthNumber(height),
      ...rest,
    };
  }
}

export default BaseLayout;
