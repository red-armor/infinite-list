import { Fragment } from 'react';

import { GenericItemT, RecycleStateResult } from '@infinite-list/data-model';
import { ColumnStateRendererProps } from './types';

import RecycleItem from './RecycleItem';
import SpaceItem from './SpaceItem';

const ColumnStateRenderer = <ItemT extends GenericItemT>(
  props: ColumnStateRendererProps<ItemT>
) => {
  const { state, columnIndex, columnDimensions, ...rest } = props;
  const current = state[0] as RecycleStateResult<ItemT>;
  return (
    <Fragment>
      {current.spaceState.map((data) => (
        <SpaceItem
          {...rest}
          data={data}
          key={data.key}
          columnIndex={columnIndex}
          columnDimension={columnDimensions[columnIndex]}
        />
      ))}
      {current.recycleState.map((data) => (
        <RecycleItem
          {...rest}
          data={data}
          key={data.key}
          columnIndex={columnIndex}
          columnDimension={columnDimensions[columnIndex]}
        />
      ))}
    </Fragment>
  );
};

export default ColumnStateRenderer;
