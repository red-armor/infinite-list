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
import ViewabilityContext from './context/ViewabilityContext';
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
    onScroll,
    forwardRef,

    animatedY,
    animatedX,

    setMarshal,
    stickyMode,

    onRefresh,
    refreshing,
    refreshControl,

    onScrollEndDrag,
    animated = false,
    viewabilityConfig,
    onScrollBeginDrag,
    horizontal: _horizontal,
    onMomentumScrollEnd,
    onContentSizeChange,
    onMomentumScrollBegin,
    enableViewPager = false,

    pagerOffsetRef: _pagerOffsetRef,
    pagerPositionRef: _pagerPositionRef,
    onEndReachedThreshold = 1,
    viewabilityConfigCallbackPairs = defaultViewabilityConfigCallbackPairs,
    onEndReachedTimeoutThreshold = 200,
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
  const { marshal: parentMarshal } = scrollViewContextValues;
  const defaultScrollViewRef = useRef<RNScrollView | RNView>();
  const scrollViewRef = (
    isRefObject(forwardRef) ? forwardRef : defaultScrollViewRef
  ) as MutableRefObject<RNScrollView>;

  const portalManager = useMemo(() => new PortalManager(), []);

  const defaultAnimatedValueX = useRef(new Animated.Value(0));
  const defaultAnimatedValueY = useRef(new Animated.Value(0));
  const animatedValueY = animatedY || defaultAnimatedValueY;
  const animatedValueX = animatedX || defaultAnimatedValueX;

  const animatedValue = useMemo(
    () => (horizontal ? animatedValueX : animatedValueY),
    []
  );
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
      animatedValue,
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

  useEffect(() => {
    scrollEventHelper.updateInternalHandler('onScroll', onScroll);
    scrollEventHelper.updateInternalHandler('onScrollEndDrag', onScrollEndDrag);
    scrollEventHelper.updateInternalHandler(
      'onScrollBeginDrag',
      onScrollBeginDrag
    );
    scrollEventHelper.updateInternalHandler(
      'onContentSizeChange',
      onContentSizeChange
    );
    scrollEventHelper.updateInternalHandler(
      'onMomentumScrollEnd',
      onMomentumScrollEnd
    );
    scrollEventHelper.updateInternalHandler(
      'onMomentumScrollBegin',
      onMomentumScrollBegin
    );
  }, [
    onScroll,
    onScrollEndDrag,
    onScrollBeginDrag,
    onContentSizeChange,
    onMomentumScrollEnd,
    onMomentumScrollBegin,
  ]);

  /**
   * Every scrollView has a marshal
   */
  const marshal = useMemo(() => {
    return new Marshal({
      id: scrollViewKey,
      animated,
      parentMarshal,
      scrollUpdating,
      ref: scrollViewRef,
      horizontal,
      outerMostVerticalMarshal,
      outerMostHorizontalMarshal,
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

  useEffect(() => {
    if (shouldBeView && !marshal.hasParent()) {
      throw new Error(
        '`shouldBeView` props should be used in `ScrollView`' +
          'wrapped with same orientation `ScrollView` Component'
      );
    }
  }, []);

  const eventHandlers = useMemo(() => {
    if (isARootContainer) return rootScrollHelper.getEventHandlers();
    return {};
  }, []);

  // const getScrollHelper = useCallback(() => rootScrollHelper, []);
  const getParentMarshal = useCallback(() => parentMarshal, []);

  const nextScrollViewContextValues = useMemo(() => ({ marshal }), []);
  const nextScrollUpdatingContextValues = useMemo(
    () => ({
      scrollUpdating,
    }),
    [scrollUpdating]
  );

  const nextChildren = useMemo(() => {
    if (shouldBeView)
      return (
        <ScrollViewContext.Provider value={nextScrollViewContextValues}>
          {children}
        </ScrollViewContext.Provider>
      );

    return (
      <ScrollViewContext.Provider value={nextScrollViewContextValues}>
        <ViewabilityContext.Provider value={viewabilityContextValues}>
          <ScrollUpdatingContext.Provider
            value={nextScrollUpdatingContextValues}
          >
            {isIos && !useSmoothControl ? refreshControl : null}
            {children}
          </ScrollUpdatingContext.Provider>
        </ViewabilityContext.Provider>
      </ScrollViewContext.Provider>
    );
  }, [children, shouldBeView]);

  const PortalHeader = useCallback(
    () => (
      <ScrollViewContext.Provider value={nextScrollViewContextValues}>
        <HeaderPortalContainer />
      </ScrollViewContext.Provider>
    ),
    []
  );
  const PortalFooter = useCallback(
    () => (
      <ScrollViewContext.Provider value={nextScrollViewContextValues}>
        <FooterPortalContainer />
      </ScrollViewContext.Provider>
    ),
    []
  );

  // const commonProps = useMemo(
  //   () => ({
  //     scrollViewKey,
  //     getScrollHelper,
  //     horizontal,
  //     scrollEventHelper,
  //   }),
  //   []
  // );

  // const commonScrollViewProps = useMemo(
  //   () => ({
  //     ...eventHandlers,
  //     scrollEnabled,
  //     removeClippedSubviews,
  //     scrollEventThrottle,
  //   }),
  //   []
  // );

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
      <>
        <PortalHeader />
        <ViewRenderer
          ref={scrollViewRef as any as MutableRefObject<RNView>}
          {...rest}
          // {...commonProps}
        >
          {nextChildren}
        </ViewRenderer>
        <PortalFooter />
      </>
    );

  if (!enableViewPager && !shouldBeView && !!animated)
    return (
      <>
        <PortalHeader />
        <AnimatedRenderer
          ref={scrollViewRef as MutableRefObject<RNScrollView>}
          {...rest}
          // {...commonProps}
          {...refreshControlProps}
          // {...commonScrollViewProps}
          onRefresh={nextOnRefresh}
          refreshing={refreshing}
          scrollEventHelper={scrollEventHelper}
          useSmoothControl={useSmoothControl}
          animatedValue={animatedValue}
        >
          {nextChildren}
        </AnimatedRenderer>
        <PortalFooter />
      </>
    );

  return (
    <>
      <PortalHeader />
      <BasicRenderer
        ref={scrollViewRef as MutableRefObject<RNScrollView>}
        {...rest}
        // {...commonProps}
        {...refreshControlProps}
        // {...commonScrollViewProps}
      >
        {nextChildren}
      </BasicRenderer>
      <PortalFooter />
    </>
  );
};

// https://stackoverflow.com/a/51898192/2006805
const ForwardScrollView = React.forwardRef(
  (props: SpectrumScrollViewProps, forwardRef: ForwardedRef<RNScrollView>) => (
    <ScrollView forwardRef={forwardRef} {...props} />
  )
) as (props: PropsWithChildren<SpectrumScrollViewPropsWithRef>) => JSX.Element;

export default ForwardScrollView;
