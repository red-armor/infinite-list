import { ListGroupDimensions } from '@infinite-list/data-model';
import shallowEqual from '@x-oasis/shallow-equal';
import React, {
  FC,
  ForwardedRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Platform, View, ViewStyle } from 'react-native';

import ScrollViewContext from '../../context/ScrollViewContext';
import ViewabilityContext from '../../context/ViewabilityContext';
import ViewableItemContext from '../../context/ViewableItemContext';
import useBindGeneral from '../../hooks/useBindGeneral';
import useMeasureLayout from '../../hooks/useMeasureLayout';
import { InterpolationConfig, StickyItemProps } from '../../types';
import Item from '../Item';

const createStickyComponent = <
  T extends Animated.AnimatedComponent<React.ComponentType<any>>
>(
  Component: T
) => {
  const AnimatedViewableComponent: FC<StickyItemProps> = props => {
    const {
      style = {},
      zIndex = 2,
      children,
      ownerId: _ownerId,
      onLayout,
      onViewable,
      onImpression,
      forwardRef,
      startCorrection = 0,
      CellRendererComponent,
      viewableItemHelperKey,
      setMeasureLayoutHandler,
      isIntervalTreeItem = false,
      getMetaOnViewableItemsChanged,
      viewAbilityPropsSensitive = true,
      onMeasureLayout: _onMeasureLayout,
      ...rest
    } = props;
    const stickyAnimatedValueRef = useRef();
    const ownerId = useMemo(() => _ownerId, [_ownerId]);

    const { dimensions } = useContext(ViewabilityContext);

    const contextValue = useContext(ScrollViewContext);
    const { marshal, scrollEventHelper } = contextValue;
    const scrollHelper = contextValue.getScrollHelper();
    const selectValue = scrollHelper.selectValue;
    const selectedAnimatedValue = scrollHelper.getAnimatedValue();
    const defaultRef = useRef<View>();

    const viewRef = forwardRef || defaultRef;
    const initialRef = useRef(true);
    const stickyDisposerRef = useRef<Function>();
    const stickyMarshal = scrollHelper.getStickyMarshal();
    const [config, setConfig] = useState<{
      interpolationConfig: InterpolationConfig;
      animatedValueConfig: InterpolationConfig;
    }>();

    const nextSetConfig = useCallback((_config = {}) => {
      setConfig(config => ({
        ...config,
        ..._config,
      }));
    }, []);

    if (initialRef.current) {
      if (Platform.OS === 'android') {
        if (scrollHelper.getMarshal()._removeClippedSubviews) {
          console.error(
            'StickyComponent should be wrapped in `ScrollView`' +
              ' with `removeClippedSubviews = true` in Android.'
          );
        }
      }

      stickyDisposerRef.current = stickyMarshal.registerStickyItem(
        viewableItemHelperKey,
        {
          startCorrection,
          dimensions,
          setConfig: nextSetConfig,
        }
      );
      initialRef.current = false;
    }

    useEffect(
      () => () => {
        if (typeof stickyDisposerRef.current === 'function')
          stickyDisposerRef.current();
      },
      []
    );

    useEffect(() => {
      if (config?.animatedValueConfig) {
        // @ts-ignore
        stickyAnimatedValueRef.current = selectedAnimatedValue.current.interpolate(
          config.animatedValueConfig
        );
      }
    }, [config]);

    const viewableItemHelperKeyRef = useRef(viewableItemHelperKey);

    const onMeasureLayout = useCallback(
      (x: number, y: number, width: number, height: number) => {
        if (typeof _onMeasureLayout === 'function') {
          _onMeasureLayout(x, y, width, height);
        }

        const meta = dimensions.ensureKeyMeta(
          viewableItemHelperKeyRef.current,
          ownerId
        );
        const layout = meta?.getLayout();
        const nextLayout = { x, y, width, height };
        if (!layout || !shallowEqual(nextLayout, layout)) {
          if (dimensions instanceof ListGroupDimensions) {
            dimensions.setKeyItemLayout(
              viewableItemHelperKeyRef.current,
              ownerId,
              {
                x,
                y,
                width,
                height,
              }
            );
          } else {
            dimensions.setKeyItemLayout(viewableItemHelperKeyRef.current, {
              x,
              y,
              width,
              height,
            });
          }
        }

        stickyMarshal.calculateRangeValues(ownerId);
      },
      []
    );

    useEffect(
      () =>
        scrollEventHelper.subscribeEventHandler('onContentSizeChange', () => {
          stickyMarshal.calculateRangeValues(ownerId);
        }),
      []
    );

    useEffect(() => {
      if (!marshal || !marshal.getAnimated()) {
        console.error(
          `[Spectrum Error]: 'createStickyComponent' should` +
            `be wrapped in ScrollView with 'animated={true}'`
        );
      }
    }, []);

    const getCurrentKey = useCallback(
      () => viewableItemHelperKeyRef.current,
      []
    );

    const { handler, layoutHandler } = useMeasureLayout(
      // @ts-ignore
      viewRef,
      marshal.getRootRef(),
      {
        onLayout,
        getCurrentKey,
        isIntervalTreeItem,
        onMeasureLayout,
      }
    );
    useEffect(() => {
      if (typeof setMeasureLayoutHandler === 'function')
        setMeasureLayoutHandler(handler);
    }, []);

    useEffect(() => {
      viewableItemHelperKeyRef.current = viewableItemHelperKey;
      handler();
    }, [viewableItemHelperKey]);

    useBindGeneral({
      ownerId,
      onViewable,
      onImpression,
      viewableItemHelperKey,
      viewAbilityPropsSensitive,
    });

    const containerStyle = useMemo<ViewStyle[]>(() => {
      const meta = dimensions.ensureKeyMeta(
        viewableItemHelperKeyRef.current,
        ownerId
      );
      if (!meta?.getLayout()) return ([] as ViewStyle[]).concat(style);
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

      return ([
        {
          ...positionStyle,
          ...platformStyle,
          transform: [
            {
              [selectedTranslate]: config?.interpolationConfig
                ? selectedAnimatedValue.current.interpolate(
                    config?.interpolationConfig
                  )
                : 0,
            } as {
              [key in 'translateX' | 'translateY']: any;
            },
          ],
        },
      ] as ViewStyle[]).concat(style);
    }, [config, viewableItemHelperKey]);

    const RenderComponent = useMemo(() => CellRendererComponent || Component, [
      Component,
      CellRendererComponent,
    ]);

    const refProps = useMemo(() => {
      if (CellRendererComponent) return {};
      return { ref: viewRef };
    }, []);

    const viewableItemContextValue = useMemo(() => {
      return {
        itemMeta: dimensions.getKeyMeta(viewableItemHelperKey, ownerId),
      };
    }, [viewableItemHelperKey]);

    return (
      <ViewableItemContext.Provider value={viewableItemContextValue}>
        <RenderComponent
          collapsable={false}
          style={containerStyle}
          cellKey={viewableItemHelperKey}
          onLayout={layoutHandler}
          itemMeta={viewableItemContextValue.itemMeta}
          {...refProps}
          {...rest}
        >
          <Item
            viewableItemHelperKey={viewableItemHelperKey}
            itemMeta={viewableItemContextValue.itemMeta}
          >
            {typeof children === 'function'
              ? // @ts-ignore
                children({
                  stickyAnimatedValueRef,
                })
              : children}
          </Item>
        </RenderComponent>
      </ViewableItemContext.Provider>
    );
  };

  return (React.forwardRef(
    (
      props: StickyItemProps & React.ComponentProps<T>,
      ref: ForwardedRef<T>
    ) => {
      return <AnimatedViewableComponent {...props} forwardRef={ref} />;
    }
  ) as any) as FC<StickyItemProps & React.ComponentProps<T>>;
};

export default createStickyComponent;
