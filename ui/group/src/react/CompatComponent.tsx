import type { CSSProperties, FC, PropsWithChildren} from 'react';
import { useMemo } from 'react';

import type { CompatStyle } from '../types';

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
