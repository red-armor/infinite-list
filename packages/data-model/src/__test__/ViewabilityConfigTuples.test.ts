import { describe, it, expect } from 'vitest';
import ViewabilityConfigTuples from '../viewable/ViewabilityConfigTuples';

const noop = () => {};

describe('_isEntirelyVisible', () => {
  it('constructor - viewabilityConfig', () => {
    const tuple = new ViewabilityConfigTuples({
      viewabilityConfig: {
        viewAreaCoveragePercentThreshold: 20,
      },
    });

    expect(tuple.getViewabilityHelpers().length).toBe(1);
    expect(tuple.getViewabilityHelpers()[0].configName).toBe('viewable');
  });

  it('constructor - onViewableItemsChanged', () => {
    const tuple = new ViewabilityConfigTuples({
      onViewableItemsChanged: noop,
    });

    expect(tuple.getViewabilityHelpers().length).toBe(1);
    expect(tuple.getViewabilityHelpers()[0].configName).toBe('viewable');
    expect(tuple.getViewabilityHelpers()[0].callback).toBe(noop);
  });

  it('constructor - viewabilityConfigCallbackPairs', () => {
    const callbackTuple = new ViewabilityConfigTuples({
      viewabilityConfigCallbackPairs: [
        {
          onViewableItemsChanged: noop,
        },
      ],
    });

    expect(callbackTuple.getViewabilityHelpers().length).toBe(1);
    expect(callbackTuple.getViewabilityHelpers()[0].configName).toBe(
      'viewable'
    );
    expect(callbackTuple.getViewabilityHelpers()[0].callback).toBe(noop);

    const configTuple = new ViewabilityConfigTuples({
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            viewAreaCoveragePercentThreshold: 20,
          },
        },
      ],
    });

    expect(configTuple.getViewabilityHelpers().length).toBe(1);
    expect(configTuple.getViewabilityHelpers()[0].configName).toBe('viewable');
  });

  it('constructor - override first pair config name', () => {
    const tuple = new ViewabilityConfigTuples({
      viewabilityConfigCallbackPairs: [
        {
          viewabilityConfig: {
            name: 'test',
          },
          onViewableItemsChanged: noop,
        },
      ],
    });

    expect(tuple.getViewabilityHelpers().length).toBe(1);
    expect(tuple.getViewabilityHelpers()[0].configName).toBe('viewable');
    expect(tuple.getViewabilityHelpers()[0].callback).toBe(noop);
  });

  it('constructor - viewabilityConfigCallbackPairs', () => {
    const tuple = new ViewabilityConfigTuples({
      viewabilityConfigCallbackPairs: [
        {
          onViewableItemsChanged: noop,
        },
        {
          viewabilityConfig: {
            name: 'imageViewable',
            viewAreaCoveragePercentThreshold: 20,
          },
          onViewableItemsChanged: noop,
        },
      ],
    });

    expect(tuple.getViewabilityHelpers().length).toBe(2);
    expect(tuple.getViewabilityHelpers()[0].configName).toBe('viewable');
    expect(tuple.getViewabilityHelpers()[0].callback).toBe(noop);
    expect(tuple.getViewabilityHelpers()[1].configName).toBe('imageViewable');
    expect(tuple.getViewabilityHelpers()[1].callback).toBe(noop);
  });

  it('constructor - viewabilityConfigCallbackPairs', () => {
    const tuple = new ViewabilityConfigTuples({
      viewabilityConfigCallbackPairs: [
        {
          onViewableItemsChanged: noop,
        },
        {
          viewabilityConfig: {
            name: 'imageViewable',
            viewAreaCoveragePercentThreshold: 20,
          },
          onViewableItemsChanged: noop,
        },
        {
          viewabilityConfig: {
            name: 'viewable',
            viewAreaCoveragePercentThreshold: 30,
          },
          onViewableItemsChanged: noop,
        },
      ],
    });

    expect(tuple.getViewabilityHelpers().length).toBe(2);
    expect(tuple.getViewabilityHelpers()[0].configName).toBe('imageViewable');
    expect(tuple.getViewabilityHelpers()[0].callback).toBe(noop);
    expect(tuple.getViewabilityHelpers()[1].configName).toBe('viewable');
    expect(tuple.getViewabilityHelpers()[1].callback).toBe(noop);
  });

  it('getDefaultState', () => {
    const tuple = new ViewabilityConfigTuples({
      viewabilityConfigCallbackPairs: [
        {
          onViewableItemsChanged: noop,
        },
        {
          viewabilityConfig: {
            name: 'imageViewable',
            viewAreaCoveragePercentThreshold: 20,
          },
          onViewableItemsChanged: noop,
        },
      ],
    });
    expect(tuple.getDefaultState()).toEqual({
      viewable: false,
      imageViewable: false,
    });
    expect(tuple.getDefaultState(true)).toEqual({
      viewable: true,
      imageViewable: true,
    });
  });
});
