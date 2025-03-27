import { Disposable } from '@infinite-list/disposable';
import type { FC} from 'react';
import * as React from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import ScrollViewContext from '../context/ScrollViewContext';

const RefreshControlThresholdValue = 100;

const RefreshControl: FC<{
  refreshing?: boolean;
}> = (props) => {
  const styles = useStyles();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const disposable = useMemo(() => new Disposable(), []);
  const { marshal } = useContext(ScrollViewContext);
  const {refreshControlService} = marshal!.getScrollHelper();

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
