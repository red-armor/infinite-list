import type { RefObject } from 'react';
import type { ScrollView } from 'react-native';
import type { GenericItemT } from '@infinite-list/types';
import type {
  ListProps as CommonListProps,
  RecycleItemProps as CommonRecycleItemProps,
  SpaceItemProps as CommonSpaceItemProps,
} from '../../types';

export type ScrollerRef = RefObject<ScrollView | null>;

export type ListProps<ItemT extends GenericItemT = GenericItemT> =
  CommonListProps<ItemT> & {
    scrollerRef: ScrollerRef;
  };

export type RecycleItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonRecycleItemProps<ItemT> & {
    scrollerRef: ScrollerRef;
  };

export type SpaceItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonSpaceItemProps<ItemT> & {
    scrollerRef: ScrollerRef;
  };
