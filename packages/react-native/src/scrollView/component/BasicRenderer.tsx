import throttle from '@x-oasis/throttle';
import type {
  FC,
  ForwardedRef,
  PropsWithChildren} from 'react';
import * as React from 'react';
import {
  useCallback,
  useMemo,
} from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent} from 'react-native';
import {
  ScrollView,
} from 'react-native';

import useScrollEnabled from '../hooks/useScrollEnabled';
import type {
  ScrollRendererProps,
  ScrollRendererPropsWithForwardRef,
} from '../types';

const BasicScrollRenderer: FC<ScrollRendererPropsWithForwardRef> = (props) => {
  const {
    children,
    onScroll,
    forwardRef,
    onLayout,
    scrollEventThrottle,
    getScrollHelper,
    scrollEnabled,
    ...restProps
  } = props;
  const scrollHelper = getScrollHelper();

  const [_scrollEnabled] = useScrollEnabled({
    // @ts-ignore
    scrollEnabled,
    scrollHelper,
  });

  const throttledHandler = useMemo(() => {
    function handler(e: NativeSyntheticEvent<NativeScrollEvent>) {
      scrollHelper.onScroll(e);
    }

    return throttle(handler, scrollEventThrottle, {
      persistArgs: (args) => {
        const e = args[0];
        return [
          {
            nativeEvent: {
              ...e.nativeEvent,
            },
          },
        ];
      },
    });
  }, [onScroll, scrollEventThrottle, scrollHelper]);

  const layoutHandler = useCallback((e: LayoutChangeEvent) => {
    if (typeof onLayout === 'function') {
      onLayout(e);
    }

    const {
      nativeEvent: { layout },
    } = e;

    scrollHelper.setLayout(layout);
  }, []);

  return (
    <ScrollView
      {...restProps}
      ref={forwardRef}
      onLayout={layoutHandler}
      onScroll={throttledHandler}
      scrollEnabled={_scrollEnabled}
      scrollEventThrottle={scrollEventThrottle}
    >
      {children}
    </ScrollView>
  );
};

// https://stackoverflow.com/a/51898192/2006805
const ForwardBasicScrollRenderer = React.forwardRef(
  (props: ScrollRendererProps, forwardRef: ForwardedRef<ScrollView>) => (
    <BasicScrollRenderer forwardRef={forwardRef} {...props} />
  )
) as (props: PropsWithChildren<ScrollRendererProps>) => JSX.Element;

export default ForwardBasicScrollRenderer;
