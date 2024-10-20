// import { ListDimensionsModelContainer } from './ListDimensionsModel.types';
import { GenericItemT } from './generic.types';
import BaseImpl from '../strategies/BaseImpl';

export type BaseStateImplProps<ItemT extends GenericItemT = GenericItemT> = {
  listContainer: BaseImpl<ItemT>;
};

export type SpaceStateImplProps<ItemT extends GenericItemT = GenericItemT> =
  {} & BaseStateImplProps<ItemT>;

export type RecycleStateImplProps<ItemT extends GenericItemT = GenericItemT> = {
  recyclerTypes?: string[];
  recyclerBufferSize?: number;
  recyclerReservedBufferPerBatch?: number;

  onRecyclerProcess?: (type?: string, index?: number) => boolean;
} & BaseStateImplProps<ItemT>;

export type StateHubProps<ItemT extends GenericItemT = GenericItemT> = {
  recycleEnabled?: boolean;
} & RecycleStateImplProps<ItemT>;
