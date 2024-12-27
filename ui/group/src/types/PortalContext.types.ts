import {
  GenericItemT,
  RecycleRecycleState,
  SpaceStateResult,
} from '@infinite-list/strategies';
import { PropsWithChildren, FC } from 'react';
import { ListGroupDimensions } from '@infinite-list/group-dimensions';
import { ItemMeta } from '@infinite-list/item-meta';
import { RenderItem } from './GroupListItemImpl.types';
import { TeleportItemProps } from './ListItem.types';

export type ExtraInfo<ItemT extends GenericItemT = GenericItemT> = {
  renderItem: RenderItem<ItemT>;
  teleportItemProps: TeleportItemProps<ItemT>;
};

export type RecycleContentItemWrapper<IStyle> = FC<
  PropsWithChildren<{
    style?: IStyle;
  }>
>;
export type SpaceRendererComponent<IStyle> = FC<
  PropsWithChildren<{
    style?: IStyle;
  }>
>;

export type PortalContextProps<
  IStyle,
  ItemT extends GenericItemT = GenericItemT
> = {
  id: string;
  horizontal?: boolean;
  listGroupDimensions: ListGroupDimensions<ItemT>;
  RecycleContentItemWrapper: RecycleContentItemWrapper<IStyle>;
  SpaceRendererComponent: SpaceRendererComponent<IStyle>;
};

export type GroupSpaceContentProps<
  IStyle,
  ItemT extends GenericItemT = GenericItemT
> = {
  state: SpaceStateResult<ItemT>;
  listKey: string;
  ownerId: string;
  dimensions: ListGroupDimensions<ItemT>;
  SpaceRendererComponent: SpaceRendererComponent<IStyle>;
};

export type GroupRecycleContentProps<
  IStyle,
  ItemT extends GenericItemT = GenericItemT
> = {
  state: RecycleRecycleState<ItemT>;
  listKey: string;
  ownerId: string;
  dimensions: ListGroupDimensions<ItemT>;
  RecycleContentItemWrapper: RecycleContentItemWrapper<IStyle>;
};

export type RecycleContentItem<
  IStyle,
  ItemT extends GenericItemT = GenericItemT
> = {
  listKey: string;
  itemMeta: ItemMeta<ItemT>;
  item: ItemT;
  offset: number;
  horizontal?: boolean;
  containerKey: string;
  renderItem: RenderItem<ItemT>;
  dimensions: ListGroupDimensions<ItemT>;
  RecycleContentItemWrapper: RecycleContentItemWrapper<IStyle>;
};
