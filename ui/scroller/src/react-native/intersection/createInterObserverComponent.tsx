import {
  forwardRef,
  ComponentProps,
  FC,
  ForwardedRef,
  PropsWithChildren,
  useContext,
  useRef,
  useEffect,
  ComponentType,
} from 'react';
import { ObserverComponentProps } from '../types';
import ScrollViewContext from '../context/ScrollViewContext';
import { ObserverComponent } from '@infinite-list/intersection-observer/react-native';

const createObserverComponent = <T extends ComponentType<ObserverComponent>>(
  Component: T
) => {
  const ObserverComponent: FC<
    PropsWithChildren<ObserverComponentProps> & ComponentProps<T>
  > = (props) => {
    const { observerKey, ...rest } = props;
    const { marshal, intersectionObserver } = useContext(ScrollViewContext);
    const defaultRef = useRef<typeof Component | null>();
    const componentRef = forwardRef || defaultRef;

    useEffect(
      () =>
        intersectionObserver?.observe(componentRef.current, {
          root: marshal?.ownerDocument,
          observerKey: observerKey,
        }),
      []
    );

    return (
      <Component ref={componentRef} {...rest}>
        {props.children}
      </Component>
    );
  };

  return forwardRef(
    (
      props: ObserverComponentProps & ComponentProps<T>,
      ref: ForwardedRef<T>
    ) => {
      return <ObserverComponent {...props} forwardRef={ref} />;
    }
  ) as any as FC<ObserverComponentProps & ComponentProps<T>>;
};

export default createObserverComponent;
