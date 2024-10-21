import React, {
  FC,
  ForwardedRef,
  PropsWithChildren,
  useCallback,
  useMemo,
} from 'react';
import {
  Animated,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  ViewPagerAndroidOnPageScrollEventData,
} from 'react-native';
import _PagerView from 'react-native-pager-view';

import {
  AnimatedViewPagerRenderProps,
  AnimatedViewPagerRenderPropsWithForwardRef,
} from '../types';
// https://reactnative.dev/docs/0.60/viewpagerandroid
import { PagerView } from './PagerViewAdapter';

const AnimatedViewPagerRenderer: FC<AnimatedViewPagerRenderPropsWithForwardRef> = props => {
  const {
    style = {},
    children,
    onPageSelected,
    pagerOffsetRef,
    pagerPositionRef,
    forwardRef,
    onLayout,
    getScrollHelper,
    onPageScroll,
  } = props;

  const AnimatedViewPagerAndroid = useMemo(
    () => Animated.createAnimatedComponent(PagerView),
    []
  );

  const onPageSelectedHandler = useCallback(e => {
    if (typeof onPageSelected === 'function') {
      onPageSelected(e);
    }
  }, []);

  const scrollHelper = getScrollHelper();

  const layoutHandler = useCallback((e: LayoutChangeEvent) => {
    if (typeof onLayout === 'function') {
      onLayout(e);
    }
    const {
      nativeEvent: { layout },
    } = e;

    scrollHelper.setLayout(layout);
    // scrollHelper.setLayoutMeasurement(layout);
  }, []);

  const onPageScrollHandler = useCallback(
    (e: NativeSyntheticEvent<ViewPagerAndroidOnPageScrollEventData>) => {
      if (typeof onPageScroll === 'function') {
        onPageScroll({
          nativeEvent: { ...e.nativeEvent },
        } as NativeSyntheticEvent<ViewPagerAndroidOnPageScrollEventData>);
      }
    },
    []
  );

  return (
    <AnimatedViewPagerAndroid
      ref={forwardRef}
      style={style}
      onLayout={layoutHandler}
      onPageScroll={Animated.event(
        [
          {
            nativeEvent: {
              offset: pagerOffsetRef.current,
              position: pagerPositionRef.current,
            },
          },
        ],
        {
          useNativeDriver: true,
          listener: onPageScrollHandler,
        }
      )}
      onPageSelected={onPageSelectedHandler}
    >
      {children}
    </AnimatedViewPagerAndroid>
  );
};

const ForwardAnimatedScrollRenderer = React.forwardRef(
  (props: AnimatedViewPagerRenderProps, ref?: ForwardedRef<_PagerView>) => (
    <AnimatedViewPagerRenderer forwardRef={ref} {...props} />
  )
) as (props: PropsWithChildren<AnimatedViewPagerRenderProps>) => JSX.Element;

export default ForwardAnimatedScrollRenderer;
