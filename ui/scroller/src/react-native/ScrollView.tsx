import { ItemsDimensions } from '@infinite-list/items-dimensions';
import isRefObject from '@x-oasis/is-ref';
import React, {
  FC,
  ForwardedRef,
  MutableRefObject,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Animated,
  RefreshControl as RNRefreshControl,
  ScrollView as RNScrollView,
  View as RNView,
  Platform,
} from 'react-native';
import { IntersectionObserver } from '@infinite-list/intersection-observer/react-native';

import Marshal from './Marshal';
import ScrollEventHelper from './ScrollEventHelper';
import ScrollHelper from './ScrollHelper';
import { DEFAULT_SCROLL_EVENT_THROTTLE } from './commons/constants';
import { isIos } from './commons/platform';
import AnimatedRenderer from './component/AnimatedRenderer';
import BasicRenderer from './component/BasicRenderer';
import ViewRenderer from './component/ViewRenderer';
import { defaultViewabilityConfigCallbackPairs } from './constants';
import ScrollUpdatingContext from './context/ScrollUpdatingContext';
import ScrollViewContext from './context/ScrollViewContext';
import FooterPortalContainer from './portal/FooterContainer';
import HeaderPortalContainer from './portal/HeaderContainer';
import PortalManager from './portal/Manager';
import {
  ScrollToOption,
  SpectrumScrollViewProps,
  SpectrumScrollViewPropsWithForwardRef,
  SpectrumScrollViewPropsWithRef,
} from './types';
import { resolveScrollViewKey } from './commons/utils';

