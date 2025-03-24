import { ComponentType, PropsWithChildren } from 'react';
import { RecyclerProps } from '@infinite-list/strategies';
import {
  GenericItemT,
  OnEndReachedHelperProps,
  OnViewableItemsChanged,
  ViewabilityConfig,
  ViewabilityConfigCallbackPairs,
} from '@infinite-list/viewable';

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
    persistenceIndices?: number[];

    scrollComponentContext?: any;
    GroupListSeparatorComponent?: ComponentType<ItemT> | null | undefined;
  } & OnEndReachedHelperProps &
    RecyclerProps
>;
