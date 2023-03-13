export const DEFAULT_LAYOUT = {
  x: 0,
  y: 0,
  height: 0,
  width: 0,
};

export const ON_END_REACHED_TIMEOUT_THRESHOLD = 200;
export const INTERVAL_TREE_INITIAL_SIZE = 16;
export const ON_END_REACHED_HANDLER_TIMEOUT_THRESHOLD = 1000;

// 建议 ON_END_REACHED_THRESHOLD * VisibleLength > MAX_TO_RENDER_PER_BATCH * itemLength
// 这样可以在滚动停止的时候，自动获取一屏幕
export const ON_END_REACHED_THRESHOLD = 2;

export const WINDOW_SIZE = 5;
export const MAX_TO_RENDER_PER_BATCH = 10;
export const INITIAL_NUM_TO_RENDER = 0;

export const INVALID_LENGTH = 'invalid_length';

export const removeItemsKeyword = (configKey) =>
  (configKey.match(/(.*)[iI]tems/) || [])[1] || configKey;

// Pulled from react-compat
// https://github.com/developit/preact-compat/blob/7c5de00e7c85e2ffd011bf3af02899b63f699d3a/src/index.js#L349
export function shallowDiffers(prev: Object, next: Object): boolean {
  for (let attribute in prev) {
    if (!(attribute in next)) {
      return true;
    }
  }
  for (let attribute in next) {
    if (prev[attribute] !== next[attribute]) {
      return true;
    }
  }
  return false;
}

export const isNotEmpty = (obj: any) => {
  if (Object.prototype.toString.call(obj) === '[object Object]') {
    return !!Object.keys.length;
  }
  return false;
};
