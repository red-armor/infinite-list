import createStore from '../state/createStore';
import ListGroupDimensions from '../ListGroupDimensions';
import Batchinator from '@x-oasis/batchinator';
import { defaultKeyExtractor } from '../exportedUtils';
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
      type: 'scrollDown',
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
      type: 'hydrationWithBatchUpdate',
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
      visibleStartIndex: -1,
      visibleEndIndex: -1,
      bufferedStartIndex: 0,
      bufferedEndIndex: 19,
    });

    store.dispatch({
      type: 'scrollDown',
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
      type: 'hydrationWithBatchUpdate',
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
      type: 'hydrationWithBatchUpdate',
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
      type: 'hydrationWithBatchUpdate',
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
      type: 'hydrationWithBatchUpdate',
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
      type: 'hydrationWithBatchUpdate',
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
      visibleStartIndex: 0,
      visibleEndIndex: 9,
      bufferedStartIndex: 0,
      bufferedEndIndex: 9,
    });
  });
});
