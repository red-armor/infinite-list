import type { GenericItemT } from '@infinite-list/types';
import type {
  GroupRecycleContentProps as CommonGroupRecycleContentProps,
  GroupSpaceContentProps as CommonGroupSpaceContentProps,
  PortalContextProps as CommonPortalContextProps,
} from '../../types/PortalContext.types';

export type PortalContextProps<ItemT extends GenericItemT = GenericItemT> =
  CommonPortalContextProps<ItemT>;
export type GroupSpaceContentProps<ItemT extends GenericItemT = GenericItemT> =
  CommonGroupSpaceContentProps<ItemT>;
export type GroupRecycleContentProps<
  ItemT extends GenericItemT = GenericItemT,
> = CommonGroupRecycleContentProps<ItemT>;
