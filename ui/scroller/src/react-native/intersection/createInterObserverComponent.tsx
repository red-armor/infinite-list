import {
  forwardRef,
  ComponentProps,
  FC,
  ForwardedRef,
  PropsWithChildren,
  useContext,
  useRef,
  useEffect,
} from 'react';
import { ObserverComponentProps } from '../types';
import ScrollViewContext from '../context/ScrollViewContext';

const createObserverComponent = <T extends React.ComponentType<any>>(
  Component: T
) => {
  const ObserverComponent: FC<
    PropsWithChildren<ObserverComponentProps> & React.ComponentProps<T>
  > = (props) => {
    const { observerKey, ...rest } = props;
    const { marshal, intersectionObserver } = useContext(ScrollViewContext);
    const defaultRef = useRef<typeof Component | null>();
    const componentRef = forwardRef || defaultRef;

    useEffect(() => {
      if (intersectionObserver) {
        return intersectionObserver.observe(componentRef.current, {
          root: marshal?.ownerDocument,
          observerKey: observerKey,
        });
      }
      return () => {
        // do nothing
      };
    }, []);

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
