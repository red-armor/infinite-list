import { ItemMeta, GenericItemT } from '@infinite-list/item-meta';
import { ListGroupDimensions } from '@infinite-list/group-dimensions';
import { ListDimensions } from '@infinite-list/list-dimensions';
import React, { ForwardedRef } from 'react';
import { ViewStyle, LayoutChangeEvent } from 'react-native';
import { ScrollComponentUseMeasureLayout } from './ListGroup.types';

type OnLayout = (event: LayoutChangeEvent) => void;

export type DefaultItemT = GenericItemT;
// export type DefaultItemT = {
//   [key: string]: any;
// };

type OnMeasureLayout =
  | ((x: number, y: number, width: number, height: number) => void)
  | null;

type SetMeasureLayoutHandler = (handler: Function) => void;
type GetMetaOnViewableItemsChanged = () => {
  [key: string]: any;
};

export type TeleportItemProps =
  | ((opts: { index: number; item: any }) => {
      [key: string]: any;
    })
  | undefined;

export interface ListItemProps<ItemT extends DefaultItemT> {
  item: ItemT;

  listKey: string;

  itemMeta: ItemMeta;

  dimensions: ListGroupDimensions | ListDimensions;

  withWrapper?: boolean;
  onLayout?: OnLayout;
  forwardRef?: ForwardedRef<any>;
  children?: React.ReactNode | undefined;

  onMeasureLayout?: OnMeasureLayout;

  measureLayoutHandlerOnDemand?: OnMeasureLayout;

  style?: ViewStyle;

  teleportItemProps?: TeleportItemProps;

  setMeasureLayoutHandler?: SetMeasureLayoutHandler;

  getMetaOnViewableItemsChanged?: GetMetaOnViewableItemsChanged;

  CellRendererComponent?: React.ComponentType<any> | undefined;

  containerKey?: string;

  scrollComponentUseMeasureLayout: ScrollComponentUseMeasureLayout;
}
