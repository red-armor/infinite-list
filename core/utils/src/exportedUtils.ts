import type { GenericItemT } from '@infinite-list/types';

export type ItemPossibleT<T> =
  | T
  | {
      key: string;
    }
  | {
      id: string;
    };

export type ExtractKeyItem<T> = Extract<
  T,
  {
    key: string;
  }
>;

export type ExtractIdItem<T> = Extract<
  T,
  {
    id: string;
  }
>;

const isPresent = (v: any) => v != null;

export type IDefaultKeyExtra<ItemT extends GenericItemT = GenericItemT> = (
  item: ItemPossibleT<ItemT>,
  index?: number
) => string;

export const defaultKeyExtractor = <ItemT extends GenericItemT = GenericItemT>(
  item: ItemPossibleT<ItemT>,
  index?: number
) => {
  if (isPresent((item as ExtractKeyItem<ItemPossibleT<ItemT>>).key)) {
    return String((item as ExtractKeyItem<ItemPossibleT<ItemT>>).key);
  }
  if (isPresent((item as ExtractIdItem<ItemPossibleT<ItemT>>).id)) {
    return String((item as ExtractIdItem<ItemPossibleT<ItemT>>).id);
  }
  return `default_index_key_${index}`;
};
