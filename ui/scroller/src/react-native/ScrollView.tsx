import React, {
  FC,
  ForwardedRef,
  MutableRefObject,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  RefreshControl as RNRefreshControl,
  ScrollView as RNScrollView,
  View as RNView,
} from 'react-native';
import isRefObject from '@x-oasis/is-ref';
import Marshal from './Marshal';
import { DEFAULT_SCROLL_EVENT_THROTTLE } from './commons/constants';
import { isIos } from './commons/platform';
import AnimatedRenderer from './component/AnimatedRenderer';
import BasicRenderer from './component/BasicRenderer';
import { defaultViewabilityConfigCallbackPairs } from './constants';
import ScrollViewContext from './context/ScrollViewContext';
import FooterPortalContainer from './portal/FooterContainer';
import HeaderPortalContainer from './portal/HeaderContainer';
import PortalManager from './portal/Manager';
import {
  ScrollToOption,
  InfiniteListScrollViewProps,
  InfiniteListScrollViewPropsWithForwardRef,
  InfiniteListScrollViewPropsWithRef,
} from './types';
import { resolveScrollViewKey } from './commons/utils';

const ScrollView: FC<InfiniteListScrollViewPropsWithForwardRef> = (props) => {
  const {
    id,
    forwardRef,

    animatedY,
    animatedX,

    stickyMode,

    onRefresh,
    refreshing,
    refreshControl,

    animated = false,
    viewabilityConfig,
    horizontal = false,
    // enableViewPager = false,

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

    // pagerOffsetRef: _pagerOffsetRef,
    // pagerPositionRef: _pagerPositionRef,
    viewabilityConfigCallbackPairs = defaultViewabilityConfigCallbackPairs,
    scrollUpdating = true,
    removeClippedSubviews: _removeClippedSubviews,
    scrollEventThrottle = DEFAULT_SCROLL_EVENT_THROTTLE,
    children,
    scrollEnabled = true,

    intersectionObserverCallback,
    ...rest
  } = props;
  const scrollViewKey = useMemo(
    () => id || resolveScrollViewKey(!!horizontal),
    []
  );

  /**
   * In android device, `removeClippedSubviews` used with zIndex will crash.
   */
  const scrollViewContextValues = useContext(ScrollViewContext);

  const removeClippedSubviews = false;
  const scrollHelperDisposerRef = useRef<Function>();
  const {
    marshal: parentMarshal,
    intersectionObserver,
    portalManager,
  } = scrollViewContextValues;
  const defaultScrollViewRef = useRef<RNScrollView | RNView>();
  const scrollViewRef = (
    isRefObject(forwardRef) ? forwardRef : defaultScrollViewRef
  ) as MutableRefObject<RNScrollView>;

  /**
   * Every scrollView has a marshal
   */
  const marshal = useMemo(
    () =>
      new Marshal({
        id: scrollViewKey,
        animated,
        animatedValueY: animatedY,
        animatedValueX: animatedX,
        parentMarshal,
        scrollUpdating,
        ref: scrollViewRef,
        horizontal: !!horizontal,

        /**
         * ScrollHelper props
         *
         */
        stickyMode,

        /**
         * ScrollEventHelper props
         */
        onScroll,
        onScrollEndDrag,
        onScrollBeginDrag,
        onContentSizeChange,
        onMomentumScrollEnd,
        onMomentumScrollBegin,

        intersectionObserverCallback,
        intersectionObserver:
          intersectionObserver ||
          (parentMarshal && parentMarshal.intersectionObserver),
      }),
    []
  );

  marshal.scrollEventHelper.updateInternalHandlers({
    onScroll,
    onScrollToTop,
    onScrollEndDrag,
    onScrollBeginDrag,
    onContentSizeChange,
    onMomentumScrollEnd,
    onMomentumScrollBegin,
  });

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

  // const nextOnRefresh = useMemo(() => {
  //   return () => {}
  //   if (!onRefresh) return null;
  //   if (typeof onRefresh === 'function')
  //     return () => {
  //       // onRefresh();
  //       marshal.getScrollHelper().invokeOnRefreshListener();
  //     };
  //   return null;
  // }, [onRefresh]);

  // const useSmoothControl = useMemo(
  //   () => typeof nextOnRefresh === 'function' && isIos,
  //   []
  // );

  useEffect(
    () => () => {
      marshal.dispose();
    },
    []
  );

  const nextScrollViewContextValues = useMemo(
    () => ({
      marshal,
      portalManager: portalManager || new PortalManager(),
      intersectionObserver: marshal.intersectionObserver,
    }),
    []
  );

  // const _refreshControl = useMemo(() => {
  //   if (!nextOnRefresh) return null;
  //   if (isIos) return null;
  //   return (
  //     <RNRefreshControl refreshing={!!refreshing} onRefresh={nextOnRefresh} />
  //   );
  // }, [refreshing]);

  // const refreshControlProps = _refreshControl
  //   ? {
  //       refreshControl: _refreshControl,
  //     }
  //   : {};

  if (animated)
    return (
      <ScrollViewContext.Provider value={nextScrollViewContextValues}>
        <HeaderPortalContainer />
        <AnimatedRenderer
          ref={scrollViewRef as MutableRefObject<RNScrollView>}
          {...rest}
          // {...refreshControlProps}
          scrollEnabled={scrollEnabled}
          // onRefresh={nextOnRefresh}
          refreshing={refreshing}
        >
          {children}
        </AnimatedRenderer>
        <FooterPortalContainer />
      </ScrollViewContext.Provider>
    );

  return (
    <ScrollViewContext.Provider value={nextScrollViewContextValues}>
      <HeaderPortalContainer />
      <BasicRenderer
        scrollEnabled={scrollEnabled}
        ref={scrollViewRef as MutableRefObject<RNScrollView>}
        {...rest}
        // {...refreshControlProps}
      >
        {children}
      </BasicRenderer>
      <FooterPortalContainer />
    </ScrollViewContext.Provider>
  );
};

// https://stackoverflow.com/a/51898192/2006805
const ForwardScrollView = React.forwardRef(
  (
    props: InfiniteListScrollViewProps,
    forwardRef: ForwardedRef<RNScrollView>
  ) => <ScrollView forwardRef={forwardRef} {...props} />
) as (
  props: PropsWithChildren<InfiniteListScrollViewPropsWithRef>
) => JSX.Element;

export default ForwardScrollView;
