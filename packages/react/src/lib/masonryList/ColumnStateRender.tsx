import { Fragment } from 'react';

import { GenericItemT, RecycleStateResult } from '@infinite-list/data-model';
import { ColumnStateRendererProps } from './types';

import RecycleItem from './RecycleItem';
import SpaceItem from './SpaceItem';

const ColumnStateRenderer = <ItemT extends GenericItemT>(
  props: ColumnStateRendererProps<ItemT>
) => {
  const { state, columnIndex, ...rest } = props;
  const current = state[0] as RecycleStateResult<ItemT>;
  return (
    <Fragment>
      {current.spaceState.map((data) => (
        <SpaceItem {...rest} data={data} columnIndex={columnIndex} />
      ))}
      {current.recycleState.map((data) => (
        <RecycleItem {...rest} data={data} columnIndex={columnIndex} />
      ))}
    </Fragment>
  );
};

export default ColumnStateRenderer;
