import { createContext } from 'react';
// import { IntersectionObserver } from '@infinite-list/intersection-observer/react-native';

import Marshal from '../Marshal';

export const defaultScrollViewContext = {
  marshal: null,
  // intersectionObserver: null,
};

export default createContext<{
  marshal: null | Marshal;
  // intersectionObserver: null | IntersectionObserver;
}>(defaultScrollViewContext);
