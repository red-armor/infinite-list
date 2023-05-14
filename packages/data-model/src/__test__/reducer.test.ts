import createStore from '../state/createStore';
import ListDimensions from '../ListDimensions';
import ListGroupDimensions from '../ListGroupDimensions';
import Batchinator from '@x-oasis/batchinator';
import { defaultKeyExtractor } from '../exportedUtils';
import { ActionType } from '../state/types';
import { vi, describe, it, expect } from 'vitest';
const buildData = (count: number) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index,
  }));
vi.spyOn(Batchinator.prototype, 'schedule').mockImplementation(function (
  ...args
) {
  // eslint-disable-next-line prefer-spread
  this._callback.apply(this, args);
});

describe('reducer', () => {
  it('basic scrollDown', () => {
    const store = createStore();
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
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

    store.dispatch({
      type: ActionType.ScrollDown,
      payload: {
        dimension: listGroupDimensions,
        scrollMetrics: {
          offset: 1000,
          contentLength: 5000,
          visibleLength: 926,
        },
      },
    });

    expect(listGroupDimensions.getContainerOffset()).toBe(2000);
    expect(store.getState()).toEqual({
      actionType: ActionType.ScrollDown,
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: 0,
      bufferedEndIndex: 17,
    });
  });

  it('basic scrollDown, `bufferedEndIndex` should be preserved (17 -> 19)', () => {
    const store = createStore();
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
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

    store.dispatch({
      type: ActionType.HydrationWithBatchUpdate,
      payload: {
        dimension: listGroupDimensions,
        scrollMetrics: {
          offset: 0,
          contentLength: 2000,
          visibleLength: 926,
        },
      },
    });

    expect(store.getState()).toEqual({
      actionType: ActionType.HydrationWithBatchUpdate,
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: 0,
      bufferedEndIndex: 19,
    });

    store.dispatch({
      type: ActionType.ScrollDown,
      payload: {
        dimension: listGroupDimensions,
        scrollMetrics: {
          offset: 1000,
          contentLength: 5000,
          visibleLength: 926,
        },
      },
    });

    expect(listGroupDimensions.getContainerOffset()).toBe(2000);
    expect(store.getState()).toEqual({
      actionType: ActionType.ScrollDown,
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: 0,
      bufferedEndIndex: 19,
    });
  });

  it('with ignoredToPerBatch', () => {
    const store = createStore();
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    listGroupDimensions.registerItem('header_1', true);
    listGroupDimensions.registerList('list_1', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerItem('footer_1', true);

    listGroupDimensions.registerList('list_2', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
    });

    store.dispatch({
      type: ActionType.HydrationWithBatchUpdate,
      payload: {
        dimension: listGroupDimensions,
        scrollMetrics: {
          offset: 2000,
          contentLength: 2000,
          visibleLength: 926,
        },
      },
    });

    expect(store.getState()).toEqual({
      actionType: ActionType.HydrationWithBatchUpdate,
      visibleStartIndex: 0,
      visibleEndIndex: 0,
      bufferedStartIndex: 0,
      bufferedEndIndex: 10,
      distanceFromEnd: undefined,
      isEndReached: undefined,
    });
  });

  it('without ignoredToPerBatch', () => {
    const store = createStore();
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
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

    store.dispatch({
      type: ActionType.HydrationWithBatchUpdate,
      payload: {
        dimension: listGroupDimensions,
        scrollMetrics: {
          offset: 2000,
          contentLength: 2000,
          visibleLength: 926,
        },
      },
    });

    expect(store.getState()).toEqual({
      actionType: ActionType.HydrationWithBatchUpdate,
      visibleStartIndex: 0,
      visibleEndIndex: 0,
      bufferedStartIndex: 0,
      bufferedEndIndex: 9,
    });
  });

  it('with ignoredToPerBatch - with layout', () => {
    const store = createStore();
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    listGroupDimensions.registerItem('header_1', true);
    listGroupDimensions.registerList('list_1', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 40, index }),
    });
    listGroupDimensions.registerItem('footer_1', true);

    listGroupDimensions.registerList('list_2', {
      data: buildData(20),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 100, index }),
    });

    listGroupDimensions.setKeyItemLayout('header_1', 'header_1', 200);
    listGroupDimensions.setKeyItemLayout('footer_1', 'footer_1', 30);
    store.dispatch({
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

    expect(store.getState()).toEqual({
      actionType: ActionType.HydrationWithBatchUpdate,
      visibleStartIndex: 0,
      visibleEndIndex: 19,
      bufferedStartIndex: 0,
      bufferedEndIndex: 33,
    });
  });

  it('with ignoredToPerBatch', () => {
    const store = createStore();
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
      maxToRenderPerBatch: 10,
      getContainerLayout: () => ({
        x: 0,
        y: 2000,
        width: 375,
        height: 2000,
      }),
    });

    listGroupDimensions.registerItem('header_1', true);
    listGroupDimensions.registerList('list_1', {
      data: buildData(2),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerItem('footer_1', true);

    listGroupDimensions.registerItem('header_2', true);
    listGroupDimensions.registerList('list_2', {
      data: buildData(1),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerItem('footer_2', true);

    listGroupDimensions.registerItem('header_3', true);
    listGroupDimensions.registerList('list_3', {
      data: buildData(2),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerItem('footer_3', true);

    listGroupDimensions.registerItem('header_4', true);
    listGroupDimensions.registerList('list_4', {
      data: buildData(2),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerItem('footer_4', true);

    listGroupDimensions.registerItem('header_5', true);
    listGroupDimensions.registerList('list_5', {
      data: buildData(2),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerItem('footer_5', true);

    listGroupDimensions.registerItem('header_6', true);
    listGroupDimensions.registerList('list_6', {
      data: buildData(50),
      keyExtractor: defaultKeyExtractor,
    });
    listGroupDimensions.registerItem('footer_6', true);

    listGroupDimensions.registerItem('header_7', true);
    listGroupDimensions.registerList('list_7', {
      data: buildData(2),
      keyExtractor: defaultKeyExtractor,
      getItemLayout: (item, index) => ({ length: 100, index }),
    });
    listGroupDimensions.registerItem('footer_7', true);

    store.dispatch({
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

    expect(store.getState()).toEqual({
      actionType: ActionType.HydrationWithBatchUpdate,
      visibleStartIndex: 0,
      visibleEndIndex: 20,
      bufferedStartIndex: 0,
      bufferedEndIndex: 20,
    });
  });

  it('without ignoredToPerBatch', () => {
    const store = createStore();
    const listGroupDimensions = new ListGroupDimensions({
      id: 'list_group',
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

    store.dispatch({
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

    expect(store.getState()).toEqual({
      actionType: ActionType.HydrationWithBatchUpdate,
      visibleStartIndex: 0,
      visibleEndIndex: 9,
      bufferedStartIndex: 0,
      bufferedEndIndex: 9,
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
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
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
      data: [],
      actionType: 'initial',
    });

    list.setData(data);

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    list.setKeyItemLayout('3', 100);

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1000,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 7,
      isEndReached: true,
      distanceFromEnd: 74,
      data: data.slice(0, 8),
      actionType: 'hydrationWithBatchUpdate',
    });

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1000,
    });

    const listState = list.state;

    expect(listState).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 7,
      isEndReached: true,
      distanceFromEnd: 74,
      data: data.slice(0, 8),
      actionType: 'hydrationWithBatchUpdate',
    });

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1001,
    });

    expect(list.state).toBe(listState);
  });
});

describe('resolveUnLayoutLimitation', () => {
  it('the max unLayout item should be not greater than `maxToRenderPerBatch`', () => {
    const data = buildData(100);

    const list = new ListDimensions({
      data: [],
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 2,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 0,
        width: 375,
        height: 2000,
      }),
    });

    expect(list.state).toEqual({
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: -1,
      bufferedEndIndex: -1,
      isEndReached: false,
      distanceFromEnd: 0,
      data: [],
      actionType: 'initial',
    });

    list.setData(data);

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 3,
      isEndReached: false,
      distanceFromEnd: 0,
      data: data.slice(0, 4),
      actionType: 'initial',
    });

    list.setKeyItemLayout('3', 100);

    // @ts-ignore
    list.updateScrollMetrics({
      offset: 0,
      visibleLength: 926,
      contentLength: 1000,
    });

    expect(list.state).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 3,
      bufferedStartIndex: 0,
      bufferedEndIndex: 7,
      isEndReached: true,
      distanceFromEnd: 74,
      data: data.slice(0, 8),
      actionType: 'hydrationWithBatchUpdate',
    });

    list.setKeyItemLayout('4', 100);

    list.updateScrollMetrics(
      // @ts-ignore
      {
        offset: 0,
        visibleLength: 926,
        contentLength: 1000,
      },
      false
    );

    const listState = list.state;

    expect(listState).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: 4,
      bufferedStartIndex: 0,
      bufferedEndIndex: 8,
      isEndReached: true,
      distanceFromEnd: 74,
      data: data.slice(0, 9),
      actionType: 'hydrationWithBatchUpdate',
    });

    list.updateScrollMetrics(
      // @ts-ignore
      {
        offset: 100,
        visibleLength: 926,
        contentLength: 1000,
      },
      false
    );

    expect(list.state).toEqual({
      visibleStartIndex: 3,
      visibleEndIndex: 4,
      bufferedStartIndex: 0,
      bufferedEndIndex: 11,
      isEndReached: true,
      distanceFromEnd: -26,
      data: data.slice(0, 12),
      actionType: 'hydrationWithBatchUpdate',
    });
  });
});

