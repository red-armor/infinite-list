import { CSSProperties, FC, PropsWithChildren } from 'react';

/**
 * compatible Component for ReactNative or React usage
 */

export const RecycleContentItemWrapper: FC<
  PropsWithChildren<{
    style?: CSSProperties;
  }>
> = (props) => {
  const { children, style = {} } = props;

  return <div style={style}>{children}</div>;
};

export const SpaceRendererComponent: FC<
  PropsWithChildren<{
    style?: CSSProperties;
  }>
> = (props) => {
  const { style = {} } = props;
  return <div style={style} />;
};
