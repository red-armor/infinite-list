import { GenericItemT } from './generic.types';
import { ListIndexInfo } from './ItemMeta.types';

export interface DimensionsModelContainer<
  ItemT extends GenericItemT = GenericItemT
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
