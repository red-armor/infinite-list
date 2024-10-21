import { ListGroupDimensions } from '@infinite-list/data-model';
import shallowEqual from '@x-oasis/shallow-equal';
import React, {
  FC,
  ForwardedRef,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef, // useState,
} from 'react';

import ScrollViewContext from '../context/ScrollViewContext';
import ViewabilityContext from '../context/ViewabilityContext';
import ViewableItemContext from '../context/ViewableItemContext';
import useBindGeneral from '../hooks/useBindGeneral';
import useMeasureLayout from '../hooks/useMeasureLayout';
import { ViewableItemProps } from '../types';
import MemoedViewableItem from './Item';

const createViewableComponent = <T extends React.ComponentType<any>>(
  Component: T
) => {
  const ViewableComponent: FC<PropsWithChildren<ViewableItemProps> &
    React.ComponentProps<T>> = props => {
    const {
      style: _style = {},
      ownerId: _ownerId,
      children,
      onLayout,
      onViewable,
      onImpression,
      forwardRef,
      containerKey,
      CellRendererComponent,
      viewableItemHelperKey,
      isIntervalTreeItem = false,
      setMeasureLayoutHandler,
      onMeasureLayout: _onMeasureLayout,
      measureLayoutHandlerOnDemand,
      getMetaOnViewableItemsChanged,
      viewAbilityPropsSensitive = true,
      itemKey,
      ...rest
    } = props;
    const containerStyle = useMemo(
      () =>
        [].concat(_style, {
          elevation: 0,
        }),
      [_style]
    );

    const defaultRef = useRef();
    const viewRef = forwardRef || defaultRef;
    const { dimensions } = useContext(ViewabilityContext);

    const ownerId = useMemo(() => _ownerId, [_ownerId]);
    const { marshal } = useContext(ScrollViewContext);

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
      },
      [viewableItemHelperKey]
    );

    const getCurrentKey = useCallback(
      () => viewableItemHelperKeyRef.current,
      []
    );

    const { handler, layoutHandler } = useMeasureLayout(
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
      // ignore first time
      if (viewableItemHelperKeyRef.current !== viewableItemHelperKey) {
        viewableItemHelperKeyRef.current = viewableItemHelperKey;
        const meta = dimensions.ensureKeyMeta(
          viewableItemHelperKeyRef.current,
          ownerId
        );
        // isApproximateLayout is true should trigger calculate layout again.
        if (meta && (!meta?.getLayout() || meta.isApproximateLayout)) {
          setTimeout(() => handler(), 0);
        }
      }
    }, [viewableItemHelperKey]);

    useBindGeneral({
      ownerId,
      onViewable,
      onImpression,
      viewableItemHelperKey,
      viewAbilityPropsSensitive,
    });

    useEffect(() => {
      if (typeof setMeasureLayoutHandler === 'function')
        setMeasureLayoutHandler(handler);
    }, []);

    const viewableItemContextValue = useMemo(() => {
      return {
        itemMeta: dimensions.getKeyMeta(viewableItemHelperKey, ownerId),
      };
    }, [viewableItemHelperKey]);

    const RenderComponent = useMemo(() => CellRendererComponent || Component, [
      Component,
      CellRendererComponent,
    ]);

    // TODO: temp fix
    // Warning: Function components cannot be given refs. Attempts to
    // access this ref will fail. Did you mean to use React.forwardRef()?
    const refProps = useMemo(() => {
      if (CellRendererComponent) return {};
      return { ref: viewRef };
    }, []);

    return (
      <ViewableItemContext.Provider value={viewableItemContextValue}>
        <RenderComponent
          style={containerStyle}
          onLayout={layoutHandler}
          key={containerKey || viewableItemHelperKey}
          cellKey={viewableItemHelperKey}
          itemMeta={viewableItemContextValue.itemMeta}
          {...refProps}
          {...rest}
        >
          <MemoedViewableItem
            {...rest}
            itemMeta={viewableItemContextValue.itemMeta}
            viewableItemHelperKey={viewableItemHelperKey}
          >
            {children}
          </MemoedViewableItem>
        </RenderComponent>
      </ViewableItemContext.Provider>
    );
  };

  return (React.forwardRef(
    (
      props: ViewableItemProps & React.ComponentProps<T>,
      ref: ForwardedRef<T>
    ) => {
      return <ViewableComponent {...props} forwardRef={ref} />;
    }
  ) as any) as FC<ViewableItemProps & React.ComponentProps<T>>;
};

export default createViewableComponent;
