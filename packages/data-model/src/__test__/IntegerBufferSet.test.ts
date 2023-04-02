import IntegerBufferSet from '../struct/IntegerBufferSet';
import { describe, it, expect } from 'vitest';

describe('basic', () => {
  it('constructor', () => {
    const bufferSet = new IntegerBufferSet();
    expect(bufferSet.getSize()).toBe(0);
    const value = bufferSet.replaceFurthestValuePosition(0, 10, 0);
    if (!value) {
      const position = bufferSet.getNewPositionForValue(0);
      console.log('position ', position);
    }

    const value2 = bufferSet.replaceFurthestValuePosition(0, 10, 1);

    if (!value2) {
      const position = bufferSet.getNewPositionForValue(1);
      console.log('position 2', position);
    }

    bufferSet.getNewPositionForValue(2);
    bufferSet.getNewPositionForValue(3);
    bufferSet.getNewPositionForValue(4);
    bufferSet.getNewPositionForValue(5);
    bufferSet.getNewPositionForValue(6);
    bufferSet.getNewPositionForValue(7);
    bufferSet.getNewPositionForValue(8);
    bufferSet.getNewPositionForValue(9);
    bufferSet.getNewPositionForValue(10);
    bufferSet.getNewPositionForValue(11);
    bufferSet.getNewPositionForValue(12);
    bufferSet.getNewPositionForValue(13);

    console.log('bufferSet position ', bufferSet.getValuePosition(10));

    const position = bufferSet.replaceFurthestValuePosition(7, 15, 14);
    console.log('positions ', position);

    const position2 = bufferSet.replaceFurthestValuePosition(15, 20, 16);
    bufferSet.replaceFurthestValuePosition(15, 20, 17);
    bufferSet.replaceFurthestValuePosition(15, 20, 18);
    bufferSet.replaceFurthestValuePosition(15, 20, 19);
    bufferSet.replaceFurthestValuePosition(15, 20, 20);
    bufferSet.replaceFurthestValuePosition(20, 25, 21);
    bufferSet.replaceFurthestValuePosition(20, 25, 22);
    bufferSet.replaceFurthestValuePosition(20, 25, 23);
    bufferSet.replaceFurthestValuePosition(20, 25, 24);
    bufferSet.replaceFurthestValuePosition(20, 25, 25);
    console.log('positions ', position2);

    // @ts-ignore
    console.log('buffer._valueToPositionMap ', bufferSet._valueToPositionMap);
    // @ts-ignore
    console.log('buffer small ', bufferSet._smallValues);
    // @ts-ignore
    console.log('buffer large - ', bufferSet._largeValues);
    console.log('value ', value2);

    console.log('========================');

    bufferSet.replaceFurthestValuePosition(5, 15, 5);
    bufferSet.replaceFurthestValuePosition(5, 15, 6);
    bufferSet.replaceFurthestValuePosition(5, 15, 7);

    console.log('positions ', position2);

    // @ts-ignore
    console.log('buffer._valueToPositionMap ', bufferSet._valueToPositionMap);
    // @ts-ignore
    console.log('buffer small ', bufferSet._smallValues);
    // @ts-ignore
    console.log('buffer large - ', bufferSet._largeValues);
    console.log('value ', value2);
  });
});
