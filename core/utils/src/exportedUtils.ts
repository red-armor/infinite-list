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

const isPresent = (v: any) => typeof v !== 'undefined';

export const defaultKeyExtractor = <T>(
  item: ItemPossibleT<T>,
  index: number
) => {
  if (isPresent((item as ExtractKeyItem<ItemPossibleT<T>>).key)) {
    return String((item as ExtractKeyItem<ItemPossibleT<T>>).key);
  }
  if (isPresent((item as ExtractIdItem<ItemPossibleT<T>>).id)) {
    return String((item as ExtractIdItem<ItemPossibleT<T>>).id);
  }
  return `default_index_key_${index}`;
};
