import { PropsWithChildren, FC, useEffect, useContext, useRef } from 'react';
import { View, ViewProps } from 'react-native';
import ScrollViewContext from '../context/ScrollViewContext';

const StickyView: FC<
  PropsWithChildren<
    ViewProps & {
      observerKey: string;
    }
  >
> = (props) => {
  const { observerKey, ...rest } = props;
  const { marshal, intersectionObserver } = useContext(ScrollViewContext);
  const viewRef = useRef<View>(null);

  useEffect(
    () =>
      intersectionObserver?.observe(viewRef.current, {
        root: marshal?.ownerDocument,
        observerKey: observerKey,
      }),
    []
  );

  return (
    <View ref={viewRef} {...rest}>
      {props.children}
    </View>
  );
};

export default StickyView;
