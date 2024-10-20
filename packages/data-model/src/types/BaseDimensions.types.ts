import { BaseLayoutProps } from './BaseLayout.types';
import {
  OnViewableItemsChanged,
  ViewabilityConfig,
  ViewabilityConfigCallbackPairs,
} from './viewable.types';
// import ListDimensions from '../ListDimensions';
// import ListDimensionsModel from '../ListDimensionsModel';
// import Dimension from '../Dimension';
// import { GenericItemT } from './generic.types';
// import { ListGroupChildDimensionsContainer } from './ListDimensionsModel.types';
// import ListDimensions from '../ListDimensions';
// import ListGroupDimensions from '../ListGroupDimensions';
// import Dimension from '../Dimension';

export interface BaseDimensionsProps extends BaseLayoutProps {
  ignoredToPerBatch?: boolean;

  lengthPrecision?: number;
  recyclerType?: string;

  onUpdateItemLayout?: Function;
  onUpdateIntervalTree?: Function;
  isIntervalTreeItems?: boolean;
  viewabilityConfig?: ViewabilityConfig;
  onViewableItemsChanged?: OnViewableItemsChanged;
  viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs;
}

export enum KeysChangedType {
  'Initial' = 'initial',
  'Equal' = 'equal',
  'Remove' = 'remove',
  'Append' = 'append',
  'Add' = 'add',
  'Reorder' = 'reorder',
  'Idle' = 'idle',
}
