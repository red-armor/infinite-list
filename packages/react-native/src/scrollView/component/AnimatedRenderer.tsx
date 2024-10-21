import throttle from '@x-oasis/throttle';
import React, {
  FC,
  ForwardedRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

import { useNativeRefreshControl } from '../commons/platform';
import useScrollEnabled from '../hooks/useScrollEnabled';
import SmoothControl from '../refresh/SmoothControl';
import { TRIGGER_ON_REFRESH_THRESHOLD_VALUE } from '../refresh/constants';
import {
  AnimatedScrollRendererProps,
  AnimatedScrollRendererPropsWithForwardRef,
} from '../types';

const AnimatedScrollRenderer: FC<AnimatedScrollRendererPropsWithForwardRef> = props => {
  const {
    onScroll,
    children,
    forwardRef,
    animatedValue,
    onLayout,
    horizontal,
    scrollEventThrottle,
    getScrollHelper,
    style = {},
    onRefresh,
    refreshing,
    scrollEnabled,
    useSmoothControl,
    scrollEventHelper,
    refreshControlStartCorrection,
    triggerOnRefreshThresholdValue = TRIGGER_ON_REFRESH_THRESHOLD_VALUE,
    refreshControlContentContainerStyle,
    ...restProps
  } = props;

  const [loading, setLoading] = useState(false);
  const scrollHelper = getScrollHelper();
  const lottieAnimatedValueRef = useRef(
    new Animated.Value(triggerOnRefreshThresholdValue)
  );
  const layoutRef = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [_scrollEnabled] = useScrollEnabled({
    scrollEnabled,
    scrollHelper,
  });

  const throttledHandler = useMemo(() => {
    function scrollHandler(e: NativeSyntheticEvent<NativeScrollEvent>) {
      scrollHelper.onScroll(e);
    }

    return throttle(scrollHandler, scrollEventThrottle, {
      persistArgs: args => {
        const e = args[0];
        return [
          {
            nativeEvent: { ...e.nativeEvent },
          },
        ];
      },
    });
  }, [onScroll, scrollEventThrottle, scrollHelper]);

  useEffect(() => {
    return scrollEventHelper.subscribeEventHandler('onScrollEndDrag', e => {
      const { nativeEvent } = e;
      const contentOffset = nativeEvent.contentOffset;

      const { y } = contentOffset;
      if (y < -triggerOnRefreshThresholdValue) {
        setLoading(true);
        lottieAnimatedValueRef.current.setValue(triggerOnRefreshThresholdValue);
        if (typeof onRefresh === 'function') {
          onRefresh();
        }
      }
    });
  }, []);

  const layoutHandler = useCallback((e: LayoutChangeEvent) => {
    // @ts-ignore
    layoutRef.current = e.nativeEvent.layout;
    if (typeof onLayout === 'function') {
      onLayout(e);
    }
    const {
      nativeEvent: { layout },
    } = e;

    scrollHelper.setLayout(layout);
    // scrollHelper.setLayoutMeasurement(layout);
  }, []);

  const contentOffset = useMemo(() => {
    if (horizontal)
      return {
        x: animatedValue.current,
      };

    return {
      y: animatedValue.current,
    };
  }, [horizontal]);

  const scrollViewStyle = useMemo(() => {
    return [
      style,
      !useNativeRefreshControl && typeof onRefresh === 'function'
        ? {
            transform: [
              {
                translateY: loading
                  ? Animated.multiply(
                      lottieAnimatedValueRef.current.interpolate({
                        inputRange: [0, triggerOnRefreshThresholdValue],
                        outputRange: [0, triggerOnRefreshThresholdValue],
                      }),
                      animatedValue.current.interpolate({
                        inputRange: [
                          triggerOnRefreshThresholdValue - 2,
                          triggerOnRefreshThresholdValue - 1,
                          triggerOnRefreshThresholdValue,
                          triggerOnRefreshThresholdValue + 1,
                        ],
                        outputRange: [1, 1, 0, 0],
                      })
                    )
                  : 0,
              },
            ],
          }
        : {},
    ];
  }, [loading]);

  return (
    <>
      {useSmoothControl && (
        <SmoothControl
          refreshing={refreshing}
          setLoading={setLoading}
          loading={loading}
          layoutRef={layoutRef}
          animatedValue={animatedValue}
          lottieAnimatedValueRef={lottieAnimatedValueRef}
          refreshControlStartCorrection={refreshControlStartCorrection}
          triggerOnRefreshThresholdValue={triggerOnRefreshThresholdValue}
          refreshControlContentContainerStyle={
            refreshControlContentContainerStyle
          }
        />
      )}
      <Animated.ScrollView
        ref={forwardRef}
        style={scrollViewStyle}
        horizontal={horizontal}
        {...restProps}
        scrollEnabled={_scrollEnabled}
        scrollEventThrottle={1}
        onLayout={layoutHandler}
        onScroll={Animated.event(
          [
            {
              nativeEvent: { contentOffset },
            },
          ],
          {
            listener: throttledHandler,
            useNativeDriver: true,
          }
        )}
      >
        {children}
      </Animated.ScrollView>
    </>
  );
};

const ForwardAnimatedScrollRenderer = React.forwardRef(
  (props: AnimatedScrollRendererProps, ref?: ForwardedRef<ScrollView>) => (
    <AnimatedScrollRenderer forwardRef={ref} {...props} />
  )
) as (props: PropsWithChildren<AnimatedScrollRendererProps>) => JSX.Element;

export default ForwardAnimatedScrollRenderer;
