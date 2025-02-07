import ListGroupDimensions from '../ListGroupDimensions';
import Batchinator from '@x-oasis/batchinator';
import { defaultKeyExtractor } from '@infinite-list/utils';
import { ActionType } from '@infinite-list/state';
import { context as itemMetaContext } from '@infinite-list/item-meta';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';
const buildData = (count: number) =>
  new Array(count).fill(1).map((v, index) => ({
    key: `key_${index}`,
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
    it('basic scrollDown', () => {
      const listGroupDimensions = new ListGroupDimensions({
        id: 'list_group',
        maxToRenderPerBatch: 10,
        isFixedLength,
        getContainerLayout: () => ({
          x: 0,
          y: 2000,
          width: 375,
          height: 2000,
        }),
      });
      listGroupDimensions.registerItem('banner');
      listGroupDimensions.registerList('list_1', {
        data: buildData(10),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 100, index }),
      });
      listGroupDimensions.registerList('list_2', {
        data: buildData(5),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 20, index }),
      });
      listGroupDimensions.registerList('list_3', {
        data: buildData(13),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 500, index }),
      });
      listGroupDimensions.registerItem('banner2');
      listGroupDimensions.registerList('list_4', {
        data: buildData(20),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 150, index }),
      });
      listGroupDimensions.setKeyItemLayout('banner', 'banner', 80);
      listGroupDimensions.store.dispatch({
        type: ActionType.ScrollDown,
        payload: {
          dimension: listGroupDimensions,
          scrollMetrics: {
            offset: 1000,
            contentLength: 5000,
            visibleLength: 926,
          },
          isEndReached: false,
          distanceFromEnd: 0,
        },
      });

      expect(listGroupDimensions.getContainerOffset()).toBe(2000);
      expect(listGroupDimensions.getState()).toEqual({
        actionType: ActionType.ScrollDown,
        visibleStartIndex: -1,
        visibleEndIndex: -1,
        bufferedStartIndex: 0,
        bufferedEndIndex: 10,
        isEndReached: false,
        distanceFromEnd: 0,
      });
    });

    it('basic scrollDown, `bufferedEndIndex` should be preserved (17 -> 19)', () => {
      const listGroupDimensions = new ListGroupDimensions({
        id: 'list_group',
        maxToRenderPerBatch: 10,
        isFixedLength,
        getContainerLayout: () => ({
          x: 0,
          y: 2000,
          width: 375,
          height: 2000,
        }),
      });

      listGroupDimensions.registerItem('banner');
      listGroupDimensions.registerList('list_1', {
        data: buildData(10),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 100, index }),
      });
      listGroupDimensions.registerList('list_2', {
        data: buildData(5),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 20, index }),
      });
      listGroupDimensions.registerList('list_3', {
        data: buildData(13),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 500, index }),
      });
      listGroupDimensions.registerItem('banner2');
      listGroupDimensions.registerList('list_4', {
        data: buildData(20),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 150, index }),
      });

      listGroupDimensions.setKeyItemLayout('banner', 'banner', 80);

      listGroupDimensions.store.dispatch({
        type: ActionType.HydrationWithBatchUpdate,
        payload: {
          dimension: listGroupDimensions,
          scrollMetrics: {
            offset: 0,
            contentLength: 4000,
            visibleLength: 926,
          },
          isEndReached: false,
          distanceFromEnd: 0,
        },
      });

      expect(listGroupDimensions.store.getState()).toEqual({
        actionType: ActionType.HydrationWithBatchUpdate,
        visibleStartIndex: -1,
        visibleEndIndex: -1,
        bufferedStartIndex: 0,
        bufferedEndIndex: 8,
        isEndReached: false,
        distanceFromEnd: 0,
      });

      listGroupDimensions.store.dispatch({
        type: ActionType.ScrollDown,
        payload: {
          dimension: listGroupDimensions,
          scrollMetrics: {
            offset: 1000,
            contentLength: 5000,
            visibleLength: 926,
          },
          isEndReached: false,
          distanceFromEnd: 0,
        },
      });

      expect(listGroupDimensions.getContainerOffset()).toBe(2000);
      expect(listGroupDimensions.store.getState()).toEqual({
        actionType: ActionType.ScrollDown,
        visibleStartIndex: -1,
        visibleEndIndex: -1,
        bufferedStartIndex: 0,
        bufferedEndIndex: 10,
        isEndReached: false,
        distanceFromEnd: 0,
      });
    });

    it('with ignoredToPerBatch', () => {
      const listGroupDimensions = new ListGroupDimensions({
        id: 'list_group',
        isFixedLength,
        maxToRenderPerBatch: 10,
        getContainerLayout: () => ({
          x: 0,
          y: 2000,
          width: 375,
          height: 2000,
        }),
      });

      listGroupDimensions.registerItem('header_1', {
        ignoredToPerBatch: true,
      });
      listGroupDimensions.registerList('list_1', {
        data: buildData(20),
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_1', {
        ignoredToPerBatch: true,
      });

      listGroupDimensions.registerList('list_2', {
        data: buildData(20),
        keyExtractor: defaultKeyExtractor,
      });

      listGroupDimensions.store.dispatch({
        type: ActionType.HydrationWithBatchUpdate,
        payload: {
          dimension: listGroupDimensions,
          scrollMetrics: {
            offset: 2000,
            contentLength: 3000,
            visibleLength: 926,
          },
          isEndReached: false,
          distanceFromEnd: 0,
        },
      });

      expect(listGroupDimensions.store.getState()).toEqual({
        actionType: ActionType.HydrationWithBatchUpdate,
        visibleStartIndex: 0,
        visibleEndIndex: 13,
        bufferedStartIndex: 0,
        bufferedEndIndex: 10,
        isEndReached: false,
        distanceFromEnd: 0,
      });
    });

    it('without ignoredToPerBatch', () => {
      const listGroupDimensions = new ListGroupDimensions({
        id: 'list_group',
        isFixedLength,
        maxToRenderPerBatch: 10,
        getContainerLayout: () => ({
          x: 0,
          y: 2000,
          width: 375,
          height: 2000,
        }),
      });

      listGroupDimensions.registerItem('header_1');
      listGroupDimensions.registerList('list_1', {
        data: buildData(20),
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_1');

      listGroupDimensions.registerList('list_2', {
        data: buildData(20),
        keyExtractor: defaultKeyExtractor,
      });

      listGroupDimensions.store.dispatch({
        type: ActionType.HydrationWithBatchUpdate,
        payload: {
          dimension: listGroupDimensions,
          scrollMetrics: {
            offset: 2000,
            contentLength: 4000,
            visibleLength: 926,
          },
          isEndReached: false,
          distanceFromEnd: 0,
        },
      });

      expect(listGroupDimensions.store.getState()).toEqual({
        actionType: ActionType.HydrationWithBatchUpdate,
        visibleStartIndex: 0,
        visibleEndIndex: 13,
        bufferedStartIndex: 0,
        bufferedEndIndex: 9,
        isEndReached: false,
        distanceFromEnd: 0,
      });
    });

    it('with ignoredToPerBatch - with layout', () => {
      const listGroupDimensions = new ListGroupDimensions({
        id: 'list_group',
        maxToRenderPerBatch: 10,
        isFixedLength: false,
        getContainerLayout: () => ({
          x: 0,
          y: 2000,
          width: 375,
          height: 2000,
        }),
      });

      listGroupDimensions.registerItem('header_1', {
        ignoredToPerBatch: true,
      });
      listGroupDimensions.registerList('list_1', {
        data: buildData(20),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 40, index }),
      });
      listGroupDimensions.registerItem('footer_1', {
        ignoredToPerBatch: true,
      });

      listGroupDimensions.registerList('list_2', {
        data: buildData(20),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 100, index }),
      });

      listGroupDimensions.setKeyItemLayout('header_1', 'header_1', 200);
      listGroupDimensions.setKeyItemLayout('footer_1', 'footer_1', 30);
      listGroupDimensions.store.dispatch({
        type: ActionType.HydrationWithBatchUpdate,
        payload: {
          dimension: listGroupDimensions,
          scrollMetrics: {
            offset: 2000,
            contentLength: 5000,
            visibleLength: 926,
          },
          isEndReached: false,
          distanceFromEnd: 0,
        },
      });

      expect(listGroupDimensions.store.getState()).toEqual({
        actionType: ActionType.HydrationWithBatchUpdate,
        visibleStartIndex: 0,
        visibleEndIndex: 20,
        bufferedStartIndex: 0,
        bufferedEndIndex: 10,
        isEndReached: false,
        distanceFromEnd: 0,
      });
    });

    it('with ignoredToPerBatch', () => {
      const listGroupDimensions = new ListGroupDimensions({
        id: 'list_group',
        isFixedLength,
        maxToRenderPerBatch: 10,
        getContainerLayout: () => ({
          x: 0,
          y: 2000,
          width: 375,
          height: 2000,
        }),
      });

      listGroupDimensions.registerItem('header_1', {
        ignoredToPerBatch: true,
      });
      listGroupDimensions.registerList('list_1', {
        data: buildData(2),
        recycleEnabled: true,
        keyExtractor: defaultKeyExtractor,
      });

      listGroupDimensions.registerItem('footer_1', {
        ignoredToPerBatch: true,
      });

      listGroupDimensions.registerItem('header_2', {
        ignoredToPerBatch: true,
      });
      listGroupDimensions.registerList('list_2', {
        data: buildData(1),
        recycleEnabled: true,
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_2', {
        ignoredToPerBatch: true,
      });

      listGroupDimensions.registerItem('header_3', {
        ignoredToPerBatch: true,
      });
      listGroupDimensions.registerList('list_3', {
        data: buildData(2),
        recycleEnabled: true,
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_3', {
        ignoredToPerBatch: true,
      });

      listGroupDimensions.registerItem('header_4', {
        ignoredToPerBatch: true,
      });
      listGroupDimensions.registerList('list_4', {
        data: buildData(2),
        recycleEnabled: true,
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_4', {
        ignoredToPerBatch: true,
      });

      listGroupDimensions.registerItem('header_5', {
        ignoredToPerBatch: true,
      });
      listGroupDimensions.registerList('list_5', {
        data: buildData(2),
        recycleEnabled: true,
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_5', {
        ignoredToPerBatch: true,
      });

      listGroupDimensions.registerItem('header_6', {
        ignoredToPerBatch: true,
      });
      listGroupDimensions.registerList('list_6', {
        data: buildData(50),
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_6', {
        ignoredToPerBatch: true,
      });

      listGroupDimensions.registerItem('header_7', {
        ignoredToPerBatch: true,
      });
      listGroupDimensions.registerList('list_7', {
        data: buildData(2),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 100, index }),
      });
      listGroupDimensions.registerItem('footer_7', {
        ignoredToPerBatch: true,
      });

      listGroupDimensions.store.dispatch({
        type: ActionType.HydrationWithBatchUpdate,
        payload: {
          dimension: listGroupDimensions,
          scrollMetrics: {
            offset: 2000,
            contentLength: 5000,
            visibleLength: 926,
          },
          isEndReached: false,
          distanceFromEnd: 0,
        },
      });

      expect(listGroupDimensions.store.getState()).toEqual({
        actionType: ActionType.HydrationWithBatchUpdate,
        visibleStartIndex: 0,
        visibleEndIndex: 23,
        bufferedStartIndex: 0,
        bufferedEndIndex: 20,
        isEndReached: false,
        distanceFromEnd: 0,
      });
    });

    it('without ignoredToPerBatch', () => {
      const listGroupDimensions = new ListGroupDimensions({
        id: 'list_group',
        isFixedLength,
        maxToRenderPerBatch: 10,
        getContainerLayout: () => ({
          x: 0,
          y: 2000,
          width: 375,
          height: 2000,
        }),
      });

      listGroupDimensions.registerItem('header_1');
      listGroupDimensions.registerList('list_1', {
        data: buildData(2),
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_1');

      listGroupDimensions.registerItem('header_2');
      listGroupDimensions.registerList('list_2', {
        data: buildData(1),
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_2');

      listGroupDimensions.registerItem('header_3');
      listGroupDimensions.registerList('list_3', {
        data: buildData(2),
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_3');

      listGroupDimensions.registerItem('header_4');
      listGroupDimensions.registerList('list_4', {
        data: buildData(2),
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_4');

      listGroupDimensions.registerItem('header_5');
      listGroupDimensions.registerList('list_5', {
        data: buildData(2),
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_5');

      listGroupDimensions.registerItem('header_6');
      listGroupDimensions.registerList('list_6', {
        data: buildData(50),
        keyExtractor: defaultKeyExtractor,
      });
      listGroupDimensions.registerItem('footer_6');

      listGroupDimensions.registerItem('header_7');
      listGroupDimensions.registerList('list_7', {
        data: buildData(2),
        keyExtractor: defaultKeyExtractor,
        getItemLayout: (item, index) => ({ length: 100, index }),
      });
      listGroupDimensions.registerItem('footer_7');

      listGroupDimensions.store.dispatch({
        type: ActionType.HydrationWithBatchUpdate,
        payload: {
          dimension: listGroupDimensions,
          scrollMetrics: {
            offset: 2000,
            contentLength: 5000,
            visibleLength: 926,
          },
        },
      });

      expect(listGroupDimensions.store.getState()).toEqual({
        actionType: ActionType.HydrationWithBatchUpdate,
        visibleStartIndex: 0,
        visibleEndIndex: 23,
        bufferedStartIndex: 0,
        bufferedEndIndex: 9,
      });
    });
  });
}
