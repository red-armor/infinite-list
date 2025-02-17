import React, { FC, useState, useMemo, useEffect, useContext } from 'react';
import { View, ViewStyle, StyleSheet, ActivityIndicator } from 'react-native';
import { ParallaxScrollViewContext } from '../context';
import { Disposable } from '@ads-x/disposable';

const RefreshControlThresholdValue = 100;

const RefreshControl: FC<{
  refreshing?: boolean;
}> = (props) => {
  const styles = useStyles();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const disposable = useMemo(() => new Disposable(), []);
  const parallaxContextValues = useContext(ParallaxScrollViewContext);

  const refreshControlService = useMemo(
    () => parallaxContextValues.refreshControlService!,
    [parallaxContextValues]
  );

  useEffect(() => {
    disposable.registerDisposable(
      refreshControlService.onStateChanged((values) => {
        setIsRefreshing(values.isRefreshing);
      })
    );
  }, []);

  useEffect(
    () => () => {
      disposable.dispose();
    },
    []
  );

  const containerStyle = useMemo<ViewStyle>(() => {
    if (!isRefreshing) return styles.container;
    return styles.refreshingContainer;
  }, [isRefreshing, styles]);

  return (
    <View style={containerStyle}>
      <ActivityIndicator size="small" color="#eee" />
    </View>
  );
};

export const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          top: -RefreshControlThresholdValue,
          left: 0,
          right: 0,
          height: RefreshControlThresholdValue,
        },
        refreshingContainer: {
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: RefreshControlThresholdValue,
        },
      }),
    []
  );
};

export default RefreshControl;
