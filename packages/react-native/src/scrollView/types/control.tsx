import { PropsWithChildren } from 'react';

export type ControlProps = PropsWithChildren<{
  refreshing: boolean;
  onRefresh: (() => void) | null;
  fadeOutDuration?: number;
  refreshThresholdValue?: number;
}>;
