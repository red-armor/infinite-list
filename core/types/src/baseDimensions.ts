import type { GenericItemT } from './generic.types';

export type IBaseDimensions<ItemT extends GenericItemT = GenericItemT> = {
  /**
   *
   * @param key instance's key
   * @param exclusive default as false, if value is true, container offset
   *                  will not be included on calculating item offset.
   * @returns
   */
  getKeyItemOffset: (key: string, exclusive: boolean) => number;
};
