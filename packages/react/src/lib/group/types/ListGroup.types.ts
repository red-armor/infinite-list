import type {
  GenericItemT,
  OnEndReachedHelperProps,
  OnViewableItemsChanged,
  ViewabilityConfig,
  ViewabilityConfigCallbackPairs,
} from '@infinite-list/data-model';
import type { ComponentType, MutableRefObject,PropsWithChildren } from 'react';
import type { LayoutChangeEvent,View } from 'react-native';

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
