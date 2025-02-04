import {
  PropsWithChildren,
  FC,
  useEffect,
  useContext,
  useRef,
  useState,
  useCallback,
} from 'react';
import { View, ViewProps } from 'react-native';
import { Observer } from '@infinite-list/intersection-observer/react-native';
import ScrollViewContext from '../context/ScrollViewContext';
import { InterpolationConfig, StickyItemProps } from '../types';

const noop = () => {
  // do nothing
};

const StickyView: FC<
  PropsWithChildren<
    ViewProps & {
      observerKey: string;
      startCorrection: number;
    }
  >
> = (props) => {
  const { observerKey, startCorrection = 0, ...rest } = props;
  const { marshal, intersectionObserver } = useContext(ScrollViewContext);
  const viewRef = useRef<View>(null);
  const observerRef = useRef<Observer | null>(null);
  const stickyMarshal = marshal?.getScrollHelper().getStickyMarshal();
  const registeredRef = useRef(false);

  const [config, setConfig] = useState<{
    interpolationConfig?: InterpolationConfig;
    animatedValueConfig?: InterpolationConfig;
  }>();

  const nextSetConfig = useCallback(
    (opt: {
      interpolationConfig?: InterpolationConfig;
      animatedValueConfig?: InterpolationConfig;
    }) => {
      setConfig((config) => ({
        ...config,
        ...opt,
      }));
    },
    []
  );

  useEffect(() => {
    const info = intersectionObserver!.observe(viewRef.current!, {
      root: marshal!.ownerDocument,
      observerKey,
      onRectChange: (rect) => {
        if (!registeredRef.current) {
          stickyMarshal?.registerStickyItem(observerKey, {
            rect,
            startCorrection,
            setConfig: nextSetConfig,
          });
          registeredRef.current = true;
        }

        stickyMarshal?.calculateRangeValues();
        // setTimeout(() => {
        //   console.log('bounding --- ', info.observer.getBoundingClientRect() );
        // }, 40)
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
