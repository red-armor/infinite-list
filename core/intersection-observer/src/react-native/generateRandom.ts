export type SeenKeys = Record<string, boolean>;

const seenKeys: SeenKeys = {};
const MULTIPLIER = Math.pow(2, 24);

export const generateRandomKey = (prefix = '') => {
  let key;

  while (
    key === undefined ||
    typeof seenKeys[key] === 'boolean' ||
    !isNaN(+key)
  ) {
    key = Math.floor(Math.random() * MULTIPLIER).toString(32);
  }

  const nextKey = `${prefix}${key}`;

  seenKeys[nextKey] = true;
  return nextKey;
};
