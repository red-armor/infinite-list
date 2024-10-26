import { GetItemLayout, TeleportItemProps, ListProps } from '@infinite-list/data-model'

export interface MasonryListProps<ItemT> extends ListProps<ItemT> {
  id: string;
  /** 每个 item 的高度	 */
  getItemLayout: GetItemLayout<ItemT>;

  /** 容器样式 */
  contentContainerStyle?: ViewStyle;
  /** list 样式 */
  listContentContainerStyle?: ViewStyle;
  getTeleportItemProps?: (column: number) => TeleportItemProps;

  /** loading 态 */
  loading?: boolean;
  /** loading 容器样式	 */
  loadingContainerStyle?: ViewStyle;
  /** loading Lottie 样式	 */
  loadingStyle?: ViewStyle;

  /** 操作 MasonryList */
  setHelper?: (helper: {
    prepareRemoveItem: (itemKey: string) => void;
    cancelRemoveItem: () => void;
    confirmRemoveItem: (onItemRemoved: (newState: Array<any>) => void) => void;
  }) => void;
  removeItemSize?: number;
  removeItemDuration?: number;

  ghostOffsetY?: number;

  dispatchMetricsThreshold?: number;

  shouldSubListUseStaticLayout?: boolean;
}

export interface MasonryListState {
  [key: string]: any;
}
