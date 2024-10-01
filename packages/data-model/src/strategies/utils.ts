import { SpaceStateTokenPosition, SpaceStateToken } from '../types';
import isClamped from '@x-oasis/is-clamped';

export const createSpaceStateToken = <ItemT>(
  options?: Partial<SpaceStateToken<ItemT>>
) => {
  return {
    item: null,
    key: '',
    length: 0,
    isSpace: false,
    position: 'before' as SpaceStateTokenPosition,
    isSticky: false,
    isReserved: false,
    ...options,
  };
};

/**
 *
 * @param startIndex included
 * @param endIndex exclusive
 */
export const resolveToken = (props: {
  startIndex: number;
  endIndex: number;
  reservedIndices: number[];
  stickyHeaderIndices: number[];
  persistanceIndices: number[];
}) => {
  const {
    startIndex,
    endIndex,
    reservedIndices,
    stickyHeaderIndices,
    persistanceIndices,
  } = props;

  if (startIndex >= endIndex) return [];
  const createToken = (startIndex: number) => ({
    startIndex,
    endIndex: startIndex + 1,
    isSticky: false,
    isReserved: false,
    isSpace: true,
  });
  const tokens = [createToken(startIndex)];

  reservedIndices.forEach((index) => {
    const lastToken = tokens[tokens.length - 1];
    if (isClamped(startIndex, index, endIndex - 1)) {
      const isSticky = stickyHeaderIndices.indexOf(index) !== -1;
      const isReserved = persistanceIndices.indexOf(index) !== -1;
      if (lastToken.startIndex === index) {
        lastToken.isSticky = isSticky;
        lastToken.isReserved = isReserved;
        lastToken.isSpace = !isSticky && !isReserved;
        if (index + 1 !== endIndex) tokens.push(createToken(index + 1));
      } else {
        lastToken.endIndex = index;
        tokens.push({
          startIndex: index,
          endIndex: index + 1,
          isSticky,
          isReserved,
          isSpace: !isSticky && !isReserved,
        });
        if (index + 1 !== endIndex) tokens.push(createToken(index + 1));
      }
    }
  });

  const lastToken = tokens[tokens.length - 1];
  if (lastToken.endIndex !== endIndex) lastToken.endIndex = endIndex;

  return tokens;
};
