import { createContext } from 'react';

import type Marshal from '../Marshal';
import type PortalManager from '../portal/Manager';
import type ScrollEventHelper from '../ScrollEventHelper';
import type ScrollHelper from '../ScrollHelper';
import type { SpectrumScrollViewRef } from '../types';

export const defaultScrollViewContext = {
  marshal: null,
  outerMostVerticalMarshal: null,
  outerMostHorizontalMarshal: null,

  scrollEventHelper: null,
  getScrollHelper: null,
  outerMostVerticalScrollHelper: null,
  outerMostHorizontalScrollHelper: null,

  portalManager: null,
  outerMostVerticalPortalManager: null,
  outerMostHorizontalPortalManager: null,

  scrollTo: null,
  getScrollViewRef: null,
  getParentMarshal: null,
};

export default createContext<{
  marshal: Marshal;
  outerMostVerticalMarshal: Marshal;
  outerMostHorizontalMarshal: Marshal;

  scrollEventHelper: ScrollEventHelper;
  getScrollHelper: () => ScrollHelper;
  getParentMarshal: () => Marshal;
  outerMostVerticalScrollHelper: ScrollHelper;
  outerMostHorizontalScrollHelper: ScrollHelper;

  portalManager: PortalManager;
  outerMostVerticalPortalManager: PortalManager;
  outerMostHorizontalPortalManager: PortalManager;

  getScrollViewRef: () => SpectrumScrollViewRef;
  scrollTo: (options?: { x?: number; y?: number; animated?: boolean }) => void;
  // @ts-ignore
}>(defaultScrollViewContext);
