export const DEFAULT_ITEM_APPROXIMATE_LENGTH = 80;
export const DEFAULT_RECYCLER_TYPE = '__default_recycler_buffer__';
export const LAYOUT_EQUAL_CORRECTION_VALUE = 0.5;

export const isEmpty = (obj: any) => {
  if (Object.prototype.toString.call(obj) === '[object Object]') {
    return !Object.keys.length;
  }
  return true;
};

export const DISPATCH_METRICS_THRESHOLD = 16;
export const ON_END_REACHED_THRESHOLD = 2;
export const STILLNESS_THRESHOLD = 50;

export const buildStateTokenIndexKey = (startIndex: number, endIndex: number) =>
  `space_${startIndex}_${endIndex}`;
export const RECYCLER_BUFFER_SIZE = 40;
export const RECYCLER_RESERVED_BUFFER_PER_BATCH = 20;
export const INVALID_LENGTH = 'invalid_length';
