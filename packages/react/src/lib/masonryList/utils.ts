import type { ViewabilityConfigCallbackPairs } from '@infinite-list/data-model';

export function shuffleData(data, getItemLayout) {
  let lengthLeft = 0;
  let lengthRight = 0;
  const dataLeft = [];
  const dataRight = [];

  data.forEach((item, index) => {
    const { length } = getItemLayout(data, index);

    if (lengthLeft <= lengthRight) {
      dataLeft.push(item);
      lengthLeft += length;
    } else {
      dataRight.push(item);
      lengthRight += length;
    }
  });

  return {
    dataLeft,
    dataRight,
  };
}

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
