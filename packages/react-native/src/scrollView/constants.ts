import { ViewabilityConfigCallbackPairs } from '@infinite-list/data-model';

export const defaultViewabilityConfigCallbackPairs: ViewabilityConfigCallbackPairs = [
  {
    viewabilityConfig: {
      name: 'viewable',
      viewAreaCoveragePercentThreshold: 0,
    },
  },
  {
    viewabilityConfig: {
      name: 'imageViewable',
      viewport: 1,
      viewAreaCoveragePercentThreshold: 0,
    },
  },
];
