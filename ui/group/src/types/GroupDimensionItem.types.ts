import type { DimensionProps } from '@infinite-list/dimension';
import type { GenericItemT } from '@infinite-list/types';
import type { PropsWithChildren } from 'react';

export type GroupDimensionItemProps<ItemT extends GenericItemT> =
  PropsWithChildren<
    DimensionProps<ItemT> & {
      itemKey: string;
    }
  >;