const ScrollView: FC<SpectrumScrollViewPropsWithForwardRef> = (props) => {
  const {
    id,
    forwardRef,

    animatedY,
    animatedX,

    setMarshal,
    stickyMode,

    onRefresh,
    refreshing,
    refreshControl,

    animated = false,
    viewabilityConfig,
    horizontal: _horizontal,
    enableViewPager = false,

    /**
     * event handlers begin
     */
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    onContentSizeChange,
    onScrollToTop,
    /**
     * event handlers end
     */

    pagerOffsetRef: _pagerOffsetRef,
    pagerPositionRef: _pagerPositionRef,
    viewabilityConfigCallbackPairs = defaultViewabilityConfigCallbackPairs,
    scrollUpdating = true,
    removeClippedSubviews: _removeClippedSubviews,
    scrollEventThrottle = DEFAULT_SCROLL_EVENT_THROTTLE,
    children,
    scrollEnabled = true,
    ...rest
  } = props;
  const horizontal = useMemo(() => !!_horizontal, []);
  const scrollViewKey = useMemo(() => resolveScrollViewKey(horizontal), []);

  /**
   * In android device, `removeClippedSubviews` used with zIndex will crash.
   */
  const scrollViewContextValues = useContext(ScrollViewContext);

  const removeClippedSubviews = false;
  const scrollHelperDisposerRef = useRef<Function>();
  const { marshal: parentMarshal, intersectionObserver } =
    scrollViewContextValues;
  const defaultScrollViewRef = useRef<RNScrollView | RNView>();
  const scrollViewRef = (
    isRefObject(forwardRef) ? forwardRef : defaultScrollViewRef
  ) as MutableRefObject<RNScrollView>;

  const portalManager = useMemo(() => new PortalManager(), []);
  const shouldBeView = false;

  const defaultAnimatedValueX = useRef(new Animated.Value(0));
  const defaultAnimatedValueY = useRef(new Animated.Value(0));
  const animatedValueY = animatedY || defaultAnimatedValueY;
  const animatedValueX = animatedX || defaultAnimatedValueX;

  let rootScrollHelper: ScrollHelper | undefined =
    parentMarshal?.getScrollHelper();
  let isRootScrollView = false;

  if (
    !rootScrollHelper ||
    (rootScrollHelper && rootScrollHelper.getHorizontal() !== horizontal)
  ) {
    rootScrollHelper = new ScrollHelper({
      id: scrollViewKey,
      stickyMode,
      horizontal,
      ref: scrollViewRef,
      ownerScrollHelper: rootScrollHelper,
    });
    isRootScrollView = true;
  }

  const scrollEventHelper = useMemo(
    () =>
      new ScrollEventHelper({
        onScroll,
        onScrollEndDrag,
        onScrollBeginDrag,
        onContentSizeChange,
        onMomentumScrollEnd,
        onMomentumScrollBegin,
        scrollHelper: rootScrollHelper,
      }),
    []
  );

  scrollEventHelper.updateInternalHandlers({
    onScroll,
    onScrollToTop,
    onScrollEndDrag,
    onScrollBeginDrag,
    onContentSizeChange,
    onMomentumScrollEnd,
    onMomentumScrollBegin,
  });

  /**
   * Every scrollView has a marshal
   */
  const marshal = useMemo(() => {
    return new Marshal({
      id: scrollViewKey,
      animated,
      animatedValueY,
      animatedValueX,
      parentMarshal,
      scrollUpdating,
      ref: scrollViewRef,
      horizontal,
      scrollHelper: rootScrollHelper,
      scrollEventHelper: scrollEventHelper,
      dimensions: viewabilityContextValues.dimensions,
    });
  }, []);

  useEffect(
    () => () => {
      if (typeof scrollHelperDisposerRef.current === 'function') {
        scrollHelperDisposerRef.current();
      }

      if (typeof forwardRef === 'function') {
        forwardRef(scrollViewRef.current);
      }
    },
    []
  );

  const nextOnRefresh = useMemo(() => {
    if (!onRefresh) return null;
    if (typeof onRefresh === 'function')
      return () => {
        onRefresh();
        rootScrollHelper.invokeOnRefreshListener();
      };
    return null;
  }, [onRefresh]);

  const useSmoothControl = useMemo(
    () => typeof nextOnRefresh === 'function' && isIos,
    []
  );

  const viewabilityContextValues = useMemo(() => {
    const dimensions = new ItemsDimensions({
      id: scrollViewKey,
      horizontal,
      viewabilityConfig,
      viewabilityConfigCallbackPairs,
      canIUseRIC: Platform.OS !== 'ios',
    });
    return { dimensions };
  }, []);

  useEffect(
    () => () => {
      marshal.dispose();
      scrollEventHelper.dispose();
    },
    []
  );

  const nextIntersectionObserver = useMemo(() => {
    if (!intersectionObserver) return intersectionObserver;
    return new IntersectionObserver();
  }, []);

  const nextScrollViewContextValues = useMemo(
    () => ({
      marshal,
      intersectionObserver: nextIntersectionObserver,
    }),
    []
  );

  const nextScrollUpdatingContextValues = useMemo(
    () => ({
      scrollUpdating,
    }),
    [scrollUpdating]
  );

  const nextChildren = useMemo(() => {
    if (shouldBeView) return children;
    return (
      <ScrollUpdatingContext.Provider value={nextScrollUpdatingContextValues}>
        {isIos && !useSmoothControl ? refreshControl : null}
        {children}
      </ScrollUpdatingContext.Provider>
    );
  }, [children, shouldBeView]);

  const _refreshControl = useMemo(() => {
    if (!nextOnRefresh) return null;
    if (isIos) return null;
    return (
      <RNRefreshControl refreshing={!!refreshing} onRefresh={nextOnRefresh} />
    );
  }, [refreshing]);

  const refreshControlProps = _refreshControl
    ? {
        refreshControl: _refreshControl,
      }
    : {};

  if (!enableViewPager && !!shouldBeView)
    return (
      <ScrollViewContext.Provider value={nextScrollViewContextValues}>
        <HeaderPortalContainer />
        <ViewRenderer
          ref={scrollViewRef as any as MutableRefObject<RNView>}
          {...rest}
        >
          {nextChildren}
        </ViewRenderer>
        <FooterPortalContainer />
      </ScrollViewContext.Provider>
    );

  if (!enableViewPager && !shouldBeView && !!animated)
    return (
      <ScrollViewContext.Provider value={nextScrollViewContextValues}>
        <HeaderPortalContainer />
        <AnimatedRenderer
          ref={scrollViewRef as MutableRefObject<RNScrollView>}
          {...rest}
          {...refreshControlProps}
          onRefresh={nextOnRefresh}
          refreshing={refreshing}
          scrollEventHelper={scrollEventHelper}
          useSmoothControl={useSmoothControl}
        >
          {nextChildren}
        </AnimatedRenderer>
        <FooterPortalContainer />
      </ScrollViewContext.Provider>
    );

  return (
    <ScrollViewContext.Provider value={nextScrollViewContextValues}>
      <HeaderPortalContainer />
      <BasicRenderer
        ref={scrollViewRef as MutableRefObject<RNScrollView>}
        {...rest}
        {...refreshControlProps}
      >
        {nextChildren}
      </BasicRenderer>
      <FooterPortalContainer />
    </ScrollViewContext.Provider>
  );
};

// https://stackoverflow.com/a/51898192/2006805
const ForwardScrollView = React.forwardRef(
  (props: SpectrumScrollViewProps, forwardRef: ForwardedRef<RNScrollView>) => (
    <ScrollView forwardRef={forwardRef} {...props} />
  )
) as (props: PropsWithChildren<SpectrumScrollViewPropsWithRef>) => JSX.Element;

export default ForwardScrollView;
