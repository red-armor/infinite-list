import { describe, it, expect } from 'vitest';
import {
  isItemViewable,
  isEntirelyVisible,
} from '../viewable/viewabilityUtils';

const viewportLength = 926;

describe('_isEntirelyVisible', () => {
  it('item has not length and on the top', () => {
    const falsy = isEntirelyVisible({
      top: 0,
      bottom: 0,
      viewportHeight: viewportLength,
    });
    expect(falsy).toBe(true);
  });

  it('item has length and on the top', () => {
    const falsy = isEntirelyVisible({
      top: 0,
      bottom: 10,
      viewportHeight: viewportLength,
    });
    expect(falsy).toBe(true);
  });

  it('item has length and outside viewport', () => {
    expect(
      isEntirelyVisible({
        top: -10,
        bottom: 10,
        viewportHeight: viewportLength,
      })
    ).toBe(false);

    expect(
      isEntirelyVisible({
        top: 800,
        bottom: 950,
        viewportHeight: viewportLength,
      })
    ).toBe(false);

    expect(
      isEntirelyVisible({
        top: -10,
        bottom: 950,
        viewportHeight: viewportLength,
      })
    ).toBe(false);

    expect(
      isEntirelyVisible({
        top: -10,
        bottom: 900,
        viewportHeight: viewportLength,
      })
    ).toBe(false);
  });

  it('item has not length and on the bottom', () => {
    const falsy = isEntirelyVisible({
      top: viewportLength,
      bottom: viewportLength,
      viewportHeight: viewportLength,
    });
    expect(falsy).toBe(true);
  });

  it('item has not length and inside viewport', () => {
    const falsy = isEntirelyVisible({
      top: viewportLength,
      bottom: viewportLength,
      viewportHeight: viewportLength,
    });
    expect(falsy).toBe(true);
  });
});

describe('isItemViewable', () => {
  it('isItemViewable -- scroll offset is 0', () => {
    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 0,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 0,
          visibleLength: viewportLength,
        },
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 0,
          length: 928,
        },
        viewabilityScrollMetrics: {
          offset: 0,
          visibleLength: viewportLength,
        },
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 927,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 0,
          visibleLength: viewportLength,
        },
      })
    ).toBe(false);
  });

  it('viewable, even if 1 pixel in viewport', () => {
    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: viewportLength,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 0,
          visibleLength: viewportLength,
        },
      })
    ).toBe(false);

    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: viewportLength - 1,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 0,
          visibleLength: viewportLength,
        },
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 1,
          length: 1,
        },
        viewabilityScrollMetrics: {
          offset: 1,
          visibleLength: viewportLength,
        },
      })
    ).toBe(true);
  });

  it('viewport > 0', () => {
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 2500 - viewportLength,
          length: 1,
        },
        viewabilityScrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
      })
    ).toBe(true);
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 2500 - viewportLength - 1,
          length: 1,
        },
        viewabilityScrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
      })
    ).toBe(false);
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 2500 + 2 * viewportLength - 1,
          length: 1,
        },
        viewabilityScrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 2500 + 2 * viewportLength,
          length: 1,
        },
        viewabilityScrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
      })
    ).toBe(false);

    // top: 4800, bottom: 4900; viewHeight = 3009 + 2 * 926 = 4861 => 61 / 926 = 0.0658
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 4800,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 6,
      })
    ).toBe(true);
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 4800,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 7,
      })
    ).toBe(false);

    // top: 4800, bottom: 4900; viewHeight = 3009 + 2 * 926 = 4861 => 61 / 926 = 0.0658
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 4800,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewablePercentThreshold: 60,
      })
    ).toBe(true);
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 4800,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewablePercentThreshold: 62,
      })
    ).toBe(false);
  });

  it('viewablePercentThreshold, if greater than 0, then compare with >=', () => {
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 4800,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewablePercentThreshold: 61,
      })
    ).toBe(true);
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 4800,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewablePercentThreshold: 61.1,
      })
    ).toBe(false);
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 4800,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewAreaMode: false,
        viewablePercentThreshold: 60.9,
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 4800,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 6.58,
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 4800,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 6.59,
      })
    ).toBe(false);
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 4800,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 6.57,
      })
    ).toBe(true);
  });

  it('item visible length is 0', () => {
    // entirely visible
    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 3009,
          length: 0,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewablePercentThreshold: 0,
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 3008,
          length: 1,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewablePercentThreshold: 0,
      })
    ).toBe(false);
    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 3009 + viewportLength,
          length: 1,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewablePercentThreshold: 0,
      })
    ).toBe(false);
  });

  it('viewAreaMode set as true', () => {
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 2500 - viewportLength,
          length: viewportLength * 0.2,
        },
        viewabilityScrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 20,
      })
    ).toBe(true);

    // entirely visible
    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 2500 - viewportLength,
          length: viewportLength * 0.19,
        },
        viewabilityScrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 20,
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 2500 - viewportLength * 1.1,
          length: viewportLength * 0.3,
        },
        viewabilityScrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 20,
      })
    ).toBe(false);

    expect(
      isItemViewable({
        viewport: 1,
        viewabilityItemMeta: {
          offset: 2500 - viewportLength * 1.1 + 1,
          length: viewportLength * 0.3,
        },
        viewabilityScrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 20,
      })
    ).toBe(true);
  });

  it('compare viewAreaMode with itemAreaMode', () => {
    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 3000,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 9,
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 3000,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 10,
      })
    ).toBe(false);

    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 3000,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewablePercentThreshold: 90,
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 3000,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewablePercentThreshold: 92,
      })
    ).toBe(false);
  });

  it('entirely visible is special case in viewAreaMode', () => {
    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 3000,
          length: 100,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 10,
      })
    ).toBe(false);

    expect(
      isItemViewable({
        viewport: 0,
        viewabilityItemMeta: {
          offset: 3000,
          length: 1000,
        },
        viewabilityScrollMetrics: {
          offset: 3009,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 10,
      })
    ).toBe(true);
  });
});
