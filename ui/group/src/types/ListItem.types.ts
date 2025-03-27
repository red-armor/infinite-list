import type { ListGroupDimensions } from '@infinite-list/group-dimensions';
import type { GenericItemT, ItemMeta } from '@infinite-list/item-meta';
import type { ListDimensions } from '@infinite-list/list-dimensions';
// import { ViewStyle, LayoutChangeEvent } from 'react-native';
import type { ItemLayout } from '@infinite-list/types';
import type { FC, ForwardedRef, PropsWithChildren } from 'react';
import type * as React from 'react';

// type OnLayout = (event: LayoutChangeEvent) => void;

export type DefaultItemT = GenericItemT;

type OnMeasureLayout =
  | ((x: number, y: number, width: number, height: number) => void)
  | null;

// type SetMeasureLayoutHandler = (handler: Function) => void;
// type GetMetaOnViewableItemsChanged = () => {
//   [key: string]: any;
// };

export type TeleportItemProps<ItemT extends GenericItemT> =
  | ((opts: { index: number; item: ItemT }) => Record<string, any>)
  | undefined;

export interface ListItemProps<ItemT extends GenericItemT> {
  item: ItemT;
  itemKey: string;
  itemMeta: ItemMeta<ItemT>;
  dimensions: ListGroupDimensions<ItemT> | ListDimensions<ItemT>;

  // onLayout?: OnLayout;
  forwardRef?: ForwardedRef<any>;
  children?: React.ReactNode | undefined;

  onMeasureLayout?: OnMeasureLayout;
  teleportItemProps?: TeleportItemProps<ItemT>;
  // CellRendererComponent?: React.ComponentType<any> | undefined;
  CellRendererComponent?: React.ComponentType<any> | undefined;
  ListItemWrapper: ListItemWrapper<ItemT>;
  recycleItemContainerKey: string;
}

export interface CompatListItemProps<ItemT extends GenericItemT>
  extends Omit<ListItemProps<ItemT>, 'ListItemWrapper'> {
  setDimensionItemLayout: (key: string, values: ItemLayout) => void;
  addItemChangedListener: (fn: Function) => void;
}

export type ListItemWrapper<ItemT extends GenericItemT> = FC<
  PropsWithChildren<CompatListItemProps<ItemT>>
>;
