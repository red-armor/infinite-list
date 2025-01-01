import { RefObject } from 'react';
import { GenericItemT } from '@infinite-list/types';
import {
  ListProps as CommonListProps,
  RecycleItemProps as CommonRecycleItemProps,
  SpaceItemProps as CommonSpaceItemProps,
} from '../../types';

export type ScrollerRef = RefObject<HTMLDivElement>;

export type ListProps<ItemT extends GenericItemT = GenericItemT> =
  CommonListProps<ItemT> & {
    scrollerRef?: ScrollerRef;
  };

export type RecycleItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonRecycleItemProps<ItemT> & {
    scrollerRef?: ScrollerRef;
  };

export type SpaceItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonSpaceItemProps<ItemT> & {
    scrollerRef?: ScrollerRef;
  };
