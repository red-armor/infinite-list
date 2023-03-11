import { ItemLayout } from './types';

export const noop = () => {};
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

export function layoutEqual(oldLayout: ItemLayout, newLayout: ItemLayout) {
  const oldLayoutType = Object.prototype.toString.call(oldLayout);
  const newLayoutType = Object.prototype.toString.call(newLayout);

  if (oldLayoutType === newLayoutType && newLayoutType === '[object Object]') {
    const keys = ['x', 'y', 'height', 'width'];
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      if (oldLayout[key] !== newLayout[key]) {
        return false;
      }
    }

    return true;
  }

  return false;
}

export function isClamped(min: number, value: number, max: number) {
  if (value >= min && value <= max) return true;
  return false;
}

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);
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

export const resolveChanged = <T extends {} = {}>(
  oldItems: Array<T> = [],
  newItems: Array<T> = [],
  _equal?: (a: T, b: T) => boolean
) => {
  const removed = [] as Array<T>;
  const added = [] as Array<T>;
  const equal = typeof _equal === 'function' ? _equal : (a, b) => a === b;

  for (let index = 0; index < oldItems.length; index++) {
    const current = oldItems[index];
    const findIndex = newItems.findIndex((item) => equal(item, current));
    if (findIndex === -1) {
      removed.push(current);
    }
  }

  for (let index = 0; index < newItems.length; index++) {
    const current = newItems[index];
    const findIndex = oldItems.findIndex((item) => equal(item, current));

    if (findIndex === -1) {
      added.push(current);
    }
  }

  return {
    removed,
    added,
    isEqual: !removed.length && !added.length,
  };
};

export const omit = (
  obj: {
    [key: string]: any;
  },
  keys: Array<string>
) => {
  if (Object.prototype.toString.call(obj) === '[object Object]') {
    return Object.keys(obj).reduce((acc, cur) => {
      if (keys.indexOf(cur) !== -1) return acc;
      acc[cur] = obj[cur];
      return acc;
    }, {});
  }

  return obj;
};

export const isNotEmpty = (obj: any) => {
  if (Object.prototype.toString.call(obj) === '[object Object]') {
    return !!Object.keys.length;
  }
  return false;
};

export const shallowArrayEqual = (a: Array<any>, b: Array<any>) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const len = a.length;
  for (let index = 0; index < len - 1; index++) {
    if (a[index] !== b[index]) return false;
  }

  return true;
};
