import React, {
  FC,
  ForwardedRef,
  PropsWithChildren,
  useCallback,
  useContext,
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
import throttle from '@x-oasis/throttle';
import { DEFAULT_VIEW_LAYOUT } from '../commons/constants';
import ScrollViewContext from '../context/ScrollViewContext';
import RefreshControl from '../controller/RefreshControl';
import useScrollEnabled from '../hooks/useScrollEnabled';
import {
  AnimatedScrollRendererProps,
  AnimatedScrollRendererPropsWithForwardRef,
} from '../types';

const noop = () => {
  // do nothing
};

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
    onRefresh = noop,
    refreshing,
    scrollEnabled,
    useSmoothControl,
    refreshControlStartCorrection,
    refreshControlContentContainerStyle,
    ...restProps
  } = props;
  const [loading] = useState(false);
  const contextValues = useContext(ScrollViewContext);
  const { marshal } = contextValues;
  const scrollHelper = marshal!.getScrollHelper();
  const animatedValue = useMemo(() => marshal!.getAnimatedValue(), [marshal]);
  const horizontal = marshal!.isHorizontal();

  const layoutRef = useRef(DEFAULT_VIEW_LAYOUT);
  const [_scrollEnabled] = useScrollEnabled({
    scrollEnabled: !!scrollEnabled,
    scrollHelper,
  });

  const throttledHandler = useMemo(() => {
    function scrollHandler(e: NativeSyntheticEvent<NativeScrollEvent>) {
      scrollHelper.onScroll(e);
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

  // useInitialEffect(() =>
  //   marshal
  //     ?.getScrollHelper()
  //     .addEventListener(
  //       'onScrollEndDrag',
  //       (e: NativeSyntheticEvent<NativeScrollEvent>) => {
  //         const { nativeEvent } = e;
  //         const contentOffset = nativeEvent.contentOffset;

  //         const { y } = contentOffset;

  //         console.log('--------', y);

  //         if (y < -triggerOnRefreshThresholdValue) {
  //           console.log('set ----- tre');
  //           setLoading(true);
  //           lottieAnimatedValueRef.current.setValue(
  //             triggerOnRefreshThresholdValue
  //           );
  //           if (typeof onRefresh === 'function') {
  //             onRefresh();
  //           }
  //         }
  //       }
  //     )
  // );

  const layoutHandler = useCallback((e: LayoutChangeEvent) => {
    layoutRef.current = e.nativeEvent.layout;
    if (typeof onLayout === 'function') {
      onLayout(e);
    }
    scrollHelper.onLayout(e);
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
      // !useNativeRefreshControl && typeof onRefresh === 'function'
      //   ? {
      //       transform: [
      //         {
      //           translateY: loading
      //             ? Animated.multiply(
      //                 lottieAnimatedValueRef.current.interpolate({
      //                   inputRange: [0, triggerOnRefreshThresholdValue],
      //                   outputRange: [0, triggerOnRefreshThresholdValue],
      //                 }),
      //                 animatedValue.interpolate({
      //                   inputRange: [
      //                     triggerOnRefreshThresholdValue - 2,
      //                     triggerOnRefreshThresholdValue - 1,
      //                     triggerOnRefreshThresholdValue,
      //                     triggerOnRefreshThresholdValue + 1,
      //                   ],
      //                   outputRange: [1, 1, 0, 0],
      //                 })
      //               )
      //             : 0,
      //         },
      //       ],
      //     }
      //   : {},
    ];
  }, [loading]);

  return (
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
            // @ts-expect-error TODO: fix this
            nativeEvent: { contentOffset },
          },
        ],
        {
          listener: throttledHandler,
          useNativeDriver: true,
        }
      )}
    >
      <RefreshControl />
      {children}
    </Animated.ScrollView>
  );
};

const ForwardAnimatedScrollRenderer = React.forwardRef(
  (props: AnimatedScrollRendererProps, ref?: ForwardedRef<ScrollView>) => (
    <AnimatedScrollRenderer forwardRef={ref} {...props} />
  )
) as (props: PropsWithChildren<AnimatedScrollRendererProps>) => JSX.Element;

export default ForwardAnimatedScrollRenderer;
