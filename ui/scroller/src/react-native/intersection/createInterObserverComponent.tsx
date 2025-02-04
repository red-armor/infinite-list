import React, {
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

const createObserverComponent = <T extends ComponentType<any>>(
  Component: T
) => {
  const ObserverComponent: FC<
    PropsWithChildren<ObserverComponentProps> & ComponentProps<T>
  > = (props) => {
    const { observerKey, forwardRef, ...rest } = props;
    const { marshal, intersectionObserver } = useContext(ScrollViewContext);
    const defaultRef = useRef<any>(null);
    const componentRef = forwardRef || defaultRef;

    useEffect(
      () =>
        intersectionObserver?.observe(componentRef.current, {
          root: marshal!.ownerDocument,
          observerKey: observerKey,
        }),
      []
    );

    return (
      <Component ref={componentRef} {...(rest as ComponentProps<T>)}>
        {props.children}
      </Component>
    );
  };

  return React.forwardRef(
    (
      props: ObserverComponentProps & ComponentProps<T>,
      ref: ForwardedRef<T>
    ) => {
      return <ObserverComponent {...props} forwardRef={ref} />;
    }
  ) as any as FC<PropsWithChildren<ComponentProps<T> & ObserverComponentProps>>;
};

export default createObserverComponent;
