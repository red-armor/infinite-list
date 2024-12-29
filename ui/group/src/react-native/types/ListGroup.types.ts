import {
  OnEndReachedHelperProps,
  ViewabilityConfig,
  OnViewableItemsChanged,
  ViewabilityConfigCallbackPairs,
} from '@infinite-list/viewable';
import { ComponentType, PropsWithChildren, MutableRefObject } from 'react';
import { View, ScrollView, LayoutChangeEvent } from 'react-native';
import { GenericItemT } from '@infinite-list/item-meta';
import { RefObject } from 'react';

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

export type ContainerRef = RefObject<ScrollView | View | any>;

export type ListGroupProps<ItemT extends GenericItemT> = PropsWithChildren<{
  id: string;
  onViewableItemsChanged?: OnViewableItemsChanged;
  viewabilityConfig?: ViewabilityConfig;
  viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs;
  initialNumToRender?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  onRenderFinished?: () => void;
  persistanceIndices?: number[];

  scrollComponentContext: any;
  containerRef: ContainerRef;
  GroupListSeparatorComponent?: ComponentType<ItemT> | null | undefined;
}> &
  OnEndReachedHelperProps;
