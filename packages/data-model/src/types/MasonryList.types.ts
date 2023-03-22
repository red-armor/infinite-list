import { ListStateResult } from './Dimensions.types';

export type MasonryListStateResult<ItemT extends {} = {}> = Array<
  ListStateResult<ItemT>
>;
