import React, { ForwardedRef } from 'react';
import { ViewStyle } from 'react-native';

import { OnLayout } from './scrollView';

export type OnMeasureLayout =
  | ((x: number, y: number, width: number, height: number) => void)
  | null;

export type MeasurementShape = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type SetMeasureLayoutHandler = (handler: Function) => void;
export type GetMetaOnViewableItemsChanged = () => {
  [key: string]: any;
};

export interface ViewableItemProps {
  ownerId?: string;

  item?: any;

  withWrapper?: boolean;
  onLayout?: OnLayout;
  forwardRef?: ForwardedRef<any>;
  children?: React.ReactNode | undefined;

  viewableItemHelperKey: string;

  onMeasureLayout?: OnMeasureLayout;

  measureLayoutHandlerOnDemand?: OnMeasureLayout;

  style?: ViewStyle;

  onViewable?: (visible?: boolean) => void;
  onImpression?: () => void;

  isIntervalTreeItem?: boolean;

  isListItem?: boolean;

  setMeasureLayoutHandler?: SetMeasureLayoutHandler;

  getMetaOnViewableItemsChanged?: GetMetaOnViewableItemsChanged;

  CellRendererComponent?: React.ComponentType<any> | undefined;

  viewAbilityPropsSensitive?: boolean;

  containerKey?: string;
}

export interface StickyItemProps extends ViewableItemProps {
  hasNextStickyNode?: boolean;
  nextStickyNodeOffset?: number | null;
  currentStickyNodeLength?: number;
  stickyStartOffset?: number;

  startCorrection?: number;

  zIndex?: number;
}
