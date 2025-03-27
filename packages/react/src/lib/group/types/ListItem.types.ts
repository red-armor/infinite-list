import type {
  GenericItemT,
  ItemMeta,
  ListDimensions,
  ListGroupDimensions,
} from '@infinite-list/data-model';
import type { CSSProperties, ForwardedRef } from 'react';
import type * as React from 'react';
import type { LayoutChangeEvent } from 'react-native';

import type { ScrollComponentUseMeasureLayout } from './ListGroup.types';

type OnLayout = (event: LayoutChangeEvent) => void;

export type DefaultItemT = GenericItemT;

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

  // listKey: string;
  itemKey: string;

  itemMeta: ItemMeta<ItemT>;

  dimensions: ListGroupDimensions<ItemT> | ListDimensions<ItemT>;

  withWrapper?: boolean;
  onLayout?: OnLayout;
  forwardRef?: ForwardedRef<any>;
  children?: React.ReactNode | undefined;

  onMeasureLayout?: OnMeasureLayout;

  measureLayoutHandlerOnDemand?: OnMeasureLayout;

  style?: CSSProperties;

  teleportItemProps?: TeleportItemProps;

  setMeasureLayoutHandler?: SetMeasureLayoutHandler;

  getMetaOnViewableItemsChanged?: GetMetaOnViewableItemsChanged;

  CellRendererComponent?: React.ComponentType<any> | undefined;

  containerKey?: string;

  scrollComponentUseMeasureLayout?: ScrollComponentUseMeasureLayout;
}
