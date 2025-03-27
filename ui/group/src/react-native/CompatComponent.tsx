import type { FC, PropsWithChildren} from 'react';
import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';

import type { CompatStyle } from '../types';

/**
 * compatible Component for ReactNative or React usage
 */

export const RecycleContentItemWrapper: FC<
  PropsWithChildren<{
    style?: CompatStyle;
  }>
> = (props) => {
  const { children, style } = props;
  const nextStyle = useMemo<ViewStyle>(() => {
    return (style as ViewStyle) || {};
  }, [style]);

  return <View style={nextStyle}>{children}</View>;
};

export const SpaceRendererComponent: FC<
  PropsWithChildren<{
    style?: CompatStyle;
  }>
> = (props) => {
  const { style } = props;
  const nextStyle = useMemo<ViewStyle>(() => {
    return (style as ViewStyle) || {};
  }, [style]);
  return <View style={nextStyle} />;
};
