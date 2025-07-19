import {
  IListDimensionsModel,
  ItemMetaOwner,
  ListGroupIndexInfo,
} from '@infinite-list/types';
import { ItemLayout } from './BaseLayout.types';
import { GenericItemT } from './generic.types';

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
  strictListenerKeyToHandleCountMap?: {
    [key: string]: number;
  };
};

export type ItemMetaState = {
  [key: string]: boolean;
};

export type ItemMetaProps<
  ItemT extends GenericItemT = GenericItemT,
  ExtraInfo extends object = any,
> = {
  /**
   * indicate including separatorLength on return item length
   */
  useSeparatorLength?: boolean;
  onViewable?: StateEventListener;
  onImpression?: StateEventListener;
  key: string;
  separatorLength?: number;
  layout?: ItemLayout;
  owner: ItemMetaOwner<ItemT, ExtraInfo>;
  isListItem?: boolean;
  setState?: () => void;
  state?: ItemMetaState;
  isInitialItem?: boolean;
  canIUseRIC?: boolean;
  recyclerType?: string;
  ignoredToPerBatch?: boolean;

  spawnProps?: {
    [key: string]: ItemMetaStateEventHelperProps;
  };

  isApproximateLayout?: boolean;
};

export type ListIndexInfo<ItemT extends GenericItemT = GenericItemT> = {
  dimensions: IListDimensionsModel<ItemT>;
  index?: number;
};

export type IndexInfo<ItemT extends GenericItemT = GenericItemT> =
  | ListGroupIndexInfo<ItemT>
  | ListIndexInfo<ItemT>;
