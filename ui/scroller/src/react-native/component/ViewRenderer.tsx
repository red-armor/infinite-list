import React, { FC, ForwardedRef, PropsWithChildren } from 'react';
import { View } from 'react-native';

import { ViewRendererProps, ViewRendererPropsWithForwardRef } from '../types';

const ViewRenderer: FC<ViewRendererPropsWithForwardRef> = (props) => {
  const {
    children,
    contentContainerStyle = {},
    forwardRef,
    onLayout,
    ...rest
  } = props;

  return (
    <View
      ref={forwardRef}
      onLayout={onLayout}
      style={contentContainerStyle}
      {...rest}
    >
      {children}
    </View>
  );
};

const ForwardViewRenderer = React.forwardRef(
  (props: ViewRendererProps, ref?: ForwardedRef<View>) => (
    <ViewRenderer forwardRef={ref} {...props} />
  )
) as (props: PropsWithChildren<ViewRendererProps>) => JSX.Element;

export default ForwardViewRenderer;
