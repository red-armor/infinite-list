import React from 'react';
import { StyleSheet } from 'react-native';

const TRIGGER_ON_REFRESH_THRESHOLD_VALUE = 50;
const LOCK_REFRESH_TIMEOUT = 500;

const styles = StyleSheet.create({
  container: {
    top: -50,
    right: 0,
    left: 0,
    height: 50,
  },
});

const RefreshControl = () => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  return <View style={styles.container}></View>;
};

export default RefreshControl;
