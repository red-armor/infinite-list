import {
  GenericItemT,
  RecycleRecycleState,
  SpaceStateResult,
} from '@infinite-list/strategies';
import { PropsWithChildren, FC } from 'react';
import { ListGroupDimensions } from '@infinite-list/group-dimensions';
import { ItemMeta } from '@infinite-list/item-meta';
import { RenderItem } from './GroupListItemImpl.types';
import { TeleportItemProps, ListItemWrapper } from './ListItem.types';

export type ExtraInfo<ItemT extends GenericItemT = GenericItemT> = {
  renderItem: RenderItem<ItemT>;
  teleportItemProps: TeleportItemProps<ItemT>;
};

export type RecycleContentItemWrapper = FC<
  PropsWithChildren<{
    style?: CompatStyle;
  }>
>;
export type SpaceRendererComponent = FC<
  PropsWithChildren<{
    style?: CompatStyle;
  }>
>;

export type PortalContextProps<ItemT extends GenericItemT = GenericItemT> = {
  id: string;
  horizontal?: boolean;
  listGroupDimensions: ListGroupDimensions<ItemT>;
  RecycleContentItemWrapper: RecycleContentItemWrapper;
  SpaceRendererComponent: SpaceRendererComponent;
  ListItemWrapper: ListItemWrapper<ItemT>;
};

export type GroupSpaceContentProps<ItemT extends GenericItemT = GenericItemT> =
  {
    state: SpaceStateResult<ItemT>;
    listKey: string;
    ownerId: string;
    dimensions: ListGroupDimensions<ItemT>;
    ListItemWrapper: ListItemWrapper<ItemT>;
    SpaceRendererComponent: SpaceRendererComponent;
  };

export type GroupRecycleContentProps<
  ItemT extends GenericItemT = GenericItemT
> = {
  state: RecycleRecycleState<ItemT>;
  listKey: string;
  ownerId: string;
  dimensions: ListGroupDimensions<ItemT>;
  RecycleContentItemWrapper: RecycleContentItemWrapper;
  ListItemWrapper: ListItemWrapper<ItemT>;
};

export type TRecycleContentItem<ItemT extends GenericItemT = GenericItemT> = {
  listKey: string;
  itemMeta: ItemMeta<ItemT>;
  item: ItemT;
  offset: number;
  horizontal?: boolean;
  recycleItemContainerKey: string;
  renderItem: RenderItem<ItemT>;
  dimensions: ListGroupDimensions<ItemT>;
  RecycleContentItemWrapper: RecycleContentItemWrapper;
  ListItemWrapper: ListItemWrapper<ItemT>;
};

export type CompatStyle = {
  position?: string;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  height?: number;
};
