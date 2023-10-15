import React, { useContext, useEffect, useMemo, useRef } from 'react';
import context from '../context';
import { DimensionExperimental as Dimension } from '@infinite-list/data-model';

export default (props) => {
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
    // @ts-ignore
    dimensionRef.current = dimensions;

    initialRef.current = false;
  }

  useMemo(() => {
    const clonedChildren = children
      ? React.cloneElement(children, {
          itemMeta: dimensionRef.current?.getMeta(),
        })
      : children;

    // @ts-ignore
    dimensionRef.current!.renderItem = clonedChildren;
  }, [children]);

  useEffect(
    () => () => {
      if (typeof disposerRef.current === 'function') disposerRef.current();
    },
    []
  );
};
