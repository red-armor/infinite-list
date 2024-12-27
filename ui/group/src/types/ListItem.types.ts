import { ItemMeta, GenericItemT } from '@infinite-list/item-meta';
import { ListGroupDimensions } from '@infinite-list/group-dimensions';
import { ListDimensions } from '@infinite-list/list-dimensions';
import React, { CSSProperties, ForwardedRef } from 'react';
import { ViewStyle, LayoutChangeEvent } from 'react-native';

type OnLayout = (event: LayoutChangeEvent) => void;

export type DefaultItemT = GenericItemT;

type OnMeasureLayout =
  | ((x: number, y: number, width: number, height: number) => void)
  | null;

type SetMeasureLayoutHandler = (handler: Function) => void;
type GetMetaOnViewableItemsChanged = () => {
  [key: string]: any;
};

export type TeleportItemProps<ItemT extends DefaultItemT> =
  | ((opts: { index: number; item: ItemT }) => {
      [key: string]: any;
    })
  | undefined;

export interface ListItemProps<ItemT extends DefaultItemT> {
  item: ItemT;

  // listKey: string;
  itemKey: string;

  itemMeta: ItemMeta;

  dimensions: ListGroupDimensions<ItemT> | ListDimensions<ItemT>;

  withWrapper?: boolean;
  onLayout?: OnLayout;
  forwardRef?: ForwardedRef<any>;
  children?: React.ReactNode | undefined;

  onMeasureLayout?: OnMeasureLayout;

  measureLayoutHandlerOnDemand?: OnMeasureLayout;

  style?: ViewStyle | CSSProperties;

  teleportItemProps?: TeleportItemProps<ItemT>;

  setMeasureLayoutHandler?: SetMeasureLayoutHandler;

  getMetaOnViewableItemsChanged?: GetMetaOnViewableItemsChanged;

  CellRendererComponent?: React.ComponentType<any> | undefined;

  containerKey?: string;
}
