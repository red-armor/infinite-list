import React, {
  FC,
  ForwardedRef,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { ViewStyle, StyleSheet } from 'react-native';

import ScrollViewContext from '../context/ScrollViewContext';
// import ViewabilityContext from '../context/ViewabilityContext';
// import ViewableItemContext from '../context/ViewableItemContext';
// import useBindGeneral from '../hooks/useBindGeneral';
// import useMeasureLayout from '../hooks/useMeasureLayout';
import { ViewableItemProps } from '../types';
// import MemoedViewableItem from './Item';

const createViewableComponent = <T extends React.ComponentType<any>>(
  Component: T
) => {
  const ViewableComponent: FC<
    PropsWithChildren<ViewableItemProps> & React.ComponentProps<T>
  > = (props) => {
    const {
      style: _style = {},
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
    const containerStyle = useMemo<ViewStyle>(
      () => StyleSheet.flatten([_style, { elevation: 0 }]),
      [_style]
    );

    const defaultRef = useRef();
    const viewRef = forwardRef || defaultRef;

    const { marshal, intersectionObserver } = useContext(ScrollViewContext);

    const viewableItemHelperKeyRef = useRef(viewableItemHelperKey);

    useEffect(() => {
      if (intersectionObserver) {
        return intersectionObserver.observe(
          viewRef.current,
          viewableItemHelperKeyRef.current
        );
      }
    }, [intersectionObserver]);

    const layoutHandler = useCallback(() => {
      if (intersectionObserver) {
        intersectionObserver.updateClientRect(viewRef.current);
      }
    }, [intersectionObserver]);

    const RenderComponent = useMemo(
      () => CellRendererComponent || Component,
      [Component, CellRendererComponent]
    );

    // TODO: temp fix
    // Warning: Function components cannot be given refs. Attempts to
    // access this ref will fail. Did you mean to use React.forwardRef()?
    const refProps = useMemo(() => {
      if (CellRendererComponent) return {};
      return { ref: viewRef };
    }, []);

    return (
      <RenderComponent
        style={containerStyle}
        onLayout={layoutHandler}
        key={containerKey || viewableItemHelperKey}
        cellKey={viewableItemHelperKey}
        {...refProps}
        {...rest}
      >
        {children}
      </RenderComponent>
    );
  };

  return React.forwardRef(
    (
      props: ViewableItemProps & React.ComponentProps<T>,
      ref: ForwardedRef<T>
    ) => {
      return <ViewableComponent {...props} forwardRef={ref} />;
    }
  ) as any as FC<ViewableItemProps & React.ComponentProps<T>>;
};

export default createViewableComponent;
