import { GenericItemT } from '@infinite-list/types';
import { PropsWithChildren } from 'react';
import { DimensionProps } from '@infinite-list/dimension';

export type GroupDimensionItemProps<ItemT extends GenericItemT> =
  PropsWithChildren<
    DimensionProps<ItemT> & {
      itemKey: string;
    }
  >;
