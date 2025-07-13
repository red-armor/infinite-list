import {
  OnViewableItemsChanged,
  ViewabilityConfig,
  ViewabilityConfigCallbackPairs,
} from '@infinite-list/viewable';
import { BaseLayoutProps } from './BaseLayout.types';

export type OnUpdateItemLayout = () => void;
export type OnUpdateIntervalTree = () => void;

export interface BaseDimensionsProps extends BaseLayoutProps {
  ignoredToPerBatch?: boolean;

  lengthPrecision?: number;
  recyclerType?: string;

  onUpdateItemLayout?: OnUpdateItemLayout;
  onUpdateIntervalTree?: OnUpdateIntervalTree;
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