describe('Has trailing element', () => {
  it('rewrite onEndReached', () => {
    const data = buildData(30);

    const list = new ListDimensions({
      data,
      id: 'list_group',
      keyExtractor: defaultKeyExtractor,
      maxToRenderPerBatch: 7,
      windowSize: 2,
      initialNumToRender: 4,
      onEndReachedThreshold: 2,
      getContainerLayout: () => ({
        x: 0,
        y: 0,
        width: 375,
        height: 2000,
      }),
    });

    list.setKeyItemLayout('1', 100);
    list.setKeyItemLayout('2', 100);
    list.setKeyItemLayout('3', 100);
    list.setKeyItemLayout('4', 100);
    list.setKeyItemLayout('5', 100);
    list.setKeyItemLayout('6', 100);
    list.setKeyItemLayout('7', 100);
    list.setKeyItemLayout('8', 100);

    list.updateScrollMetrics(
      // @ts-ignore
      {
        offset: 100,
        visibleLength: 926,
        contentLength: 4000,
      },
      false
    );

    expect(list.state).toEqual({
      visibleStartIndex: 1,
      visibleEndIndex: 8,
      bufferedStartIndex: 0,
      bufferedEndIndex: 15,
      isEndReached: true,
      distanceFromEnd: 2974,
      data: data.slice(0, 16),
      actionType: 'hydrationWithBatchUpdate',
    });

    list.updateScrollMetrics(
      // @ts-ignore
      {
        offset: 1500,
        visibleLength: 926,
        contentLength: 6000,
      },
      false
    );

    let listState = list.state;

    expect(listState).toEqual({
      visibleStartIndex: 8,
      visibleEndIndex: 8,
      bufferedStartIndex: 6,
      bufferedEndIndex: 15,
      isEndReached: true,
      distanceFromEnd: 3574,
      data: data.slice(0, 16),
      actionType: 'hydrationWithBatchUpdate',
    });

    list.updateScrollMetrics(
      // @ts-ignore
      {
        offset: 1500,
        visibleLength: 926,
        contentLength: 6000,
      },
      false
    );

    expect(list.state).toBe(listState);

    list.updateScrollMetrics(
      // @ts-ignore
      {
        offset: 3000,
        visibleLength: 926,
        contentLength: 6000,
      },
      false
    );

    expect(list.state).toEqual({
      visibleStartIndex: 8,
      visibleEndIndex: 8,
      bufferedStartIndex: 8,
      bufferedEndIndex: 15,
      isEndReached: true,
      distanceFromEnd: 2074,
      data: data.slice(0, 16),
      actionType: 'hydrationWithBatchUpdate',
    });

    list.setKeyItemLayout('29', 100);
    list.updateScrollMetrics(
      // @ts-ignore
      {
        offset: 3010,
        visibleLength: 926,
        contentLength: 6000,
      },
      false
    );
    listState = list.state;
    expect(listState).toEqual({
      visibleStartIndex: 29,
      visibleEndIndex: 29,
      bufferedStartIndex: 29,
      bufferedEndIndex: 29,
      isEndReached: false,
      distanceFromEnd: 2064,
      data: data.slice(0, 30),
      actionType: 'recalculate',
    });

    list.updateScrollMetrics(
      // @ts-ignore
      {
        offset: 3500,
        visibleLength: 926,
        contentLength: 6000,
      },
      false
    );
    expect(list.state).toEqual({
      visibleStartIndex: 29,
      visibleEndIndex: 29,
      bufferedStartIndex: 29,
      bufferedEndIndex: 29,
      isEndReached: false,
      distanceFromEnd: 2064,
      data: data.slice(0, 30),
      actionType: 'hydrationWithBatchUpdate',
    });

    list.updateScrollMetrics(
      // @ts-ignore
      {
        offset: 1000,
        visibleLength: 926,
        contentLength: 6000,
      },
      false
    );
    expect(list.state).toEqual({
      visibleStartIndex: 29,
      visibleEndIndex: 29,
      bufferedStartIndex: 29,
      bufferedEndIndex: 29,
      isEndReached: false,
      distanceFromEnd: 2064,
      data: data.slice(0, 30),
      actionType: 'recalculate',
    });
  });
});
