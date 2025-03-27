import type { Dimension, GenericItemT } from '@infinite-list/dimension';
import * as React from 'react';
import { useContext, useEffect, useMemo, useRef } from 'react';

import type { GroupDimensionItemProps } from '../../types';
import type { ContextType } from '../context';
import context from '../context';

export default <ItemT extends GenericItemT>(
  props: GroupDimensionItemProps<ItemT>
) => {
  const disposerRef = useRef<Function>();
  const initialRef = useRef(true);
  const {listGroupDimensions} = useContext<ContextType<ItemT>>(context);
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
      ? // @ts-ignore [TODO]
        React.cloneElement(children, {
          itemMeta: dimensionRef.current?.getMeta(),
        })
      : children;

    // @ts-ignore [TODO]
    dimensionRef.current!.renderItem = clonedChildren;
  }, [children]);

  useEffect(
    () => () => {
      if (typeof disposerRef.current === 'function') disposerRef.current();
    },
    []
  );
};
