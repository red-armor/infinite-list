import {
  PropsWithChildren,
  FC,
  useEffect,
  useContext,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  ViewProps,
  ViewStyle,
  Platform,
  StyleSheet,
  StyleProp,
  Animated,
} from 'react-native';
import {
  IClientRectReadOnly,
  Observer,
} from '@infinite-list/intersection-observer/react-native';
import ScrollViewContext from '../context/ScrollViewContext';
import { InterpolationConfig, StickyItemProps } from '../types';

const noop = () => {
  // do nothing
};

const StickyView: FC<
  PropsWithChildren<
    ViewProps & {
      observerKey: string;
      startCorrection?: number;
      zIndex?: number;
    }
  >
> = (props) => {
  const {
    observerKey,
    startCorrection = 0,
    style,
    zIndex = 2,
    ...rest
  } = props;
  const nextStyle = style || {};
  const { marshal, intersectionObserver } = useContext(ScrollViewContext);
  const viewRef = useRef<View>(null);
  const observerRef = useRef<Observer | null>(null);
  const stickyMarshal = marshal?.getScrollHelper().getStickyMarshal();
  const registeredRef = useRef(false);
  const selectValue = useMemo(() => marshal!.getScrollHelper().selectValue, []);
  const selectedAnimatedValue = useMemo(() => marshal!.getAnimatedValue(), []);
  const rectRef = useRef<IClientRectReadOnly>();

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
        rectRef.current = rect;
        if (!registeredRef.current) {
          stickyMarshal?.registerStickyItem(observerKey, {
            rect,
            startCorrection,
            setConfig: nextSetConfig,
          });
          registeredRef.current = true;
        }

        stickyMarshal?.calculateRangeValues(observerKey);
      },
    });
    observerRef.current = info?.observer;
    return info?.remover || noop;
  }, []);

  const containerStyle = useMemo<StyleProp<ViewStyle>>(() => {
    if (!rectRef.current) return nextStyle;
    const selectedTranslate = selectValue.selectTranslate();
    const platformStyle =
      Platform.OS === 'ios'
        ? {
            // will cause crash on android
            zIndex,
          }
        : {
            elevation: 0.1,
            zIndex: 2,
          };
    const positionStyle: ViewStyle = {
      position: 'relative',
    };

    if (selectValue.horizontal) {
      positionStyle.top = 0;
      positionStyle.bottom = 0;
    } else {
      positionStyle.left = 0;
      positionStyle.right = 0;
    }

    return StyleSheet.flatten([
      {
        ...positionStyle,
        ...platformStyle,
        transform: [
          {
            [selectedTranslate]: config?.interpolationConfig
              ? selectedAnimatedValue.interpolate(config?.interpolationConfig)
              : 0,
          } as {
            [key in 'translateX' | 'translateY']: any;
          },
        ],
      },
      nextStyle,
    ]);
  }, [config]);

  console.log('config ', observerKey, config);

  return (
    <Animated.View ref={viewRef} style={containerStyle} {...rest}>
      {props.children}
    </Animated.View>
  );
};

export default StickyView;
