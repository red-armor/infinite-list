import { CSSProperties, FC, PropsWithChildren, useMemo } from 'react';
import { CompatStyle } from '../types';

/**
 * compatible Component for ReactNative or React usage
 */

export const RecycleContentItemWrapper: FC<
  PropsWithChildren<{
    style?: CompatStyle;
  }>
> = (props) => {
  const { children, style = {} } = props;
  const nextStyle = useMemo<CSSProperties>(() => {
    return (style as CSSProperties) || {};
  }, [style]);
  return <div style={nextStyle}>{children}</div>;
};

export const SpaceRendererComponent: FC<
  PropsWithChildren<{
    style?: CompatStyle;
  }>
> = (props) => {
  const { style } = props;
  const nextStyle = useMemo<CSSProperties>(() => {
    return (style as CSSProperties) || {};
  }, [style]);
  return <div style={nextStyle} />;
};
