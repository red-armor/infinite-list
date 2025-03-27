import type { GenericItemT } from '@infinite-list/item-meta';
import type { ForwardedRef, RefObject } from 'react';

import type {
  MasonryListProps as CommonMasonryListProps} from '../../types/masonryList';


export type ScrollerRef = RefObject<HTMLDivElement>;

export type MasonryListProps<ItemT extends GenericItemT = GenericItemT> =
  CommonMasonryListProps<ItemT> & {
    forwardRef?: ForwardedRef<HTMLDivElement>;
    scrollerRef?: ScrollerRef;
  };



export {ColumnDimensionInfo,ColumnStateRendererProps,RecycleItemProps, SpaceItemProps} from '../../types/masonryList';