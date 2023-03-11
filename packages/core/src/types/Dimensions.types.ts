import BaseDimensions from '../BaseDimensions';
import Dimension from '../Dimension';
import ItemsDimensions from '../ItemsDimensions';
import ListGroupDimensions from '../ListGroupDimensions';
import { OnEndReachedHelperProps } from './onEndReachedHelper';
import {
  OnViewableItemsChanged,
  ViewabilityConfig,
  ViewabilityConfigCallbackPairs,
} from './viewable';

export type GetItemSeparatorLength<ItemT> = (
  data: Array<ItemT>,
  index: number
) => { length: number };
export type GetItemLayout<ItemT> = (
  data: Array<ItemT>,
  index: number
) => { length: number; index: number };
export type KeyExtractor<ItemT> = (item: ItemT, index: number) => string;

export type BaseDimensionsProps = {
  id: string;
  horizontal?: boolean;
  onUpdateItemLayout?: Function;
  onUpdateIntervalTree?: Function;
  isIntervalTreeItems?: boolean;
  // getContainerOffset?: ContainerOffsetGetter;
  viewabilityConfig?: ViewabilityConfig;
  onViewableItemsChanged?: OnViewableItemsChanged;
  viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs;
};

export type ListGroupDimensionsProps = {
  id: string;
  horizontal?: boolean;
  onUpdateItemLayout?: Function;
  onUpdateIntervalTree?: Function;
  getContainerLayout?: ContainerLayoutGetter;
  viewabilityConfig?: ViewabilityConfig;
  onViewableItemsChanged?: OnViewableItemsChanged;
  initialNumToRender?: number;
  deps?: Array<string>;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs;
  onBatchLayoutFinished?: () => boolean;
} & OnEndReachedHelperProps;

export type ListDimensionsProps<ItemT> = {
  data: Array<ItemT>;
  keyExtractor: KeyExtractor<ItemT>;
  getItemLayout?: GetItemLayout<ItemT>;
  getItemSeparatorLength?: GetItemSeparatorLength<ItemT>;
  parentItemsDimensions?: ItemsDimensions;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  listGroupDimension?: ListGroupDimensions;
  getContainerLayout?: ContainerLayoutGetter;
  store?: any;

  deps?: Array<string>;

  active?: boolean;
  initialNumToRender?: number;
  onBatchLayoutFinished?: () => boolean;
} & BaseDimensionsProps &
  OnEndReachedHelperProps;

export type ItemsDimensionsProps = BaseDimensionsProps;

export type ItemLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// export type InternalItemMeta = {
//   key: string;
//   separatorLength: number;
//   layout: ItemLayout;
// };

export enum KeysChangedType {
  'Initial' = 'initial',
  'Equal' = 'equal',
  'Remove' = 'remove',
  'Append' = 'append',
  'Add' = 'add',
  'Reorder' = 'reorder',
  'Idle' = 'idle',
}

export enum BoundInfoType {
  'Hover' = 'hover',
  'OutOfBoundary' = 'outOfBoundary',
}

export type BoundInfo = {
  type: BoundInfoType;
  index: number;
};

// export interface PseudoListDimensionsInterface
//   extends CommonListDimensionsInterface {}

export type PseudoListDimensionsProps = {
  indexKeys: Array<string>;
} & BaseDimensionsProps;

export type DimensionProps = {
  id: string;
  onRender?: Function;
  horizontal?: boolean;
  initialStartIndex?: number;
  ignoredToPerBatch?: boolean;
  listGroupDimension: ListGroupDimensions;
};

// export type ContainerOffsetGetter = () => { length: number };
export type ContainerLayoutGetter = () => {
  x: number;
  y: number;
  height: number;
  width: number;
};

// // https://stackoverflow.com/a/72687146
// export type DecoratedItemMeta<T extends {} = {}> = {
//   [Property in keyof T]: T[Property];
// } &
//   InternalItemMeta;

// export type MetaDecorator<T extends {} = {}> = (
//   meta: InternalItemMeta
// ) => DecoratedItemMeta<T>;

export type PreStateResult = {
  visibleStartIndex: number;
  visibleEndIndex: number;
  bufferedStartIndex: number;
  bufferedEndIndex: number;
  isEndReached: boolean;
  distanceFromEnd: number;
};

export type ListStateResult<ItemT extends {} = {}> = {
  data: Array<ItemT>;
  itemKeys: Array<string>;
} & PreStateResult;

export type StateListener = (
  newState: PreStateResult,
  oldState: PreStateResult
) => void;

export interface StateSubscriptions {
  [key: string]: ((viewable: boolean) => void)[];
}

export type StateEventListener = (eventValue?: boolean) => void;
// export type BuiltInEvent = 'viewable' | 'impression';

export type ItemMetaState = {
  [key: string]: boolean;
};

export type ListRangeResult = Array<ListRange>;
export type ListRange = {
  listKey: string;
  isDimension: boolean;
  value: {
    startIndex: number;
    endIndex: number;
    data: Array<{
      [key: string]: any;
    }>;
  };
};

export enum SetDataPhase {
  INITIAL = 'initial',
  UPDATE = 'update',
}

export type ItemMetaOwner = BaseDimensions | Dimension;
export type IndexInfo = {
  index: number;
  indexInGroup?: number;
};

export enum ListRenderState {
  INITIAL = 'initial',
  UPDATE = 'update',
  ON_RENDER_FINISHED = 'on_render_finished',
}

export type InspectingAPI = {
  inspectingTimes: number;
  inspectingTime: number;
  heartBeat: (props: { listKey: string; inspectingTime: number }) => void;
  startInspection: () => void;
};

export type InspectingListener = (props: InspectingAPI) => void;
