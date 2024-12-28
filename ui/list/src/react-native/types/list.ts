import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { GenericItemT } from '@infinite-list/types';
import {
  ListProps as CommonListProps,
  RecycleItemProps as CommonRecycleItemProps,
  SpaceItemProps as CommonSpaceItemProps,
} from '../../types';

export type ContainerRef = RefObject<ScrollView | View | any>;

export type ListProps<ItemT extends GenericItemT = GenericItemT> =
  CommonListProps<ItemT> & {
    containerRef: ContainerRef;
  };

export type RecycleItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonRecycleItemProps<ItemT> & {
    containerRef: ContainerRef;
  };

export type SpaceItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonSpaceItemProps<ItemT> & {
    containerRef: ContainerRef;
  };
