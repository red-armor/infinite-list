import { MutableRefObject } from 'react';
import { View, ScrollView, LayoutChangeEvent } from 'react-native';
import { GenericItemT } from '@infinite-list/types';
import { RefObject } from 'react';
import { ListGroupProps as CommonListGroupProps } from '../../types';

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

export type ListGroupProps<ItemT extends GenericItemT> =
  CommonListGroupProps<ItemT>;
