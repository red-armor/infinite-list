import throttle from '@x-oasis/throttle';
import React, {
  FC,
  ForwardedRef,
  PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
  useState,
  useContext,
  useEffect,
} from 'react';
import {
  Animated,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import ScrollViewContext from '../context/ScrollViewContext';
import { DEFAULT_VIEW_LAYOUT } from '../commons/constants';
import { useNativeRefreshControl } from '../commons/platform';
import useScrollEnabled from '../hooks/useScrollEnabled';
import useInitialEffect from '../hooks/useInitialEffect';
import SmoothControl from '../refresh/SmoothControl';
import { TRIGGER_ON_REFRESH_THRESHOLD_VALUE } from '../refresh/constants';
import {
  AnimatedScrollRendererProps,
  AnimatedScrollRendererPropsWithForwardRef,
} from '../types';

const AnimatedScrollRenderer: FC<AnimatedScrollRendererPropsWithForwardRef> = (
  props
) => {
  const {
    onScroll,
    children,
    forwardRef,
    onLayout,
    scrollEventThrottle,
    style = {},
    onRefresh,
    refreshing,
    scrollEnabled,
    useSmoothControl,
    refreshControlStartCorrection,
    triggerOnRefreshThresholdValue = TRIGGER_ON_REFRESH_THRESHOLD_VALUE,
    refreshControlContentContainerStyle,
    ...restProps
  } = props;
  const [loading, setLoading] = useState(false);
  const contextValues = useContext(ScrollViewContext);
  const { marshal, intersectionObserver } = contextValues;
  const scrollHelper = marshal!.getScrollHelper();
  const animatedValue = useMemo(() => marshal!.getAnimatedValue(), [marshal]);
  const horizontal = marshal!.isHorizontal();

  const lottieAnimatedValueRef = useRef(
    new Animated.Value(triggerOnRefreshThresholdValue)
  );
  const layoutRef = useRef(DEFAULT_VIEW_LAYOUT);
  const [_scrollEnabled] = useScrollEnabled({
    scrollEnabled: !!scrollEnabled,
    scrollHelper,
  });

  useEffect(() => {
    animatedValue.addListener(({ value }) => {
      console.log('value --- ', value);
    });
  }, []);

  const throttledHandler = useMemo(() => {
    function scrollHandler(e: NativeSyntheticEvent<NativeScrollEvent>) {
      scrollHelper.onScroll(e);
      marshal?.ownerDocument?.onScroll(e);
    }

    return throttle(scrollHandler, scrollEventThrottle, {
      persistArgs: (args) => {
        const e = args[0];
        return [
          {
            nativeEvent: { ...e.nativeEvent },
          },
        ];
      },
    });
  }, [onScroll, scrollEventThrottle, scrollHelper]);

  useInitialEffect(() =>
    marshal
      ?.getScrollHelper()
      .addEventListener(
        'onScrollEndDrag',
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          marshal?.ownerDocument?.onScroll(e);
          const { nativeEvent } = e;
          const contentOffset = nativeEvent.contentOffset;

          const { y } = contentOffset;
          if (y < -triggerOnRefreshThresholdValue) {
            setLoading(true);
            lottieAnimatedValueRef.current.setValue(
              triggerOnRefreshThresholdValue
            );
            if (typeof onRefresh === 'function') {
              onRefresh();
            }
          }
        }
      )
  );
  useInitialEffect(() =>
    marshal?.getScrollHelper().addEventListener('onContentSizeChange', () => {
      intersectionObserver?.updateIntersections();
    })
  );

  const layoutHandler = useCallback((e: LayoutChangeEvent) => {
    layoutRef.current = e.nativeEvent.layout;
    if (typeof onLayout === 'function') {
      onLayout(e);
    }
    intersectionObserver?.updateIntersections();
    const {
      nativeEvent: { layout },
    } = e;

    scrollHelper.setLayout(layout);
  }, []);

  const contentOffset = useMemo(() => {
    if (horizontal)
      return {
        x: animatedValue,
      };

    return {
      y: animatedValue,
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
                      animatedValue.interpolate({
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
        {...scrollHelper.getEventHandlers()}
        scrollEnabled={_scrollEnabled}
        scrollEventThrottle={1}
        onLayout={layoutHandler}
        onScroll={Animated.event(
          [
            {
              // @ts-ignore
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
