import ItemMeta from '../ItemMeta';

export type CommonViewabilityConfig = {
  viewport?: number;
  minimumViewTime?: number;
  waitForInteraction?: boolean;
  impression?: boolean;

  // 目前主要用在比如只希望有一个曝光出来；比如viewport中可以
  // 放置两个item的时候，而item两个都是
  exclusive?: boolean;
};

export type ViewabilityConfigTuple = {
  configMap: {
    [key: string]: ViewabilityConfig;
  };
  changed: {
    [key: string]: Array<ItemMeta>;
  };
  callbackMap: {
    [key: string]: Function;
  };
  primary: boolean;
};

export type ViewAreaModeConfig = {
  viewAreaCoveragePercentThreshold: number;
} & CommonViewabilityConfig;

export type VisiblePercentModeConfig = {
  itemVisiblePercentThreshold: number;
} & CommonViewabilityConfig;

export type ViewabilityConfig = ViewAreaModeConfig | VisiblePercentModeConfig;
export type ViewabilityConfigMap = {
  [key: string]: ViewabilityConfig;
};

export type ViewabilityConfigCallbackPair = {
  viewabilityConfig?: ViewabilityConfig;
  viewabilityConfigMap?: ViewabilityConfigMap;
  onViewableItemsChanged?: OnViewableItemsChanged;
  primary?: boolean;
};

export type ViewabilityConfigCallbackPairs =
  Array<ViewabilityConfigCallbackPair>;

export interface ViewToken {
  item: any;
  key: string;
  index: number | null;
  isViewable: boolean;
  section?: any;
}
export type OnViewableItemChangedInfo = {
  viewableItems: Array<ViewToken>;
  changed: Array<ViewToken>;
};

export type OnViewableItemsChanged =
  | ((info: OnViewableItemChangedInfo) => void)
  | null;

export type ViewabilityHelperCallbackTuple = {
  viewabilityConfig?: ViewabilityConfig;
  onViewableItemsChanged: OnViewableItemsChanged;
};
