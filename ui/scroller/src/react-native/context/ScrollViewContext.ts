import { createContext } from 'react';
import type { IntersectionObserver } from '@infinite-list/intersection-observer/react-native';
import type Marshal from '../Marshal';
import type PortalManager from '../portal/Manager';

export const defaultScrollViewContext = {
  marshal: null,
  intersectionObserver: null,
  portalManager: null,
};

export default createContext<{
  marshal: null | Marshal;
  intersectionObserver: null | IntersectionObserver;
  portalManager: null | PortalManager;
}>(defaultScrollViewContext);
