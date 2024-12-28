import { GenericItemT } from '@infinite-list/types';

import {
  PortalContextProps as CommonPortalContextProps,
  GroupSpaceContentProps as CommonGroupSpaceContentProps,
  GroupRecycleContentProps as CommonGroupRecycleContentProps,
} from '../../types/PortalContext.types';

export type PortalContextProps<ItemT extends GenericItemT = GenericItemT> =
  CommonPortalContextProps<ItemT>;
export type GroupSpaceContentProps<ItemT extends GenericItemT = GenericItemT> =
  CommonGroupSpaceContentProps<ItemT>;
export type GroupRecycleContentProps<
  ItemT extends GenericItemT = GenericItemT
> = CommonGroupRecycleContentProps<ItemT>;
