// import { GetItemLayout, TeleportItemProps, ListProps } from '@infinite-list/data-model'

// export interface MasonryListProps<ItemT> extends ListProps<ItemT> {
//   id: string;
//   /** 每个 item 的高度	 */
//   getItemLayout: GetItemLayout<ItemT>;

//   /** 容器样式 */
//   contentContainerStyle?: ViewStyle;
//   /** list 样式 */
//   listContentContainerStyle?: ViewStyle;
//   getTeleportItemProps?: (column: number) => TeleportItemProps;

//   /** loading 态 */
//   loading?: boolean;
//   /** loading 容器样式	 */
//   loadingContainerStyle?: ViewStyle;
//   /** loading Lottie 样式	 */
//   loadingStyle?: ViewStyle;

//   /** 操作 MasonryList */
//   setHelper?: (helper: {
//     prepareRemoveItem: (itemKey: string) => void;
//     cancelRemoveItem: () => void;
//     confirmRemoveItem: (onItemRemoved: (newState: Array<any>) => void) => void;
//   }) => void;
//   removeItemSize?: number;
//   removeItemDuration?: number;

//   ghostOffsetY?: number;

//   dispatchMetricsThreshold?: number;

//   shouldSubListUseStaticLayout?: boolean;
// }

// export interface MasonryListState {
//   [key: string]: any;
// }

import {
  GenericItemT,
  RecycleStateToken,
  SpaceStateToken,
  MasonryDimension,
  MasonryColumnStateResults,
  MasonryDimensionsModelProps,
} from '@infinite-list/data-model';
import { RenderItem } from '../../types';

export type MasonryListProps<ItemT extends GenericItemT = GenericItemT> =
  MasonryDimensionsModelProps<ItemT> & {
    renderItem: RenderItem<ItemT>;
  };

export type ColumnStateRendererProps<
  ItemT extends GenericItemT = GenericItemT
> = Omit<MasonryListProps<ItemT>, 'column' | 'data'> & {
  columnIndex: number;
  dimensions: MasonryDimension<ItemT>;
  state: MasonryColumnStateResults<ItemT>;
};

export type RecycleItemProps<ItemT extends GenericItemT = GenericItemT> = {
  columnIndex: number;
  data: RecycleStateToken<ItemT>;
  renderItem: RenderItem<ItemT>;
  dimensions: MasonryDimension<ItemT>;
};

export type SpaceItemProps<ItemT extends GenericItemT = GenericItemT> = {
  columnIndex: number;
  data: SpaceStateToken<ItemT>;
  renderItem: RenderItem<ItemT>;
  dimensions: MasonryDimension<ItemT>;
};
