import type { ListIndexInfo } from '@infinite-list/item-meta';

import type { GenericItemT } from './generic.types';

export interface DimensionsModelContainer<
  ItemT extends GenericItemT = GenericItemT,
> {
  /**
   *
   * @param itemKey
   * @param listKey
   * @returns
   *
   * used in ItemMeta to get
   */
  getFinalKeyIndexInfo: (
    itemKey: string,
    listKey: string
  ) => ListIndexInfo<ItemT>;

  onItemLayoutChanged: () => void;

  onDataSourceChanged: () => void;
}
