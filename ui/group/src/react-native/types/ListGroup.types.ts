// import { MutableRefObject } from 'react';
import type { RefObject } from 'react';
import type { ScrollView, View } from 'react-native';
import type { GenericItemT } from '@infinite-list/types';
import type { ListGroupProps as CommonListGroupProps } from '../../types';

// export type ScrollComponentUseMeasureLayout = (
//   itemRef: MutableRefObject<View | null>,
//   options: {
//     onLayout?: Function;
//     getCurrentKey?: () => string;
//     isIntervalTreeItem?: boolean;
//     onMeasureLayout?: Function;
//   }
// ) => {
//   handler: Function;
//   layoutHandler: (e: LayoutChangeEvent) => void;
// };

export type ContainerRef = RefObject<ScrollView | View | any>;

export type ListGroupProps<ItemT extends GenericItemT> =
  CommonListGroupProps<ItemT> & {
    containerRef: ContainerRef;
  };
