import {
  OnEndReachedHelperProps,
  ViewabilityConfig,
  OnViewableItemsChanged,
  ViewabilityConfigCallbackPairs,
  GenericItemT,
} from '@infinite-list/viewable';
import { ComponentType, PropsWithChildren, MutableRefObject } from 'react';
import { View, LayoutChangeEvent } from 'react-native';

export type ScrollComponentUseMeasureLayout = (
  itemRef: MutableRefObject<View | null>,
  options: {
    onLayout?: Function;
    getCurrentKey?: () => string;
    isIntervalTreeItem?: boolean;
    onMeasureLayout?: Function;
  }
) => {
  handler: Function;
  layoutHandler: (e: LayoutChangeEvent) => void;
};

export type ListGroupProps<ItemT extends GenericItemT> = PropsWithChildren<{
  GroupListSeparatorComponent?: ComponentType<ItemT> | null | undefined;
  id: string;
  onViewableItemsChanged?: OnViewableItemsChanged;
  viewabilityConfig?: ViewabilityConfig;
  viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs;
  initialNumToRender?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  onRenderFinished?: () => void;
  persistanceIndices?: number[];

  scrollComponentContext?: any;
  scrollComponentUseMeasureLayout?: ScrollComponentUseMeasureLayout;
}> &
  OnEndReachedHelperProps;
