import {
  DEFAULT_LAYOUT,
  INITIAL_NUM_TO_RENDER,
  MAX_TO_RENDER_PER_BATCH,
  ON_END_REACHED_THRESHOLD,
  WINDOW_SIZE,
  RECYCLE_BUFFERED_COUNT,
} from './common';
import SelectValue, {
  selectHorizontalValue,
  selectVerticalValue,
} from '@x-oasis/select-value';
import { ContainerLayoutGetter, ItemLayout, FillingMode } from './types';

class BaseLayout {
  private _layout: ItemLayout = DEFAULT_LAYOUT;
  private _getContainerLayout?: ContainerLayoutGetter;
  private _horizontal: boolean;

  public id: string;
  public _selectValue: SelectValue;
  readonly _windowSize: number;
  readonly _maxToRenderPerBatch: number;
  private _initialNumToRender: number;
  private _persistanceIndices = [];
  private _stickyHeaderIndices = [];
  private _reservedIndices = [];
  private _recycleThreshold: number;
  readonly _onEndReachedThreshold: number;
  readonly _fillingMode: FillingMode;
  private _recycleBufferedCount: number;

  constructor(props: {
    id: string;
    horizontal?: boolean;
    getContainerLayout?: ContainerLayoutGetter;
    onEndReachedThreshold?: number;
    windowSize?: number;
    maxToRenderPerBatch?: number;
    initialNumToRender?: number;
    persistanceIndices?: Array<number>;
    stickyHeaderIndices?: Array<number>;

    recycleThreshold?: number;
    recycleBufferedCount?: number;
    recycleEnabled?: boolean;
  }) {
    const {
      id,
      recycleThreshold,
      persistanceIndices = [],
      recycleEnabled = false,
      horizontal = false,
      getContainerLayout,
      stickyHeaderIndices = [],
      windowSize = WINDOW_SIZE,
      recycleBufferedCount = RECYCLE_BUFFERED_COUNT,
      maxToRenderPerBatch = MAX_TO_RENDER_PER_BATCH,
      initialNumToRender = INITIAL_NUM_TO_RENDER,
      onEndReachedThreshold = ON_END_REACHED_THRESHOLD,
    } = props;

    this.id = id;
    this._horizontal = !!horizontal;
    this._selectValue = horizontal
      ? selectHorizontalValue
      : selectVerticalValue;
    this._getContainerLayout = getContainerLayout;
    this._windowSize = windowSize;
    this._fillingMode = recycleEnabled
      ? FillingMode.RECYCLE
      : FillingMode.SPACE;
    this._recycleThreshold = recycleEnabled
      ? recycleThreshold || maxToRenderPerBatch * 2
      : 0;
    this._recycleBufferedCount = recycleBufferedCount;
    this._stickyHeaderIndices = stickyHeaderIndices;
    this._maxToRenderPerBatch = maxToRenderPerBatch;
    this._initialNumToRender = initialNumToRender;
    this._onEndReachedThreshold = onEndReachedThreshold;
    this._recycleBufferedCount = recycleBufferedCount;
    this.persistanceIndices = persistanceIndices;
    this.stickyHeaderIndices = stickyHeaderIndices;
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

  updateReservedIndices() {
    const indices = new Set(
      [].concat(this.persistanceIndices, this.stickyHeaderIndices)
    );
    this._reservedIndices = Array.from(indices).sort((a, b) => a - b);
  }

  get persistanceIndices() {
    return this._persistanceIndices;
  }

  set persistanceIndices(indices: Array<number>) {
    this._persistanceIndices = indices.sort((a, b) => a - b);
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

  getHorizontal() {
    return this._horizontal;
  }

  get horizontal() {
    return this._horizontal;
  }

  get windowSize() {
    return this._windowSize;
  }

  get maxToRenderPerBatch() {
    return this._maxToRenderPerBatch;
  }

  get onEndReachedThreshold() {
    return this._onEndReachedThreshold;
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
    if (exclusive) return { minOffset, maxOffset };
    if (containerOffset > maxOffset) {
      return {
        minOffset: -1,
        maxOffset: -1,
      };
    }

    return {
      minOffset: Math.max(minOffset - containerOffset, 0),
      maxOffset: Math.max(maxOffset - containerOffset, 0),
    };
  }

  getContainerLayout() {
    if (typeof this._getContainerLayout === 'function')
      return this._getContainerLayout();
    if (this._layout) return this._layout;
    return null;
  }

  getLayout() {
    return this._layout;
  }

  setLayout(layout: ItemLayout) {
    this._layout = layout;
  }

  getContainerOffset() {
    const layout = this.getContainerLayout();
    if (!layout) return 0;
    return this._selectValue.selectOffset(layout);
  }

  /**
   *
   * @param layout container layout
   */
  setContainerLayout(layout: ItemLayout) {
    this._layout = layout;
  }

  getSelectValue() {
    return this._selectValue;
  }
}

export default BaseLayout;
