import React, { PropsWithChildren, useEffect, useRef, FC } from 'react';
import { StyleSheet, View, ViewStyle, ActivityIndicator } from 'react-native';
// import LottieView from 'lottie-react-native';

import sourceRed from './loading-red.json';
import sourceGray from './loading.json';

const styles = StyleSheet.create({
  image: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
});

const LoadingIcon: FC<
  PropsWithChildren<{
    loading?: boolean;
    progress?: number;
    style?: ViewStyle;
    type?: 'gray' | 'red';
  }>
> = (props) => {
  const { style, loading = true, progress, type = 'gray' } = props;
  const source = type === 'gray' ? sourceGray : sourceRed;
  const animation = useRef(null);

  // 如果有progress，则通过props控制旋转
  // useEffect(() => {
  //   if (loading && progress === undefined) {
  //     // @ts-ignore
  //     animation?.current?.play();
  //     // @ts-ignore
  //     return animation.current.stop;
  //   }
  // }, [animation, progress]);

  return (
    <ActivityIndicator size="large" color={'yellow'} animating={loading} />
  );

  return (
    <View style={[styles.image, style]}>
      <ActivityIndicator size="large" color={'yellow'} animating={loading} />
      {/* <LottieView ref={animation} source={source} progress={progress} /> */}
    </View>
  );
};

export default LoadingIcon;
