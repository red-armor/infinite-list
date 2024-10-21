import { MutableRefObject, useCallback, useEffect, useMemo } from 'react';
import {
  Platform,
  LayoutChangeEvent,
  UIManager,
  findNodeHandle,
} from 'react-native';

type Layout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const isIos = Platform.OS === 'ios';

export default (
  itemRef: MutableRefObject<React.Component<any, any>>,
  container: MutableRefObject<React.Component<any, any>>,
  options: {
    onLayout?: Function;
    getCurrentKey?: () => string;
    isIntervalTreeItem?: boolean;
    onMeasureLayout?: Function;
  }
) => {
  const { onMeasureLayout: _onMeasureLayout, onLayout, isIntervalTreeItem } =
    options || {};
  const onMeasureLayout = useCallback((newLayout: Layout) => {
    if (typeof _onMeasureLayout === 'function') {
      _onMeasureLayout(
        newLayout.x,
        newLayout.y,
        newLayout.width,
        newLayout.height
      );
    }
  }, []);
  const layoutHandler = useMemo(
    () => (e: LayoutChangeEvent) => {
      if (typeof onLayout === 'function') onLayout(e);
      onMeasureLayout(e.nativeEvent.layout);
    },
    [onLayout]
  );

  const onMeasureLayoutSuccess = useCallback((x, y, width, height) => {
    onMeasureLayout({ x, y, width, height });
  }, []);

  const onMeasureLayoutFailed = useCallback(() => {
    console.warn(
      "useViewable: Encountered an error while measuring a list's" +
        ' offset from its containing ScrollView.'
    );
  }, []);

  const handler = useCallback(() => {
    if (!itemRef.current) return;

    // @ts-ignore
    if (typeof itemRef.current?.measureLayout === 'function') {
      // @ts-ignore
      itemRef.current.measureLayout(
        container.current,
        onMeasureLayoutSuccess,
        onMeasureLayoutFailed
      );
    } else {
      UIManager.measureLayout(
        findNodeHandle(itemRef.current),
        findNodeHandle(container.current),
        onMeasureLayoutFailed,
        onMeasureLayoutSuccess
      );
    }
  }, []);

  useEffect(() => {
    // 这个主要是解如果不是list的话，onLayout给出的y是0
    if (!isIntervalTreeItem) setTimeout(() => handler(), isIos ? 0 : 50);
  }, []);

  return {
    handler,
    layoutHandler,
  };
};
