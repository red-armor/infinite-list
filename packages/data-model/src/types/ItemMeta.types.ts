import { ItemLayout } from './BaseLayout.types';
import ListDimensionsModel from '../ListDimensionsModel';
import Dimension from '../Dimension';
// import ItemsDimensions from '../ItemsDimensions';
// import PseudoListDimensions from '../PseudoListDimensions';
import { GenericItemT } from './generic.types';
// import ListGroupDimensions from '../ListGroupDimensions';

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
  // | ListGroupDimensions<ItemT>
  ListDimensionsModel<ItemT> | Dimension<ItemT>;
// | ItemsDimensions
// | PseudoListDimensions;

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
