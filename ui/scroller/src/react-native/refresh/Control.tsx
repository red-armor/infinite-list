import React, {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Animated, View, ViewStyle } from 'react-native';

import ScrollViewContext from '../context/ScrollViewContext';
import { ControlProps } from '../types';

const TRIGGER_ON_REFRESH_THRESHOLD_VALUE = 40;
const LOCK_REFRESH_TIMEOUT = 500;

const Control: FC<ControlProps> = (props) => {
  const contextValues = useContext(ScrollViewContext);
  const { scrollEventHelper } = contextValues;
  const {
    refreshing,
    onRefresh,
    children,
    fadeOutDuration = 350,
    refreshThresholdValue = TRIGGER_ON_REFRESH_THRESHOLD_VALUE,
  } = props;
  const onRefreshEnabledRef = useRef(true);
  const timoutHandlerRef = useRef<any>();
  const refreshingRef = useRef(false);
  const animatedGhostRef = useRef(new Animated.Value(0));

  useEffect(
    () => () => {
      if (timoutHandlerRef.current) {
        clearTimeout(timoutHandlerRef.current);
        timoutHandlerRef.current = null;
      }
    },
    []
  );

  const shrink = useCallback(() => {
    Animated.timing(animatedGhostRef.current, {
      toValue: 0,
      duration: fadeOutDuration,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    if (!refreshing && onRefreshEnabledRef.current) {
      shrink();
    }
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    return scrollEventHelper.subscribeEventHandler('onScrollEndDrag', () => {
      if (!onRefreshEnabledRef.current) {
        timoutHandlerRef.current = setTimeout(() => {
          onRefreshEnabledRef.current = true;
          if (!refreshingRef.current) {
            shrink();
          }
        }, LOCK_REFRESH_TIMEOUT);
      }
    });
  }, []);

  useEffect(() => {
    return scrollEventHelper.subscribeEventHandler('onScroll', (e) => {
      if (!onRefreshEnabledRef.current || refreshingRef.current) return;
      const { nativeEvent } = e;
      const contentOffset = nativeEvent.contentOffset;
      const { y } = contentOffset;
      if (y < -refreshThresholdValue) {
        if (typeof onRefresh === 'function') {
          onRefreshEnabledRef.current = false;
          onRefresh();
          animatedGhostRef.current.setValue(refreshThresholdValue);
        }
      }
    });
  }, []);

  const ghostViewStyle = useMemo<any>(() => {
    return {
      height: animatedGhostRef.current,
    };
  }, []);
  const refreshingContainerStyle = useMemo<ViewStyle>(
    () => ({
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: refreshThresholdValue,
    }),
    []
  );

  return (
    <View>
      <View style={refreshingContainerStyle}>{children}</View>
      {<Animated.View style={ghostViewStyle} />}
    </View>
  );
};

export default Control;
