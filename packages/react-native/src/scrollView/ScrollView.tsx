import { ItemsDimensions } from '@infinite-list/data-model';
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
  useState,
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
import AnimatedViewPagerRenderer from './component/AnimatedViewPagerRenderer';
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
  SpectrumScrollViewProps,
  SpectrumScrollViewPropsWithForwardRef,
  SpectrumScrollViewPropsWithRef,
} from './types';

let count = 0;

let deviceLevel = Platform.OS === 'ios' ? 0 : 3;

export const getDeviceLevel = () => deviceLevel;

const ScrollView: FC<SpectrumScrollViewPropsWithForwardRef> = props => {
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
    horizontal = false,
    onMomentumScrollEnd,
    onContentSizeChange,
    onMomentumScrollBegin,
    enableViewPager = false,

    pagerOffsetRef: _pagerOffsetRef,
    pagerPositionRef: _pagerPositionRef,
    onEndReachedThreshold = 1,
    viewabilityConfigCallbackPairs = defaultViewabilityConfigCallbackPairs,
    onEndReachedTimeoutThreshold = 200,
    scrollUpdating: _scrollUpdating = true,
    // @ts-ignore
    removeClippedSubviews: _removeClippedSubviews,
    scrollEventThrottle = DEFAULT_SCROLL_EVENT_THROTTLE,
    children,
    scrollEnabled = true,
    ...rest
  } = props;
  const scrollViewKey = useMemo(() => {
    const key =
      id || `scrollView_${horizontal ? 'horizontal' : 'vertical'}_${count}`;
    count += 1;
    return key;
  }, []);
  // const [listKey, nestListKey] = useMemo(() => {
  //   const key = id || `scrollView_${count++}`;
  //   const nestKey = `nested_${key}`;
  //   return [key, nestKey];
  // }, []);
  const scrollViewContextValues = useContext(ScrollViewContext);
  // removeClippedSubviews 在安卓上，如果有zIndex，但是removeClippedSubviews为true
  // 的话，会crash
  // const removeClippedSubviews = useMemo(() => {
  // if (!isIos && !animated) return false;
  // return _removeClippedSubviews;
  // }, []);
  const removeClippedSubviews = false;
  const scrollHelperDisposerRef = useRef<Function>();
  const {
    marshal: parentMarshal,
    outerMostVerticalMarshal,
    outerMostHorizontalMarshal,

    outerMostVerticalScrollHelper,
    outerMostHorizontalScrollHelper,

    outerMostVerticalPortalManager,
    outerMostHorizontalPortalManager,
  } = scrollViewContextValues;
  const defaultScrollViewRef = useRef<RNScrollView | RNView>();
  const scrollViewRef = (isRefObject(forwardRef)
    ? forwardRef
    : defaultScrollViewRef) as MutableRefObject<RNScrollView>;
  const [scrollUpdating, setScrollUpdating] = useState(_scrollUpdating);

  const _setScrollUpdating = useCallback(v => {
    setScrollUpdating(v);
  }, []);

  const portalManager = useMemo(() => new PortalManager(), []);
  let hasOwnScrollHelper = true;
  // const isRoot = !parentMarshal;
  // const isHoisted =
  //   parentMarshal && parentMarshal.isHorizontal() !== !!horizontal;
  // const isIsolated = isRoot || isHoisted;

  const defaultAnimatedValueX = useRef(new Animated.Value(0));
  const defaultAnimatedValueY = useRef(new Animated.Value(0));
  const animatedValueY = animatedY || defaultAnimatedValueY;
  const animatedValueX = animatedX || defaultAnimatedValueX;

  const defaultPagerOffsetValue = useRef(new Animated.Value(0));
  const defaultPagerPositionValue = useRef(new Animated.Value(0));
  const pagerOffsetRef = _pagerOffsetRef || defaultPagerOffsetValue;
  const pagerPositionRef = _pagerPositionRef || defaultPagerPositionValue;

  const animatedValue = useMemo(
    () => (horizontal ? animatedValueX : animatedValueY),
    []
  );

  useEffect(() => () => {
    if (typeof scrollHelperDisposerRef.current === 'function') {
      scrollHelperDisposerRef.current();
    }

    if (typeof forwardRef === 'function') {
      forwardRef(scrollViewRef.current);
    }
  });

  const [
    nextOuterMostVerticalScrollHelper,
    nextOuterMostHorizontalScrollHelper,
    rootScrollHelper,
    shouldBeView,
    isARootContainer,
  ] = useMemo(() => {
    let isARootContainer = false;
    let _outerMostVerticalScrollHelper;
    let _outerMostHorizontalScrollHelper;
    let _rootScrollHelper;

    if (outerMostVerticalScrollHelper) {
      _outerMostVerticalScrollHelper = outerMostVerticalScrollHelper;
    }

    if (outerMostHorizontalScrollHelper) {
      _outerMostHorizontalScrollHelper = outerMostHorizontalScrollHelper;
    }

    // TODO: 可能会存在问题！！！！目前这个看起来会存在指向了一个scrollHelper；
    // 感觉这个是不是要拿reverse orientation的 scrollHelper

    let reverseOrientationParentMarshal = parentMarshal;
    while (reverseOrientationParentMarshal?.isHorizontal() === horizontal) {
      reverseOrientationParentMarshal = reverseOrientationParentMarshal.getParentMarshal();
    }

    const parentScrollHelper = reverseOrientationParentMarshal?.getRootScrollHelper();

    // The top most horizontal scroll helper
    if (!_outerMostHorizontalScrollHelper && horizontal) {
      isARootContainer = true;
      _rootScrollHelper = new ScrollHelper({
        id: scrollViewKey,
        stickyMode,
        horizontal,
        animatedValue,
        ref: scrollViewRef,
        parentScrollHelper,
        // onEndReachedThreshold,
        // onEndReachedTimeoutThreshold,
      });
      if (parentScrollHelper) {
        scrollHelperDisposerRef.current = parentScrollHelper.registerReverseOrientationChild(
          _rootScrollHelper
        );
      }

      _outerMostHorizontalScrollHelper = _rootScrollHelper;
    }

    // The top most vertical scroll helper
    if (!_outerMostVerticalScrollHelper && !horizontal) {
      isARootContainer = true;
      _rootScrollHelper = new ScrollHelper({
        id: scrollViewKey,
        stickyMode,
        horizontal: !!horizontal,
        animatedValue,
        ref: scrollViewRef,
        parentScrollHelper,
        // onEndReachedThreshold,
        // onEndReachedTimeoutThreshold,
      });
      if (parentScrollHelper) {
        scrollHelperDisposerRef.current = parentScrollHelper.registerReverseOrientationChild(
          _rootScrollHelper
        );
      }
      _outerMostVerticalScrollHelper = _rootScrollHelper;
    }

    // 如果说不是顶层的话，这个时候开始自身查找问题；
    if (!_rootScrollHelper) {
      let marshal = parentMarshal;
      // 如果是vertical的话，
      if (!horizontal) {
        hasOwnScrollHelper = false;
        // 如果它的parent也是vertical，那么就用parent的root scroll helper.
        if (!marshal.isHorizontal()) {
          _rootScrollHelper = marshal.getRootScrollHelper();
        } else {
          // 假如说
          marshal = marshal.getParentMarshal();
          while (marshal.isHorizontal() !== horizontal) {
            marshal = marshal.getParentMarshal();
          }
          _rootScrollHelper = marshal.getRootScrollHelper();
        }
      } else {
        isARootContainer = true;
        _rootScrollHelper = new ScrollHelper({
          id: scrollViewKey,
          stickyMode,
          horizontal,
          animatedValue,
          ref: scrollViewRef,
          parentScrollHelper,
          // onEndReachedThreshold,
          // onEndReachedTimeoutThreshold,
        });
        if (parentScrollHelper) {
          scrollHelperDisposerRef.current = parentScrollHelper.registerReverseOrientationChild(
            _rootScrollHelper
          );
        }
      }
    }

    return [
      _outerMostVerticalScrollHelper,
      _outerMostHorizontalScrollHelper,
      _rootScrollHelper,
      !isARootContainer,
      isARootContainer,
    ];
  }, []);

  const nextOnRefresh = useMemo(() => {
    if (!onRefresh) return null;
    if (typeof onRefresh === 'function')
      return () => {
        onRefresh();
        (rootScrollHelper as ScrollHelper).invokeOnRefreshListener();
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
      horizontal: !!horizontal,
      viewabilityConfig,
      viewabilityConfigCallbackPairs,
      canIUseRIC: Platform.OS !== 'ios',
    });
    return { dimensions };
  }, []);

  /**
   * marshal和ScrollView是一一映射
   */
  const marshal = useMemo(
    () => {
      const marshal = new Marshal({
        id: scrollViewKey,
        dimensions: viewabilityContextValues.dimensions,
        animated,
        parentMarshal,
        scrollUpdating,
        ref: scrollViewRef,
        horizontal: !!horizontal,
        outerMostVerticalMarshal,
        outerMostHorizontalMarshal,
        scrollHelper: rootScrollHelper,
        removeClippedSubviews,
        setScrollUpdating: _setScrollUpdating,
      });

      rootScrollHelper.setMarshal(marshal);

      if (typeof setMarshal === 'function') setMarshal(marshal);
      return marshal;
    },
    [] // eslint-disable-line
  );

  const nextOuterMostVerticalMarshal = useMemo(
    () => outerMostVerticalMarshal || (horizontal ? null : marshal),
    []
  );
  const nextOuterMostHorizontalMarshal = useMemo(
    () => outerMostHorizontalMarshal || (horizontal ? marshal : null),
    []
  );

  const scrollEventHelper = useMemo(
    () =>
      new ScrollEventHelper({
        marshal,
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
    if (onScroll) scrollEventHelper.updateInternalHandler('onScroll', onScroll);
  }, [onScroll]);
  useEffect(() => {
    if (onScrollEndDrag)
      scrollEventHelper.updateInternalHandler(
        'onScrollEndDrag',
        onScrollEndDrag
      );
  }, [onScrollEndDrag]);
  useEffect(() => {
    if (onScrollBeginDrag)
      scrollEventHelper.updateInternalHandler(
        'onScrollBeginDrag',
        onScrollBeginDrag
      );
  }, [onScrollBeginDrag]);
  useEffect(() => {
    if (onContentSizeChange)
      scrollEventHelper.updateInternalHandler(
        'onContentSizeChange',
        onContentSizeChange
      );
  }, [onContentSizeChange]);
  useEffect(() => {
    if (onMomentumScrollEnd)
      scrollEventHelper.updateInternalHandler(
        'onMomentumScrollEnd',
        onMomentumScrollEnd
      );
  }, [onMomentumScrollEnd]);
  useEffect(() => {
    if (onMomentumScrollBegin)
      scrollEventHelper.updateInternalHandler(
        'onMomentumScrollBegin',
        onMomentumScrollBegin
      );
  }, [onMomentumScrollBegin]);

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

  const getScrollHelper = useCallback(() => rootScrollHelper, []);
  const getParentMarshal = useCallback(() => parentMarshal, []);

  const nextScrollViewContextValues = useMemo(
    () => ({
      marshal,
      portalManager,
      scrollEventHelper,

      getScrollHelper,
      getParentMarshal,

      outerMostHorizontalScrollHelper: nextOuterMostHorizontalScrollHelper,
      outerMostVerticalScrollHelper: nextOuterMostVerticalScrollHelper,

      outerMostVerticalMarshal: nextOuterMostVerticalMarshal,
      outerMostHorizontalMarshal: nextOuterMostHorizontalMarshal,

      outerMostVerticalPortalManager:
        outerMostVerticalPortalManager || (horizontal ? null : portalManager),
      outerMostHorizontalPortalManager:
        outerMostHorizontalPortalManager || (horizontal ? portalManager : null),

      scrollTo: options => {
        const ref = rootScrollHelper.getRef();
        // @ts-ignore
        if (ref.current?.getNode) {
          // @ts-ignore
          if (ref.current.scrollTo) {
            ref.current.scrollTo(options);
          } else {
            ref.current.getNode().scrollTo(options);
          }
        } else {
          (ref as MutableRefObject<RNScrollView>).current.scrollTo(options);
        }
      },
      getScrollViewRef: () => scrollViewRef,
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

  const commonProps = useMemo(
    () => ({
      scrollViewKey,
      getScrollHelper,
      horizontal,
      scrollEventHelper,
    }),
    []
  );

  const commonScrollViewProps = useMemo(
    () => ({
      ...eventHandlers,
      scrollEnabled,
      removeClippedSubviews,
      scrollEventThrottle,
    }),
    []
  );

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
          ref={(scrollViewRef as any) as MutableRefObject<RNView>}
          {...rest}
          {...commonProps}
        >
          {nextChildren}
        </ViewRenderer>
        <PortalFooter />
      </>
    );

  if (enableViewPager)
    return (
      <>
        <PortalHeader />

        <AnimatedViewPagerRenderer
          ref={scrollViewRef as MutableRefObject<RNScrollView>}
          {...rest}
          {...commonProps}
          {...commonScrollViewProps}
          {...refreshControlProps}
          pagerOffsetRef={pagerOffsetRef}
          pagerPositionRef={pagerPositionRef}
        >
          {nextChildren}
        </AnimatedViewPagerRenderer>
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
          {...commonProps}
          {...refreshControlProps}
          {...commonScrollViewProps}
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
        {...commonProps}
        {...refreshControlProps}
        {...commonScrollViewProps}
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
