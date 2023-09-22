import { ItemLayout, ItemMetaOwner, ItemMetaState } from './Dimensions.types';

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

export type ItemMetaProps = {
  onViewable?: StateEventListener;
  onImpression?: StateEventListener;
  key: string;
  separatorLength?: number;
  layout?: ItemLayout;
  owner?: ItemMetaOwner;
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
};
