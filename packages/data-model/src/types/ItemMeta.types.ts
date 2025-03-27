import type Dimension from '../Dimension';
import type ItemsDimensions from '../ItemsDimensions';
import type ListDimensionsModel from '../ListDimensionsModel';
import type PseudoListDimensions from '../PseudoListDimensions';
import type { ItemLayout } from './BaseLayout.types';
import type { GenericItemT } from './generic.types';
import type { ListGroupIndexInfo } from './ListGroupDimensions.types';

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

export type ItemMetaOwner<ItemT extends GenericItemT = GenericItemT> =
  | ListDimensionsModel<ItemT>
  | Dimension<ItemT>
  | PseudoListDimensions
  | ItemsDimensions;

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
  dimensions: ListDimensionsModel<ItemT>;
  index?: number;
};

export type IndexInfo<ItemT extends GenericItemT = GenericItemT> =
  | ListGroupIndexInfo<ItemT>
  | ListIndexInfo<ItemT>;
