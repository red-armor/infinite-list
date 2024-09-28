import ViewabilityItemMeta from '../viewable/ViewabilityItemMeta';

export type CommonViewabilityConfig = {
  name: string;
  viewport?: number;
  minimumViewTime?: number;
  waitForInteraction?: boolean;

  // 目前主要用在比如只希望有一个曝光出来；比如viewport中可以
  // 放置两个item的时候，而item两个都是
  exclusive?: boolean;
};

export type NormalizedViewablityConfig = {
  exclusive: boolean;
  viewport: number;
  minimumViewTime?: number;
  waitForInteraction?: boolean;
  viewAreaMode: boolean;
  viewablePercentThreshold: number;
};

export type ViewAreaModeConfig = {
  viewAreaCoveragePercentThreshold?: number;
} & CommonViewabilityConfig;

export type VisiblePercentModeConfig = {
  itemVisiblePercentThreshold?: number;
} & CommonViewabilityConfig;

export type ViewabilityConfig = ViewAreaModeConfig | VisiblePercentModeConfig;

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

// export type ViewabilityItemMeta = {
//   offset: number;
//   length: number;
// };
export type ViewabilityScrollMetrics = {
  offset: number;
  visibleLength: number;
};

export type IsItemViewableOptions = {
  viewport: number;
  viewabilityItemMeta:
    | ViewabilityItemMeta
    | {
        offset: number;
        length: number;
      };
  viewabilityScrollMetrics: ViewabilityScrollMetrics;
  viewAreaMode?: boolean;
  viewablePercentThreshold?: number;

  // for performance boost....
  getItemOffset?: (itemMeta: ViewabilityItemMeta) => number;
};

export type OnViewableItemsChanged =
  | ((info: OnViewableItemChangedInfo) => void)
  | null;

export type ViewabilityConfigCallbackPair = {
  viewabilityConfig: ViewabilityConfig;
  onViewableItemsChanged?: OnViewableItemsChanged;
};

export type ViewabilityConfigCallbackPairs =
  Array<ViewabilityConfigCallbackPair>;

export type ViewabilityConfigTuplesProps = {
  isListItem?: boolean;
  viewabilityConfig?: ViewabilityConfig;
  viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs;
  onViewableItemsChanged?: OnViewableItemsChanged;
};

export type ViewabilityHelperChangedToken = {
  item: any;
  key: string;
  isViewable: boolean;
  index: number;
};
