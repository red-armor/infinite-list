import { FC, PropsWithChildren } from 'react';
import { View, ViewStyle } from 'react-native';

/**
 * compatible Component for ReactNative or React usage
 */

export const RecycleContentItemWrapper: FC<
  PropsWithChildren<{
    style?: ViewStyle;
  }>
> = (props) => {
  const { children, style = {} } = props;

  return <View style={style}>{children}</View>;
};

export const SpaceRendererComponent: FC<
  PropsWithChildren<{
    style?: ViewStyle;
  }>
> = (props) => {
  const { style = {} } = props;
  return <View style={style} />;
};
