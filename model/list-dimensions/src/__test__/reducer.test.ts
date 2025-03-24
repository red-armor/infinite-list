import { beforeEach, describe, expect, it, vi } from 'vitest';
import { context as itemMetaContext } from '@infinite-list/item-meta';
import { ActionType } from '@infinite-list/state';
import { defaultKeyExtractor } from '@infinite-list/utils';
// import ListGroupDimensions from '../ListGroupDimensions';
import Batchinator from '@x-oasis/batchinator';
import ListDimensions from '../ListDimensions';

const buildData = (count: number) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index,
  }));

vi.useFakeTimers();

vi.spyOn(Batchinator.prototype, 'schedule').mockImplementation(function (
  ...args
) {
  // eslint-disable-next-line prefer-spread
  this._callback.apply(this, args);
});

testSuite(false);

function testSuite(isFixedLength: boolean) {
  describe('reducer', () => {
    beforeAll(() => {
      vi.useFakeTimers({ toFake: ['requestIdleCallback'] });
    });
    beforeEach(() => {
      const keys = Object.keys(itemMetaContext);
      keys.forEach((key) => {
        delete itemMetaContext[key];
      });
    });

    it('if visibleStartIndex and visibleEndIndex not change, then return directly', () => {
      const data = buildData(100);

      const list = new ListDimensions({
        data: [],
        id: 'list_group',
        keyExtractor: defaultKeyExtractor,
        maxToRenderPerBatch: 7,
        windowSize: 2,
        recycleEnabled: true,
        initialNumToRender: 4,
        getContainerLayout: () => ({
          x: 0,
          y: 0,
          width: 375,
          height: 2000,
        }),
        viewabilityConfigCallbackPairs: [
          {
            viewabilityConfig: {
              viewport: 1,
              name: 'imageViewable',
              viewAreaCoveragePercentThreshold: 20,
            },
          },
          {
            viewabilityConfig: {
              name: 'viewable',
              viewAreaCoveragePercentThreshold: 30,
            },
          },
        ],
      });

      expect(list.state).toEqual({
        visibleStartIndex: -1,
        visibleEndIndex: -1,
        bufferedStartIndex: -1,
        bufferedEndIndex: -1,
        isEndReached: false,
        distanceFromEnd: 0,
        actionType: 'initial',
      });

      list.setData(data);

      list.updateScrollMetrics({
        offset: 0,
        visibleLength: 926,
        contentLength: 1000,
      });

      list.setFinalKeyItemLayout('3', 100, true);

      expect(list.state).toEqual({
        visibleStartIndex: 0,
        visibleEndIndex: 12,
        bufferedStartIndex: 0,
        bufferedEndIndex: 7,
        isEndReached: true,
        distanceFromEnd: 74,
        actionType: 'hydrationWithBatchUpdate',
      });

      list.updateScrollMetrics({
        offset: 0,
        visibleLength: 926,
        contentLength: 1000,
      });

      const listState = list.state;

      expect(listState).toEqual({
        visibleStartIndex: 0,
        visibleEndIndex: 12,
        bufferedStartIndex: 0,
        bufferedEndIndex: 7,
        isEndReached: true,
        distanceFromEnd: 74,
        actionType: 'hydrationWithBatchUpdate',
      });

      list.updateScrollMetrics({
        offset: 0,
        visibleLength: 926,
        contentLength: 1001,
      });

      expect(list.state).toEqual({
        visibleStartIndex: 0,
        visibleEndIndex: 12,
        bufferedStartIndex: 0,
        bufferedEndIndex: 7,
        isEndReached: true,
        distanceFromEnd: 75,
        actionType: 'hydrationWithBatchUpdate',
      });
    });
  });
}
