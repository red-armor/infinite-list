import {
  OnEndReachedHelperProps,
  ViewabilityConfig,
  OnViewableItemsChanged,
  ViewabilityConfigCallbackPairs,
  GenericItemT,
} from '@infinite-list/viewable';
import { ComponentType, PropsWithChildren } from 'react';
import { RecyclerProps } from '@infinite-list/strategies';

export type ListGroupProps<ItemT extends GenericItemT> = PropsWithChildren<
  {
    id: string;
    horizontal?: boolean;
    onViewableItemsChanged?: OnViewableItemsChanged;
    viewabilityConfig?: ViewabilityConfig;
    viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs;
    initialNumToRender?: number;
    windowSize?: number;
    maxToRenderPerBatch?: number;
    onRenderFinished?: () => void;
    persistanceIndices?: number[];

    scrollComponentContext?: any;
    GroupListSeparatorComponent?: ComponentType<ItemT> | null | undefined;
  } & OnEndReachedHelperProps &
    RecyclerProps
>;
