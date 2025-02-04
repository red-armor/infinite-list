import { PropsWithChildren, FC, useEffect, useContext, useRef } from 'react';
import { View, ViewProps } from 'react-native';
import { Observer } from '@infinite-list/intersection-observer/react-native';
import ScrollViewContext from '../context/ScrollViewContext';
const noop = () => {
  // do nothing
};

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
  const observerRef = useRef<Observer | null>(null);
  const stickyMarshal = marshal?.getScrollHelper().getStickyMarshal();

  useEffect(() => {
    const info = intersectionObserver!.observe(viewRef.current, {
      root: marshal!.ownerDocument,
      observerKey,
      onRectChange: (rect) => {
        console.log('rect --- ', rect);
      },
    });
    observerRef.current = info?.observer;
    return info?.remover || noop;
  }, []);

  return (
    <View ref={viewRef} {...rest}>
      {props.children}
    </View>
  );
};

export default StickyView;
