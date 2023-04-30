import { describe, it, expect } from 'vitest';
import {
  isItemViewable,
  isEntirelyVisible,
} from '../viewable/viewabilityUtils';

const viewportLength = 927;

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
        itemInfo: {
          offset: 0,
          length: 100,
        },
        scrollMetrics: {
          offset: 0,
          visibleLength: 927,
        },
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 0,
        itemInfo: {
          offset: 0,
          length: 928,
        },
        scrollMetrics: {
          offset: 0,
          visibleLength: 927,
        },
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 0,
        itemInfo: {
          offset: 927,
          length: 100,
        },
        scrollMetrics: {
          offset: 0,
          visibleLength: 927,
        },
      })
    ).toBe(false);
  });

  it('viewable, even if 1 pixel in viewport', () => {
    expect(
      isItemViewable({
        viewport: 0,
        itemInfo: {
          offset: 926,
          length: 100,
        },
        scrollMetrics: {
          offset: 0,
          visibleLength: 927,
        },
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 0,
        itemInfo: {
          offset: 927,
          length: 100,
        },
        scrollMetrics: {
          offset: 0,
          visibleLength: 927,
        },
      })
    ).toBe(false);

    expect(
      isItemViewable({
        viewport: 0,
        itemInfo: {
          offset: 1,
          length: 1,
        },
        scrollMetrics: {
          offset: 1,
          visibleLength: 927,
        },
      })
    ).toBe(true);
  });

  it('viewport > 0', () => {
    expect(
      isItemViewable({
        viewport: 1,
        itemInfo: {
          offset: 2500 - viewportLength,
          length: 1,
        },
        scrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
      })
    ).toBe(true);
    expect(
      isItemViewable({
        viewport: 1,
        itemInfo: {
          offset: 2500 - viewportLength - 1,
          length: 1,
        },
        scrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
      })
    ).toBe(false);
    expect(
      isItemViewable({
        viewport: 1,
        itemInfo: {
          offset: 2500 + 2 * viewportLength - 1,
          length: 1,
        },
        scrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
      })
    ).toBe(true);

    expect(
      isItemViewable({
        viewport: 1,
        itemInfo: {
          offset: 2500 + 2 * viewportLength,
          length: 1,
        },
        scrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
      })
    ).toBe(false);
  });

  it('viewAreaMode set as true', () => {
    expect(
      isItemViewable({
        viewport: 1,
        itemInfo: {
          offset: 2500 - viewportLength,
          length: viewportLength * 0.2,
        },
        scrollMetrics: {
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
        itemInfo: {
          offset: 2500 - viewportLength,
          length: viewportLength * 0.19,
        },
        scrollMetrics: {
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
        itemInfo: {
          offset: 2500 - viewportLength * 1.1,
          length: viewportLength * 0.3,
        },
        scrollMetrics: {
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
        itemInfo: {
          offset: 2500 - viewportLength * 1.1 + 1,
          length: viewportLength * 0.3,
        },
        scrollMetrics: {
          offset: 2500,
          visibleLength: viewportLength,
        },
        viewAreaMode: true,
        viewablePercentThreshold: 20,
      })
    ).toBe(false);
  });
});
