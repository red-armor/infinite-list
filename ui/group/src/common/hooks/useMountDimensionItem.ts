import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { Dimension, GenericItemT } from '@infinite-list/dimension';
import { GroupDimensionItemProps } from '../../types';
import context, { ContextType } from '../context';

export default <ItemT extends GenericItemT>(
  props: GroupDimensionItemProps<ItemT>
) => {
  const disposerRef = useRef<(() => void) | undefined>();
  const initialRef = useRef(true);
  const listGroupDimensions =
    useContext<ContextType<ItemT>>(context).listGroupDimensions;
  const { itemKey, children, ...rest } = props;

  const dimensionRef = useRef<Dimension>();

  if (initialRef.current && listGroupDimensions) {
    const { remover, dimensions } = listGroupDimensions.registerItem(
      itemKey,
      rest
    );
    disposerRef.current = remover;
    dimensionRef.current = dimensions;

    initialRef.current = false;
  }

  useMemo(() => {
    const clonedChildren = children
      ? // @ts-expect-error - React.cloneElement type mismatch
        React.cloneElement(children, {
          itemMeta: dimensionRef.current?.getMeta(),
        })
      : children;

    // @ts-expect-error - renderItem property assignment type mismatch
    dimensionRef.current!.renderItem = clonedChildren;
  }, [children]);

  useEffect(
    () => () => {
      if (typeof disposerRef.current === 'function') disposerRef.current();
    },
    []
  );
};
