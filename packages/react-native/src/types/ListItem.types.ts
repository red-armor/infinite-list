import type {
  GenericItemT,
  ItemMeta,
  ListDimensions,
  ListGroupDimensions,
} from '@infinite-list/data-model';
import type { ForwardedRef } from 'react';
import type * as React from 'react';
import type { LayoutChangeEvent,ViewStyle } from 'react-native';

import type { ScrollComponentUseMeasureLayout } from './ListGroup.types';

type OnLayout = (event: LayoutChangeEvent) => void;

export type DefaultItemT = GenericItemT;
// export type DefaultItemT = {
//   [key: string]: any;
// };

type OnMeasureLayout =
  | ((x: number, y: number, width: number, height: number) => void)
  | null;

type SetMeasureLayoutHandler = (handler: Function) => void;
type GetMetaOnViewableItemsChanged = () => Record<string, any>;

export type TeleportItemProps =
  | ((opts: { index: number; item: any }) => Record<string, any>)
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
