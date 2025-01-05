import React, { FC, useEffect, useMemo, useState } from 'react';
import { Animated } from 'react-native';

import { SmoothControlProps } from '../types';
import RefreshIcon from './RefreshIcon';

const SmoothControl: FC<SmoothControlProps> = (props) => {
  const {
    loading,
    setLoading,
    refreshing,
    layoutRef,
    animatedValue,
    lottieAnimatedValueRef,
    triggerOnRefreshThresholdValue,
    refreshControlStartCorrection = 0,
    refreshControlContentContainerStyle = {},
  } = props;

  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (!refreshing && loading) {
      setFade(true);
      setTimeout(() => {
        Animated.timing(lottieAnimatedValueRef.current, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            setLoading(false);
            setFade(false);
          }
        });
      });
    }
  }, [refreshing]);

  const refreshIcon = useMemo<any>(() => {
    return [
      {
        position: 'absolute',
        top: (layoutRef.current.y || 0) + refreshControlStartCorrection,
        right: 0,
        left: 0,
        zIndex: -1,
        alignItems: 'center',
        justifyContent: 'center',
        height: triggerOnRefreshThresholdValue,
        transform: [
          {
            translateY: fade
              ? lottieAnimatedValueRef.current.interpolate({
                  inputRange: [-1, 0, triggerOnRefreshThresholdValue],
                  outputRange: [0, -triggerOnRefreshThresholdValue, 0],
                })
              : animatedValue.current.interpolate({
                  inputRange: [
                    -(triggerOnRefreshThresholdValue + 1),
                    -triggerOnRefreshThresholdValue,
                    -1,
                    0,
                  ],
                  outputRange: [
                    triggerOnRefreshThresholdValue + 1,
                    triggerOnRefreshThresholdValue,
                    1,
                    0,
                  ],
                }),
          },
        ],
      },
      refreshControlContentContainerStyle,
    ];
  }, [fade, layoutRef.current?.y]);

  if (!loading) return null;

  return (
    <Animated.View style={refreshIcon}>
      <RefreshIcon />
    </Animated.View>
  );
};

export default SmoothControl;
