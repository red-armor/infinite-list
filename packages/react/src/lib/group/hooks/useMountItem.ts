import type { Dimension, GenericItemT } from '@infinite-list/data-model';
import * as React from 'react';
import { useContext, useEffect, useMemo, useRef } from 'react';

import context from '../context';
import type { GroupListItemImplProps } from '../types';

export default <ItemT extends GenericItemT>(
  props: GroupListItemImplProps<ItemT>
) => {
  const disposerRef = useRef<Function>();
  const initialRef = useRef(true);
  const listGroupDimensions = useContext(context).listGroupDimensions!;
  const { itemKey, children, ...rest } = props;

  const dimensionRef = useRef<Dimension>();

  if (initialRef.current) {
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
      ? React.cloneElement(children, {
          itemMeta: dimensionRef.current?.getMeta(),
        })
      : children;

    dimensionRef.current!.renderItem = clonedChildren;
  }, [children]);

  useEffect(
    () => () => {
      if (typeof disposerRef.current === 'function') disposerRef.current();
    },
    []
  );
};
