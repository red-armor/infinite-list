// @ts-ignore
import LottieView from '@xhs/lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

// @ts-ignore
import sourceRed from './loading-red.json';
// @ts-ignore
import sourceGray from './loading.json';

const styles = StyleSheet.create({
  image: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
});

const LoadingIcon = props => {
  const { style, loading = true, progress, type = 'gray' } = props;
  const source = type === 'gray' ? sourceGray : sourceRed;
  const animation = useRef(null);

  // 如果有progress，则通过props控制旋转
  useEffect(() => {
    if (loading && progress === undefined) {
      animation?.current?.play();
      return animation.current.stop;
    }
  }, [animation, progress]);

  return (
    <View style={[styles.image, style]}>
      <LottieView ref={animation} source={source} progress={progress} />
    </View>
  );
};

export default LoadingIcon;
