import { ItemLayout } from './BaseLayout.types';
import { GenericItemT } from './generic.types';

// import ListDimensionsModel from '../ListDimensionsModel';
// import Dimension from '../Dimension';
// import { ListGroupIndexInfo } from './ListGroupDimensions.types';
// import PseudoListDimensions from '../PseudoListDimensions';
// import ItemsDimensions from '../ItemsDimensions';

// [TODO]
type ListDimensionsModel = any;
export type Dimension = any;
type ListGroupIndexInfo = any;
type PseudoListDimensions = any;
type ItemsDimensions = any;

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

export type ItemMetaOwner<ItemT extends GenericItemT = GenericItemT> =
  // @ts-ignore [TODO]
  | ListDimensionsModel<ItemT>
  // @ts-ignore [TODO]
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

  spawnProps?: {
    [key: string]: ItemMetaStateEventHelperProps;
  };

  isApproximateLayout?: boolean;
};

export type ListIndexInfo<ItemT extends GenericItemT = GenericItemT> = {
  // @ts-ignore [TODO]
  dimensions: ListDimensionsModel<ItemT>;
  index?: number;
};

export type IndexInfo<ItemT extends GenericItemT = GenericItemT> =
  // @ts-ignore [TODO]
  ListGroupIndexInfo<ItemT> | ListIndexInfo<ItemT>;
