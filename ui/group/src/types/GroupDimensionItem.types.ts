import { PropsWithChildren } from 'react';
import { DimensionProps } from '@infinite-list/dimension';
import { GenericItemT } from '@infinite-list/types';

export type GroupDimensionItemProps<ItemT extends GenericItemT> =
  PropsWithChildren<
    DimensionProps<ItemT> & {
      itemKey: string;
    }
  >;
