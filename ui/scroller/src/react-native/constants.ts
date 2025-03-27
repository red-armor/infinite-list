import type { ViewabilityConfigCallbackPairs } from '@infinite-list/viewable';

export const defaultViewabilityConfigCallbackPairs: ViewabilityConfigCallbackPairs =
  [
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
