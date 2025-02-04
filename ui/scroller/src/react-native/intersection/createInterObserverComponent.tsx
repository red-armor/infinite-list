import React, {
  ComponentProps,
  FC,
  ForwardedRef,
  PropsWithChildren,
  useContext,
  useRef,
  useEffect,
  ComponentType,
  RefObject,
} from 'react';
import { ObserverComponentProps } from '../types';
import ScrollViewContext from '../context/ScrollViewContext';

const createObserverComponent = <T extends ComponentType<any>>(
  Component: T
) => {
  const ObserverComponent: FC<
    PropsWithChildren<
      ObserverComponentProps & {
        forwardRef?: ForwardedRef<T>;
      } & ComponentProps<T>
    >
  > = (props) => {
    const { observerKey, forwardRef, ...rest } = props;
    const { marshal, intersectionObserver } = useContext(ScrollViewContext);
    const defaultRef = useRef<T | null>(null);
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
      // @ts-ignore
      <Component ref={componentRef} {...rest}>
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
  ) as any as FC<
    PropsWithChildren<
      ComponentProps<T> &
        ObserverComponentProps & {
          ref?: RefObject<any>;
        }
    >
  >;
};

export default createObserverComponent;
