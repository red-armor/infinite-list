import type { FC, ForwardedRef, PropsWithChildren } from 'react';
import * as React from 'react';
import { useCallback, useContext, useMemo } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { ScrollView } from 'react-native';
import throttle from '@x-oasis/throttle';
import ScrollViewContext from '../context/ScrollViewContext';
import RefreshControl from '../controller/RefreshControl';
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
    scrollEnabled,
    ...restProps
  } = props;

  const contextValues = useContext(ScrollViewContext);
  const { marshal, intersectionObserver } = contextValues;
  const scrollHelper = marshal!.getScrollHelper();
  const horizontal = marshal!.isHorizontal();

  const [_scrollEnabled] = useScrollEnabled({
    scrollEnabled: !!scrollEnabled,
    scrollHelper,
  });

  const throttledHandler = useMemo(() => {
    function handler(e: NativeSyntheticEvent<NativeScrollEvent>) {
      scrollHelper?.onScroll(e);
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

    scrollHelper.onLayout(e);
  }, []);

  return (
    <ScrollView
      {...scrollHelper.getEventHandlers()}
      {...restProps}
      horizontal={horizontal}
      ref={forwardRef}
      onLayout={layoutHandler}
      onScroll={throttledHandler}
      scrollEnabled={_scrollEnabled}
      scrollEventThrottle={scrollEventThrottle}
    >
      <RefreshControl />
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
