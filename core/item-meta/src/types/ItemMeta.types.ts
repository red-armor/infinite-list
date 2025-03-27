import type {
  IListDimensionsModel,
  ItemMetaOwner,
  ListGroupIndexInfo,
} from '@infinite-list/types';
import type { ItemLayout } from './BaseLayout.types';
import type { GenericItemT } from './generic.types';

export type StateEventListener = (eventValue?: boolean) => void;

export type ItemMetaStateEventHelperProps = {
  key: string;
  eventName: string;
  batchUpdateEnabled?: boolean;
  defaultValue: boolean;
  once?: boolean;
  canIUseRIC?: boolean;

  /**
   * for spawn
   */
  strictListenerKeyToHandleCountMap?: Record<string, number>;
};

export type ItemMetaState = Record<string, boolean>;

export type ItemMetaProps<ItemT extends GenericItemT = GenericItemT> = {
  /**
   * indicate including separatorLength on return item length
   */
  useSeparatorLength?: boolean;
  onViewable?: StateEventListener;
  onImpression?: StateEventListener;
  key: string;
  separatorLength?: number;
  layout?: ItemLayout;
  owner: ItemMetaOwner<ItemT>;
  isListItem?: boolean;
  setState?: Function;
  state?: ItemMetaState;
  isInitialItem?: boolean;
  canIUseRIC?: boolean;
  recyclerType?: string;
  ignoredToPerBatch?: boolean;

  spawnProps?: Record<string, ItemMetaStateEventHelperProps>;

  isApproximateLayout?: boolean;
};

export type ListIndexInfo<ItemT extends GenericItemT = GenericItemT> = {
  dimensions: IListDimensionsModel<ItemT>;
  index?: number;
};

export type IndexInfo<ItemT extends GenericItemT = GenericItemT> =
  | ListGroupIndexInfo<ItemT>
  | ListIndexInfo<ItemT>;
